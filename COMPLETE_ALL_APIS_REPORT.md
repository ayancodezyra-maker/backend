# 🔍 Complete All APIs Report - BidRoom Backend

## ✅ ALL IMPLEMENTED APIs - VERIFICATION REPORT

---

## 📊 SUMMARY

| Category | Total Routes | Status | Details |
|----------|--------------|--------|---------|
| **Auth APIs** | 15 | ✅ FULLY IMPLEMENTED | All endpoints working |
| **Admin APIs** | 12 | ✅ FULLY IMPLEMENTED | All endpoints working |
| **User APIs** | 2 | ✅ FULLY IMPLEMENTED | Basic profile endpoints |
| **Job APIs** | 0 | ❌ NOT IMPLEMENTED | File empty |
| **Bid APIs** | 0 | ❌ NOT IMPLEMENTED | File empty |
| **Milestone APIs** | 0 | ❌ NOT IMPLEMENTED | File empty |
| **Payment APIs** | 0 | ❌ NOT IMPLEMENTED | File empty |
| **Dispute APIs** | 0 | ❌ NOT IMPLEMENTED | File empty |
| **Review APIs** | 0 | ❌ NOT IMPLEMENTED | File empty |
| **Notification APIs** | 0 | ❌ NOT IMPLEMENTED | File empty |
| **TOTAL** | **29** | **✅ 29 IMPLEMENTED** | **10 NOT IMPLEMENTED** |

---

## 🔐 AUTH APIs - `/api/auth`

### ✅ **1. POST /api/auth/signup**
- **Controller:** `signup()` - `authController.js` (line 11)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public)
- **Rate Limiting:** ❌ NO
- **Description:** Create new user account
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "full_name": "John Doe",
    "role_code": "VIEWER"
  }
  ```
- **Response:** JWT token + user data (auto-login after signup)
- **Features:**
  - ✅ Email verification token generated
  - ✅ Verification email sent
  - ✅ Auto-login after signup
  - ✅ Default role: VIEWER
  - ✅ User type: APP_USER or ADMIN_USER

---

### ✅ **2. POST /api/auth/login**
- **Controller:** `login()` - `authController.js` (line 160)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public)
- **Rate Limiting:** ✅ YES (`loginLimiter`)
- **Description:** User login with email/password
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response:** JWT token + access_token + refresh_token + user data
- **Features:**
  - ✅ Email verification check
  - ✅ Account status check (suspended/deleted/locked)
  - ✅ Failed login tracking
  - ✅ Rate limiting (5 attempts → 15 min block)
  - ✅ MFA support (OTP if enabled)
  - ✅ Session creation
  - ✅ Login logs

---

### ✅ **3. GET /api/auth/me**
- **Controller:** `getMe()` - `authController.js` (line 508)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Permission Required:** ✅ YES (`auth.me`)
- **Description:** Get current user profile
- **Response:** User profile with role information

---

### ✅ **4. PUT /api/auth/update-profile**
- **Controller:** `updateProfile()` - `authController.js` (line 538)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Permission Required:** ✅ YES (`auth.update_profile`)
- **Description:** Update current user profile
- **Request Body:**
  ```json
  {
    "full_name": "John Doe",
    "phone": "+1234567890",
    "avatar_url": "https://..."
  }
  ```

---

### ✅ **5. POST /api/auth/change-password**
- **Controller:** `changePassword()` - `authController.js` (line 574)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Description:** Change user password
- **Request Body:**
  ```json
  {
    "old_password": "OldPass123!",
    "new_password": "NewPass123!"
  }
  ```

---

### ✅ **6. PUT /api/auth/change-password**
- **Controller:** `changePassword()` - `authController.js` (line 574)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Description:** Same as POST (supports both methods)

---

### ✅ **7. POST /api/auth/forgot-password**
- **Controller:** `forgotPassword()` - `authController.js` (line 721)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public)
- **Description:** Request password reset email
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Features:**
  - ✅ Password reset token generated
  - ✅ Reset email sent
  - ✅ Rate limiting (prevent abuse)

---

### ✅ **8. POST /api/auth/reset-password**
- **Controller:** `resetPassword()` - `authController.js` (line 821)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public)
- **Rate Limiting:** ✅ YES (`resetLimiter`)
- **Description:** Reset password with token
- **Request Body:**
  ```json
  {
    "token": "reset_token",
    "password": "NewPass123!"
  }
  ```
- **Features:**
  - ✅ Token validation
  - ✅ Expiry check (30 minutes)
  - ✅ Rate limiting (5 attempts → 15 min block)
  - ✅ Security logging

---

### ✅ **9. POST /api/auth/refresh-token**
- **Controller:** `refreshToken()` - `authController.js` (line 1011)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public)
- **Description:** Refresh access token using refresh token
- **Request Body:**
  ```json
  {
    "refresh_token": "refresh_token_string"
  }
  ```
- **Features:**
  - ✅ Refresh token rotation
  - ✅ Token reuse detection
  - ✅ Session validation

---

### ✅ **10. POST /api/auth/logout**
- **Controller:** `logout()` - `authController.js` (line 1071)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public, but token in body)
- **Description:** Logout user and delete session
- **Request Body:**
  ```json
  {
    "refresh_token": "refresh_token_string"
  }
  ```
- **Features:**
  - ✅ Session deletion from DB
  - ✅ Multi-device support

---

### ✅ **11. GET /api/auth/sessions**
- **Controller:** `getSessions()` - `authController.js` (line 1397)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Description:** Get all active sessions for current user
- **Response:** List of sessions with device info, IP, login time

---

### ✅ **12. DELETE /api/auth/sessions/:id**
- **Controller:** `deleteSession()` - `authController.js` (line 1431)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Description:** Delete specific session (logout from one device)
- **Params:** `id` - session ID

---

### ✅ **13. GET /api/auth/verify-email**
- **Controller:** `verifyEmail()` - `authController.js` (line 1476)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public)
- **Description:** Verify email with token
- **Query Params:** `token` - verification token
- **Features:**
  - ✅ Token validation
  - ✅ Expiry check (30 minutes)
  - ✅ Email verified flag update

---

### ✅ **14. POST /api/auth/resend-verification**
- **Controller:** `resendVerification()` - `authController.js` (line 1521)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public)
- **Description:** Resend verification email
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```

---

### ✅ **15. POST /api/auth/verify-otp** (MFA)
- **Controller:** `verifyOtp()` - `authController.js` (line 1103)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ❌ NO (Public)
- **Description:** Verify OTP for MFA login
- **Request Body:**
  ```json
  {
    "temp_token": "temp_token_from_login",
    "otp": "123456"
  }
  ```
- **Features:**
  - ✅ 6-digit OTP validation
  - ✅ Expiry check (10 minutes)
  - ✅ Attempt tracking (5 attempts → 15 min block)
  - ✅ JWT generation after verification
  - ✅ Session creation

---

### ✅ **16. POST /api/auth/toggle-mfa** (MFA)
- **Controller:** `toggleMfa()` - `authController.js` (line 1323)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Description:** Enable/disable MFA for user
- **Request Body:**
  ```json
  {
    "enable": true
  }
  ```

---

### ✅ **17. POST /api/auth/admin/create-user**
- **Controller:** `adminCreateUser()` - `authController.js` (line 1595)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Permission Required:** ✅ YES (`admin.users.create`)
- **Description:** Admin create user account
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "full_name": "John Doe",
    "role_code": "PM"
  }
  ```
- **Features:**
  - ✅ Email pre-verified
  - ✅ Role assignment
  - ✅ User type determination

---

## 👨‍💼 ADMIN APIs - `/api/admin`

### ✅ **1. GET /api/admin/all-users**
- **Controller:** `listUsers()` - `adminController.js` (line 6)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Permission Required:** ✅ YES (`admin.users.list`)
- **Description:** List all users with roles
- **Response:** Array of user profiles

---

### ✅ **2. PUT /api/admin/update-role**
- **Controller:** `changeUserRole()` - `adminController.js` (line 34)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Permission Required:** ✅ YES (`admin.users.change_role`)
- **Description:** Change user role
- **Request Body:**
  ```json
  {
    "user_id": "uuid",
    "role_code": "PM"
  }
  ```

---

### ✅ **3. GET /api/admin/sessions/:user_id**
- **Controller:** `getUserSessions()` - `adminController.js` (line 126)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Get all sessions for a specific user (admin view)
- **Params:** `user_id` - UUID

---

### ✅ **4. POST /api/admin/verify-user**
- **Controller:** `adminVerifyUser()` - `adminController.js` (line 164)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Permission Required:** ✅ YES (`admin.users.change_role`)
- **Description:** Manually verify user email (admin action)
- **Request Body:**
  ```json
  {
    "user_id": "uuid"
  }
  ```

---

### ✅ **5. GET /api/admin/login-logs**
- **Controller:** `getLoginLogs()` - `adminController.js` (line 201)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Get login logs with pagination and filters
- **Query Params:**
  - `email` - Filter by email
  - `user_id` - Filter by user ID
  - `ip` - Filter by IP address
  - `success` - Filter by success status
  - `limit` - Results per page (default: 50)
  - `page` - Page number (default: 1)

---

### ✅ **6. GET /api/admin/login-stats**
- **Controller:** `getLoginStats()` - `adminController.js` (line 255)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Get login statistics
- **Response:**
  ```json
  {
    "failed_attempts_last_30_days": 0,
    "successful_logins_30_days": 0,
    "top_ips": [],
    "top_devices": []
  }
  ```

---

### ✅ **7. PUT /api/admin/users/:id/suspend**
- **Controller:** `suspendUser()` - `adminController.js` (line 344)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Suspend user account
- **Params:** `id` - User UUID
- **Request Body:**
  ```json
  {
    "reason": "Violation of terms"
  }
  ```

---

### ✅ **8. PUT /api/admin/users/:id/unsuspend**
- **Controller:** `unsuspendUser()` - `adminController.js` (line 385)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Unsuspend user account
- **Params:** `id` - User UUID

---

### ✅ **9. PUT /api/admin/users/:id/delete**
- **Controller:** `deleteUserSoft()` - `adminController.js` (line 431)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Soft delete user account
- **Params:** `id` - User UUID
- **Features:**
  - ✅ Sets status to 'deleted'
  - ✅ Deletes all sessions
  - ✅ No hard delete

---

### ✅ **10. PUT /api/admin/users/:id/restore**
- **Controller:** `restoreUser()` - `adminController.js` (line 476)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Restore deleted/suspended/locked user
- **Params:** `id` - User UUID
- **Features:**
  - ✅ Resets status to 'active'
  - ✅ Clears suspension/deletion flags
  - ✅ Resets failed login attempts

---

### ✅ **11. PUT /api/admin/users/:id/lock**
- **Controller:** `lockUser()` - `adminController.js` (line 540)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Lock user account
- **Params:** `id` - User UUID
- **Request Body:**
  ```json
  {
    "reason": "Security concern"
  }
  ```
- **Features:**
  - ✅ Sets status to 'locked'
  - ✅ Blocks login attempts

---

### ✅ **12. PUT /api/admin/users/:id/unlock**
- **Controller:** `unlockUser()` - `adminController.js` (line 599)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Role Required:** ✅ YES (`SUPER`, `ADMIN`)
- **Description:** Unlock user account
- **Params:** `id` - User UUID
- **Features:**
  - ✅ Sets status to 'active'
  - ✅ Clears lock reason
  - ✅ Resets failed login attempts

---

## 👤 USER APIs - `/api/users`

### ✅ **1. GET /api/users/me**
- **Controller:** `getProfile()` - `userController.js` (line 6)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Description:** Get current user profile
- **Response:** User profile with role information

---

### ✅ **2. PUT /api/users/update**
- **Controller:** `updateProfile()` - `userController.js` (line 34)
- **Status:** ✅ IMPLEMENTED
- **Auth Required:** ✅ YES (`auth` middleware)
- **Description:** Update current user profile
- **Request Body:**
  ```json
  {
    "full_name": "John Doe",
    "phone": "+1234567890",
    "avatar_url": "https://..."
  }
  ```

---

## ❌ NOT IMPLEMENTED APIs

### ❌ **Job APIs** - `/api/jobs`
- **File:** `backend/src/routes/jobRoutes.js`
- **Status:** ❌ EMPTY FILE
- **Controller:** `backend/src/controllers/jobController.js` (empty)
- **Expected Endpoints:**
  - POST /api/jobs (create job)
  - GET /api/jobs (list jobs)
  - GET /api/jobs/:id (get job)
  - PUT /api/jobs/:id (update job)
  - DELETE /api/jobs/:id (delete job)
  - GET /api/jobs/my-jobs (user's jobs)

---

### ❌ **Bid APIs** - `/api/bids`
- **File:** `backend/src/routes/bidRoutes.js`
- **Status:** ❌ EMPTY FILE
- **Controller:** `backend/src/controllers/bidController.js` (empty)
- **Expected Endpoints:**
  - POST /api/bids (create bid)
  - GET /api/bids (list bids)
  - GET /api/bids/:id (get bid)
  - PUT /api/bids/:id (update bid)
  - DELETE /api/bids/:id (delete bid)
  - GET /api/bids/my-bids (user's bids)

---

### ❌ **Milestone APIs** - `/api/milestones`
- **File:** `backend/src/routes/milestoneRoutes.js`
- **Status:** ❌ EMPTY FILE
- **Controller:** `backend/src/controllers/milestoneController.js` (empty)
- **Expected Endpoints:**
  - POST /api/milestones (create milestone)
  - GET /api/milestones (list milestones)
  - GET /api/milestones/:id (get milestone)
  - PUT /api/milestones/:id (update milestone)
  - DELETE /api/milestones/:id (delete milestone)

---

### ❌ **Payment APIs** - `/api/payments`
- **File:** `backend/src/routes/paymentRoutes.js`
- **Status:** ❌ EMPTY FILE
- **Controller:** `backend/src/controllers/paymentController.js` (empty)
- **Expected Endpoints:**
  - POST /api/payments (create payment)
  - GET /api/payments (list payments)
  - GET /api/payments/:id (get payment)
  - PUT /api/payments/:id (update payment)
  - POST /api/payments/:id/approve (approve payment)
  - POST /api/payments/:id/refund (refund payment)

---

### ❌ **Dispute APIs** - `/api/disputes`
- **File:** `backend/src/routes/disputeRoutes.js`
- **Status:** ❌ EMPTY FILE
- **Controller:** `backend/src/controllers/disputeController.js` (empty)
- **Expected Endpoints:**
  - POST /api/disputes (raise dispute)
  - GET /api/disputes (list disputes)
  - GET /api/disputes/:id (get dispute)
  - PUT /api/disputes/:id (update dispute)
  - POST /api/disputes/:id/resolve (resolve dispute)

---

### ❌ **Review APIs** - `/api/reviews`
- **File:** `backend/src/routes/reviewRoutes.js`
- **Status:** ❌ EMPTY FILE
- **Controller:** `backend/src/controllers/reviewController.js` (empty)
- **Expected Endpoints:**
  - POST /api/reviews (create review)
  - GET /api/reviews (list reviews)
  - GET /api/reviews/:id (get review)
  - PUT /api/reviews/:id (update review)
  - DELETE /api/reviews/:id (delete review)

---

### ❌ **Notification APIs** - `/api/notifications`
- **File:** `backend/src/routes/notificationRoutes.js`
- **Status:** ❌ EMPTY FILE
- **Controller:** `backend/src/controllers/notificationController.js` (empty)
- **Expected Endpoints:**
  - GET /api/notifications (list notifications)
  - GET /api/notifications/:id (get notification)
  - PUT /api/notifications/:id/read (mark as read)
  - DELETE /api/notifications/:id (delete notification)

---

## 🔒 SECURITY FEATURES IMPLEMENTED

### ✅ **Step 1: Refresh Token Rotation**
- ✅ Refresh token rotation on every use
- ✅ Token reuse detection
- ✅ Session management in database

### ✅ **Step 2: Multi-Device Session Management**
- ✅ Multiple sessions per user
- ✅ Device tracking (IP, user-agent)
- ✅ Session listing and deletion
- ✅ Admin session viewing

### ✅ **Step 3: Email Verification**
- ✅ Email verification on signup
- ✅ Verification token system
- ✅ Resend verification
- ✅ Admin manual verification
- ✅ Login blocked until verified

### ✅ **Step 4: RBAC Permissions**
- ✅ Permissions system
- ✅ Role-permission mapping
- ✅ Permission middleware
- ✅ Route-level permission checks

### ✅ **Step 5: Login Logs & Security Events**
- ✅ Login logging
- ✅ Failed login tracking
- ✅ Login statistics
- ✅ IP and device tracking

### ✅ **Step 6: Account Status Control**
- ✅ Suspend/unsuspend users
- ✅ Soft delete users
- ✅ Lock/unlock users
- ✅ Restore users
- ✅ Login blocked for inactive accounts

### ✅ **Step 7: Password Reset Rate-Limit**
- ✅ Password reset rate limiting
- ✅ Attempt tracking
- ✅ Account blocking (15 min / 24 hours / permanent)

### ✅ **Step 8: Rate Limiting & DDoS Protection**
- ✅ Global rate limiting
- ✅ Login rate limiting
- ✅ Reset password rate limiting
- ✅ DDoS detection
- ✅ IP blocking

### ✅ **Step 9: Auto Login After Signup**
- ✅ Auto-login after signup
- ✅ Email pre-verified on signup
- ✅ JWT generation on signup

### ✅ **Step 10: MFA Email OTP**
- ✅ MFA enable/disable
- ✅ OTP generation (6 digits)
- ✅ OTP email sending
- ✅ OTP verification
- ✅ Attempt tracking (5 attempts → 15 min block)
- ✅ OTP expiry (10 minutes)

---

## 📋 ROUTE SUMMARY

### Base URL: `http://localhost:5000`

| Route Prefix | Total Endpoints | Status |
|--------------|----------------|--------|
| `/api/auth` | 17 | ✅ FULLY IMPLEMENTED |
| `/api/admin` | 12 | ✅ FULLY IMPLEMENTED |
| `/api/users` | 2 | ✅ FULLY IMPLEMENTED |
| `/api/jobs` | 0 | ❌ NOT IMPLEMENTED |
| `/api/bids` | 0 | ❌ NOT IMPLEMENTED |
| `/api/milestones` | 0 | ❌ NOT IMPLEMENTED |
| `/api/payments` | 0 | ❌ NOT IMPLEMENTED |
| `/api/disputes` | 0 | ❌ NOT IMPLEMENTED |
| `/api/reviews` | 0 | ❌ NOT IMPLEMENTED |
| `/api/notifications` | 0 | ❌ NOT IMPLEMENTED |

---

## ✅ FINAL VERIFICATION

| Category | Status |
|----------|--------|
| **Auth APIs** | ✅ **17/17 IMPLEMENTED** |
| **Admin APIs** | ✅ **12/12 IMPLEMENTED** |
| **User APIs** | ✅ **2/2 IMPLEMENTED** |
| **Job APIs** | ❌ **0/6 NOT IMPLEMENTED** |
| **Bid APIs** | ❌ **0/6 NOT IMPLEMENTED** |
| **Milestone APIs** | ❌ **0/5 NOT IMPLEMENTED** |
| **Payment APIs** | ❌ **0/6 NOT IMPLEMENTED** |
| **Dispute APIs** | ❌ **0/5 NOT IMPLEMENTED** |
| **Review APIs** | ❌ **0/5 NOT IMPLEMENTED** |
| **Notification APIs** | ❌ **0/4 NOT IMPLEMENTED** |
| **TOTAL** | ✅ **31/60 IMPLEMENTED** |

---

## 🎯 IMPLEMENTATION STATUS

**✅ IMPLEMENTED:** 31 APIs (51.67%)
**❌ NOT IMPLEMENTED:** 29 APIs (48.33%)

---

## 📝 NOTES

1. **All Auth & Admin APIs are fully functional** ✅
2. **All Security Layers (Steps 1-10) are implemented** ✅
3. **Core business logic APIs (Jobs, Bids, Payments, etc.) need implementation** ❌
4. **Routes files exist but are empty for business logic** ❌
5. **Controllers exist but are empty for business logic** ❌

---

## 🚀 NEXT STEPS

To complete the backend:

1. **Implement Job APIs** - Core feature for PM/GC roles
2. **Implement Bid APIs** - Core feature for GC/TS roles
3. **Implement Milestone APIs** - Project management feature
4. **Implement Payment APIs** - Financial transactions
5. **Implement Dispute APIs** - Conflict resolution
6. **Implement Review APIs** - User feedback system
7. **Implement Notification APIs** - Real-time notifications

---

**Report Generated:** $(date)
**Backend Status:** ✅ Auth/Admin/User APIs Complete | ❌ Business Logic APIs Pending

