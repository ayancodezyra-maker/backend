# BidRoom Backend - Complete Implementation

## 🎯 Overview

Complete production-ready backend implementation with:
- ✅ Full RBAC permission system
- ✅ All database tables with foreign keys and indexes
- ✅ Complete service layer with permission checks
- ✅ Row-Level Security (RLS) policies
- ✅ RESTful API endpoints

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/                    # Authentication
│   ├── permissions/             # RBAC permission engine
│   │   ├── rolePermissions.js
│   │   └── rolePermissions.ts
│   ├── projects/                # Project management
│   │   ├── projectService.js
│   │   ├── projectController.js
│   │   └── projectRoutes.js
│   ├── milestones/              # Milestone management
│   ├── bids/                    # Bid management
│   ├── jobs/                    # Job management
│   ├── payments/                # Payment & payout management
│   ├── contractors/             # Contractor management
│   ├── conversations/           # Conversation & messaging
│   ├── notifications/           # Notification system
│   ├── progress/                # Progress updates
│   ├── reviews/                 # Review system
│   ├── disputes/                # Dispute management
│   ├── config/
│   ├── middlewares/
│   └── utils/
├── migrations/
│   ├── complete_schema_with_constraints.sql
│   ├── rls_policies_complete.sql
│   └── seed_permissions_final.sql
└── server.js
```

## 🚀 Setup

### 1. Database Setup

Run these SQL files in Supabase SQL Editor in order:

1. **Schema & Constraints:**
   ```sql
   \i backend/migrations/complete_schema_with_constraints.sql
   ```

2. **RLS Policies:**
   ```sql
   \i backend/migrations/rls_policies_complete.sql
   ```

3. **Seed Permissions:**
   ```sql
   \i backend/migrations/seed_permissions_final.sql
   ```

### 2. Environment Variables

Create `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Server

```bash
npm start
```

## 📋 API Endpoints

### Projects
- `POST /api/projects` - Create project (requires: canCreateBids)
- `GET /api/projects` - Get user's projects
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project (requires: canEditAllProjects)

### Milestones
- `POST /api/milestones/projects/:projectId` - Create milestone
- `GET /api/milestones/projects/:projectId` - Get project milestones
- `PUT /api/milestones/:id` - Update milestone
- `POST /api/milestones/:id/submit` - Submit milestone
- `POST /api/milestones/:id/approve` - Approve milestone

### Bids
- `POST /api/bids` - Create bid (requires: canCreateBids)
- `GET /api/bids` - Get all bids (filtered by permission)
- `GET /api/bids/:id` - Get bid by ID
- `PUT /api/bids/:id` - Update bid
- `POST /api/bids/:bidId/submit` - Submit bid (requires: canCreateBids)
- `GET /api/bids/:bidId/submissions` - Get bid submissions
- `GET /api/bids/submissions/my` - Get user's submissions

### Jobs
- `POST /api/jobs` - Create job (requires: canPostJobs)
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job
- `POST /api/jobs/:jobId/apply` - Apply to job
- `GET /api/jobs/:jobId/applications` - Get job applications (requires: canManageApplications)
- `PUT /api/jobs/applications/:applicationId/status` - Update application status (requires: canManageApplications)

### Payments
- `POST /api/payments` - Create payment (requires: canManagePayments)
- `GET /api/payments` - Get all payments (filtered by permission)
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id` - Update payment (requires: canManagePayments)
- `GET /api/payments/projects/:projectId` - Get project payments

### Payouts
- `POST /api/payouts` - Create payout (requires: canManagePayments)
- `GET /api/payouts` - Get all payouts (filtered by permission)
- `GET /api/payouts/:id` - Get payout by ID
- `PUT /api/payouts/:id/status` - Update payout status (requires: canManagePayments)

### Contractors
- `GET /api/contractors` - Get all contractors
- `GET /api/contractors/search` - Search contractors
- `GET /api/contractors/:id` - Get contractor by ID
- `PUT /api/contractors/:id` - Update contractor
- `GET /api/contractors/profiles/:userId` - Get contractor profile
- `POST /api/contractors/profiles` - Create/update contractor profile
- `PUT /api/contractors/profiles/:userId/verify` - Verify contractor (admin only)

### Conversations
- `POST /api/conversations` - Create or get conversation
- `GET /api/conversations` - Get user's conversations
- `GET /api/conversations/:id` - Get conversation by ID

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations/:conversationId` - Get conversation messages
- `PUT /api/messages/conversations/:conversationId/read` - Mark messages as read
- `GET /api/messages/unread/count` - Get unread count

### Notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read/all` - Mark all as read
- `GET /api/notifications/unread/count` - Get unread count
- `DELETE /api/notifications/:id` - Delete notification

### Progress Updates
- `POST /api/progress-updates` - Create progress update
- `GET /api/progress-updates/projects/:projectId` - Get project progress updates
- `GET /api/progress-updates/:id` - Get progress update by ID

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/contractors/:contractorId` - Get contractor reviews
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews/:id/response` - Add review response

### Disputes
- `POST /api/disputes` - File dispute
- `GET /api/disputes/projects/:projectId` - Get project disputes
- `GET /api/disputes/:id` - Get dispute by ID
- `PUT /api/disputes/:id/status` - Update dispute status (admin only)
- `PUT /api/disputes/:id/assign` - Assign dispute (admin only)

## 🔐 Permission Matrix

### Admin (SUPER, ADMIN, FIN, SUPPORT, MOD)
✅ All 10 permissions enabled

### GC
✅ canCreateBids, canViewAllBids, canEditAllProjects, canManagePayments, canViewReports, canInviteContractors, canSchedule

### Project Manager
✅ canCreateBids, canViewAllBids, canViewReports, canInviteContractors, canSchedule, canPostJobs, canManageApplications

### Subcontractor
❌ All permissions false

### Trade Specialist
❌ All permissions false

### Viewer
✅ canViewReports (ONLY permission)

## 🛡️ Security Features

1. **RBAC Permission System** - Centralized permission checks
2. **Row-Level Security** - Database-level access control
3. **JWT Authentication** - Secure token-based auth
4. **Permission Guards** - Route-level permission middleware
5. **Service-Level Validation** - Additional permission checks in services

## 📝 Notes

- All services follow consistent patterns
- Permission checks at both middleware and service levels
- Foreign keys enforce referential integrity
- RLS policies provide defense-in-depth security
- All endpoints return consistent JSON responses

## 🚧 Development

### Adding New Endpoints

1. Create service in appropriate folder
2. Create controller with error handling
3. Create routes with permission guards
4. Register routes in `server.js`

### Permission Checks

Use the `guard()` middleware:
```javascript
import { guard } from '../permissions/rolePermissions.js';
router.post('/', auth, guard('canCreateBids'), handler);
```

Or check in services:
```javascript
import { hasPermission } from '../permissions/rolePermissions.js';
if (!hasPermission(roleCode, roleName, 'canCreateBids')) {
  return formatResponse(false, 'Permission denied', null);
}
```

## ✅ Production Ready

- Complete database schema
- All foreign keys and indexes
- RLS policies for all tables
- Complete service layer
- Permission system implemented
- Consistent error handling
- RESTful API design

