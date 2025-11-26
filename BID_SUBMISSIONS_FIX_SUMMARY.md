# Bid Submissions Fix Summary

## Issues Fixed

1. ✅ **NULL created_by constraint violation** - Fixed by always setting `created_by = req.user.id` in backend
2. ✅ **Missing created_by column** - Added SQL migration to add column
3. ✅ **RLS policy compatibility** - Updated policies to match `created_by = auth.uid()`
4. ✅ **Missing validation** - Added role validation and contractor_id validation
5. ✅ **Incomplete field handling** - Now accepts all fields: proposal, timeline_days, amount, documents, notes

## Files Modified

### Backend Files

1. **backend/src/bids/bidController.js**
   - Added validation for `req.user.id` existence
   - Added role validation (must be contractor: SUB role code or Subcontractor role name)
   - Added validation that `contractor_id` matches `req.user.id` if provided
   - Strips `created_by` from request body (never accepts from client)
   - Added `updateBidSubmission` and `getBidSubmissionById` controllers

2. **backend/src/bids/bidSubmissionService.js**
   - Updated `submitBid` to accept all fields: `proposal`, `timeline_days`, `amount`, `documents`, `notes`
   - Always sets `created_by = userId` (never NULL)
   - Uses array format for insert: `.insert([insertData])`
   - Validates `contractor_id` matches `userId`
   - Added `updateBidSubmission` method (only allows creator to update)
   - Added `getBidSubmissionById` method
   - Fixed `getUserSubmissions` to use `created_by` instead of `contractor_id` for RLS compatibility

3. **backend/src/bids/bidRoutes.js**
   - Added route: `POST /bids/:bidId/submissions` (matches requirement)
   - Added route: `GET /bids/submissions/:submissionId`
   - Added route: `PUT /bids/submissions/:submissionId`
   - Reordered routes to prevent conflicts (specific routes before parameterized)

### Database Migration

4. **backend/migrations/fix_bid_submissions_complete.sql**
   - Adds `created_by` column (UUID, NOT NULL, FK to profiles)
   - Adds `notes` column (TEXT)
   - Backfills existing data
   - Creates trigger to auto-fill `created_by` (backup)
   - Sets up RLS policies:
     - INSERT: `(contractor_id = auth.uid() OR created_by = auth.uid())`
     - SELECT: `(created_by = auth.uid())`
     - UPDATE: `(created_by = auth.uid())`
   - Creates index on `created_by`

### TypeScript Types

5. **rork-10_25_bidroom/types/index.ts**
   - Updated `BidSubmission` interface:
     - Added `createdBy: string` (required)
     - Made `notes?: string` optional
     - Added `proposal?: string`
     - Added `timelineDays?: number`
     - Added `status?: string`

## API Endpoints

### Create Submission
- **POST** `/bids/:bidId/submissions` or `/bids/:bidId/submit`
- **Auth**: Required
- **Role**: Must be contractor (SUB role code or Subcontractor role name)
- **Body**:
  ```json
  {
    "amount": 1000.00,
    "proposal": "Optional proposal text",
    "timeline_days": 30,
    "documents": ["url1", "url2"],
    "notes": "Optional notes"
  }
  ```
- **Response**: Created submission with `created_by` automatically set

### Update Submission
- **PUT** `/bids/submissions/:submissionId`
- **Auth**: Required
- **Role**: Must be creator (validated by `created_by`)
- **Body**: Any of: `amount`, `proposal`, `timeline_days`, `documents`, `notes`, `status`
- **Response**: Updated submission

### Get Submission
- **GET** `/bids/submissions/:submissionId`
- **Auth**: Required
- **Role**: Must be creator (RLS enforces `created_by = auth.uid()`)
- **Response**: Single submission

### Get User's Submissions
- **GET** `/bids/submissions/my`
- **Auth**: Required
- **Response**: Array of user's submissions (filtered by `created_by`)

### Get All Submissions for a Bid
- **GET** `/bids/:bidId/submissions`
- **Auth**: Required
- **Permission**: `canViewAllBids` required
- **Response**: Array of all submissions for the bid

## Validation Rules

1. ✅ `req.user.id` must exist → Returns 401 "Unauthorized: User ID missing"
2. ✅ Role must be contractor (SUB or Subcontractor) → Returns 403 "Only contractors can submit bids"
3. ✅ `contractor_id` (if provided) must equal `req.user.id` → Returns 403 "You cannot submit another contractor's bid submission"
4. ✅ `amount` is required → Returns error "Amount is required"
5. ✅ `created_by` is NEVER accepted from request body → Always set to `req.user.id`
6. ✅ Update only allowed by creator → Returns 403 "You can only update your own bid submissions"

## RLS Policy Compatibility

All policies use `created_by = auth.uid()`:
- ✅ INSERT: Allows if `contractor_id = auth.uid() OR created_by = auth.uid()`
- ✅ SELECT: Allows if `created_by = auth.uid()`
- ✅ UPDATE: Allows if `created_by = auth.uid()`

## Testing Checklist

### Create Submission
- [ ] Create submission as contractor → Should succeed
- [ ] Create submission as non-contractor → Should fail with 403
- [ ] Create submission without user ID → Should fail with 401
- [ ] Create submission with wrong contractor_id → Should fail with 403
- [ ] Create submission with created_by in body → Should be ignored, uses req.user.id
- [ ] Verify `created_by` is set correctly in database

### Update Submission
- [ ] Update own submission → Should succeed
- [ ] Update another user's submission → Should fail with 403
- [ ] Try to update created_by → Should be ignored/stripped
- [ ] Verify only allowed fields can be updated

### View Submission
- [ ] View own submission → Should succeed
- [ ] View another user's submission → Should fail (RLS blocks)
- [ ] Get user's submissions → Should only return own submissions

### RLS Testing
- [ ] Direct database insert without created_by → Should fail (NOT NULL constraint)
- [ ] Direct database insert with wrong created_by → Should fail (RLS policy)
- [ ] Direct database select of another user's submission → Should return empty (RLS policy)
- [ ] Direct database update of another user's submission → Should fail (RLS policy)

## Next Steps

1. **Run SQL Migration**: Execute `backend/migrations/fix_bid_submissions_complete.sql` in Supabase SQL Editor
2. **Test Endpoints**: Use the testing checklist above
3. **Verify RLS**: Test direct database access to ensure RLS policies work correctly

## Notes

- The trigger for auto-filling `created_by` is a backup. The primary method is the backend always setting it.
- Both `contractor_id` and `created_by` are set to `userId` for consistency, but RLS uses `created_by`.
- The route `/bids/:bidId/submissions` is added alongside `/bids/:bidId/submit` for compatibility.

