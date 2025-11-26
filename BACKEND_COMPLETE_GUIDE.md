# 🏗️ Backend Complete Guide - Full Explanation
## BidRoom Platform - Complete Backend Architecture

---

## 📋 Table of Contents
1. [Overview - Kya hai yeh backend?](#overview)
2. [Architecture - Kaise banaya gaya hai?](#architecture)
3. [Request Flow - Request kaise process hoti hai?](#request-flow)
4. [Authentication & Authorization](#authentication--authorization)
5. [Database Structure](#database-structure)
6. [Main Modules/Features](#main-modulesfeatures)
7. [Security Features](#security-features)
8. [API Endpoints Summary](#api-endpoints-summary)

---

## 🎯 Overview - Kya hai yeh backend?

Yeh ek **Construction Project Management Platform** ka backend hai jiska naam **BidRoom** hai. Iska main purpose hai:

- **Projects** manage karna (construction projects)
- **Bids** accept/reject karna (contractors se bids)
- **Payments** handle karna (milestone-based payments)
- **Communication** (messages, conversations)
- **Reviews** system
- **Jobs** posting
- **Admin** panel

**Tech Stack:**
- **Node.js + Express** (Server framework)
- **Supabase** (Database - PostgreSQL)
- **JWT** (Authentication tokens)
- **Swagger** (API documentation)

---

## 🏛️ Architecture - Kaise banaya gaya hai?

### Project Structure:
```
backend/
├── src/
│   ├── server.js              # Main entry point
│   ├── config/                # Configuration files
│   │   └── supabaseClient.js  # Database connection
│   ├── routes/                # Route definitions
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── adminRoutes.js
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   ├── middlewares/           # Middleware functions
│   │   ├── auth.js           # JWT authentication
│   │   ├── role.js           # Role checking
│   │   ├── permission.js     # Permission checking
│   │   ├── rateLimit.js      # Rate limiting
│   │   └── validator.js      # Input validation
│   ├── permissions/          # RBAC system
│   │   └── rolePermissions.js
│   ├── projects/             # Project module
│   │   ├── projectService.js
│   │   ├── projectController.js
│   │   └── projectRoutes.js
│   ├── bids/                 # Bid module
│   ├── payments/              # Payment module
│   ├── jobs/                  # Job module
│   ├── conversations/         # Messaging module
│   ├── notifications/         # Notification module
│   ├── reviews/               # Review module
│   ├── disputes/              # Dispute module
│   └── utils/                 # Utility functions
│       ├── formatResponse.js
│       ├── logger.js
│       └── email.js
└── migrations/                # Database SQL files
    └── complete_schema_with_constraints.sql
```

### Architecture Pattern: **MVC (Model-View-Controller)**

1. **Routes** → URL paths define karte hain
2. **Controllers** → Request receive karte hain, validation karte hain
3. **Services** → Business logic handle karte hain, database operations
4. **Models** → Database tables (Supabase mein)

---

## 🔄 Request Flow - Request kaise process hoti hai?

### Complete Flow:

```
1. Client Request
   ↓
2. Express Server (server.js)
   ↓
3. Middleware Chain:
   - CORS
   - Rate Limiting
   - Body Parser
   - Request Logger
   ↓
4. Route Matching (e.g., /api/v1/projects)
   ↓
5. Route Middleware:
   - auth.js (JWT verify)
   - role.js (Role check)
   - permission.js (Permission check)
   ↓
6. Controller (projectController.js)
   - Request data extract
   - Call Service
   ↓
7. Service (projectService.js)
   - Business logic
   - Database operations (Supabase)
   - Permission checks
   ↓
8. Response Format
   - formatResponse() utility
   ↓
9. Client Response
```

### Example Flow:

**Request:** `POST /api/v1/projects` (Create project)

1. **server.js** → Route match karta hai `/api/v1/projects`
2. **projectRoutes.js** → `POST /` route handler
3. **auth.js middleware** → JWT token verify karta hai
4. **permission.js middleware** → `canCreateBids` permission check
5. **projectController.js** → Request body se data extract
6. **projectService.js** → 
   - `owner_id` auto-set (userId se)
   - Database mein insert
   - Response return
7. **formatResponse()** → Standard format mein response
8. **Client** → JSON response receive

---

## 🔐 Authentication & Authorization

### 1. Authentication (Kaun hai user?)

**JWT Token Based:**
- User login karta hai → JWT token milta hai
- Har request mein token header mein bhejna hota hai: `Authorization: Bearer <token>`
- `auth.js` middleware token verify karta hai

**Flow:**
```
Login → JWT Token → Store (localStorage/cookie) → 
Every Request → Header mein token → 
auth.js verify → req.user set → Next
```

### 2. Authorization (User ko kya permission hai?)

**RBAC System (Role-Based Access Control):**

**Roles:**
- **SUPER/ADMIN** → Full access
- **GC** (General Contractor) → Projects, bids manage
- **PM** (Project Manager) → Projects manage
- **SUB** (Subcontractor) → Limited access
- **TS** (Trade Specialist) → Limited access
- **VIEWER** → Read-only

**Permissions Matrix:**
```javascript
Admin: {
  canManageUsers: true,
  canCreateBids: true,
  canViewAllBids: true,
  canEditAllProjects: true,
  canManagePayments: true,
  ...
}

GC: {
  canManageUsers: false,
  canCreateBids: true,
  canViewAllBids: true,
  canEditAllProjects: true,
  ...
}
```

**Permission Check:**
```javascript
// Middleware mein
hasPermission(roleCode, roleName, 'canCreateBids')
// Returns: true/false
```

---

## 🗄️ Database Structure

### Main Tables:

1. **profiles** - User information
   - id, email, name, role_id, role_code, user_type

2. **projects** - Construction projects
   - id, owner_id, contractor_id, title, budget, status

3. **bids** - Bid requests
   - id, project_id, submitted_by, amount, status

4. **bid_submissions** - Contractor submissions
   - id, bid_id, contractor_id, amount, proposal

5. **project_milestones** - Project milestones
   - id, project_id, title, due_date, payment_amount, status

6. **payments** - Payment records
   - id, project_id, amount, payment_type, status

7. **conversations** - Chat threads
   - id, project_id, owner_id, contractor_id

8. **messages** - Individual messages
   - id, conversation_id, sender_id, content, read

9. **reviews** - Reviews/ratings
   - id, project_id, reviewer_id, reviewee_id, rating

10. **notifications** - User notifications
    - id, user_id, type, message, read

**Total: 46+ tables** (complete schema)

### Relationships:

```
profiles (users)
  ├── projects (owner_id, contractor_id)
  │   ├── project_milestones
  │   ├── bids
  │   │   └── bid_submissions
  │   ├── payments
  │   ├── conversations
  │   └── reviews
  └── notifications
```

---

## 📦 Main Modules/Features

### 1. **Authentication Module** (`/api/v1/auth`)

**Endpoints:**
- `POST /signup` - New user registration
- `POST /login` - User login (JWT token return)
- `GET /me` - Current user info
- `PUT /update-profile` - Update profile
- `POST /change-password` - Change password
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Reset password
- `POST /logout` - Logout
- `GET /verify-email` - Email verification
- `POST /toggle-mfa` - Enable/disable MFA

**Flow:**
```
Signup → Email verification → Login → JWT token → 
Use token in all requests
```

### 2. **Projects Module** (`/api/v1/projects`)

**Endpoints:**
- `POST /` - Create project
- `GET /` - Get all projects (filtered by user)
- `GET /:id` - Get project by ID
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project

**Key Logic:**
- `owner_id` → Auto-set from `userId` if not provided
- `contractor_id` → Must be provided manually
- Permission: `canEditAllProjects` for admins

**Service Functions:**
```javascript
createProject(data, userId)
getProjectById(projectId, userId, roleCode, roleName)
getUserProjects(userId, roleCode, roleName)
updateProject(projectId, updates, userId, roleCode, roleName)
deleteProject(projectId, userId, roleCode)
```

### 3. **Bids Module** (`/api/v1/bids`)

**Endpoints:**
- `POST /` - Create bid request
- `GET /` - Get all bids
- `GET /:id` - Get bid by ID
- `PUT /:id` - Update bid
- `POST /:bidId/submit` - Submit bid (contractor)
- `GET /:bidId/submissions` - Get submissions

**Flow:**
```
1. Owner creates bid (POST /bids)
2. Contractors submit bids (POST /bids/:id/submit)
3. Owner views submissions (GET /bids/:id/submissions)
4. Owner accepts/rejects (Update bid status)
```

**Key Logic:**
- `bid_submissions.contractor_id` → Logged-in user (auto-set)
- Permission: `canCreateBids` required

### 4. **Milestones Module** (`/api/v1/milestones`)

**Endpoints:**
- `POST /` - Create milestone
- `GET /project/:projectId` - Get project milestones
- `PUT /:id` - Update milestone
- `POST /:id/submit` - Submit milestone for approval
- `POST /:id/approve` - Approve milestone
- `POST /:id/reject` - Reject milestone

**Flow:**
```
Create milestone → Contractor submits work → 
Owner approves → Payment released
```

### 5. **Payments Module** (`/api/v1/payments`)

**Endpoints:**
- `POST /` - Create payment
- `GET /` - Get all payments
- `GET /:id` - Get payment by ID
- `PUT /:id` - Update payment
- `GET /project/:projectId` - Get project payments

**Payment Types:**
- `deposit` → Contractor ko (project start)
- `milestone` → Contractor ko (milestone complete)
- `final` → Contractor ko (project complete)
- `refund` → Owner ko (project cancel)

**Auto-logic:**
- `paid_to` → Auto-determined from `payment_type`
  - deposit/milestone/final → `contractor_id`
  - refund → `owner_id`

### 6. **Conversations & Messages** (`/api/v1/conversations`)

**Endpoints:**
- `POST /` - Create/get conversation
- `GET /` - Get user conversations
- `GET /:id` - Get conversation by ID
- `POST /:id/messages` - Send message
- `GET /:id/messages` - Get messages

**Auto-logic:**
- `owner_id` & `contractor_id` → Auto-determined from `project_id` if not provided

### 7. **Jobs Module** (`/api/v1/jobs`)

**Endpoints:**
- `POST /` - Create job posting
- `GET /` - Get all jobs
- `GET /:id` - Get job by ID
- `PUT /:id` - Update job
- `POST /:id/apply` - Apply for job
- `GET /:id/applications` - Get applications

### 8. **Reviews Module** (`/api/v1/reviews`)

**Endpoints:**
- `POST /` - Create review
- `GET /` - Get all reviews
- `GET /:id` - Get review by ID
- `GET /user/:userId` - Get user reviews

**Auto-logic:**
- `reviewee_id` → Auto-determined from `project_id`
  - If reviewer is owner → reviewee = contractor
  - If reviewer is contractor → reviewee = owner

### 9. **Admin Module** (`/api/v1/admin`)

**Endpoints:**
- `GET /users` - List all users
- `PUT /users/:id/role` - Change user role
- `POST /users/:id/suspend` - Suspend user
- `POST /users/:id/unsuspend` - Unsuspend user
- `PUT /users/:id/delete` - Soft delete
- `DELETE /users/:id` - Hard delete
- `GET /login-logs` - View login logs
- `GET /login-stats` - Login statistics

### 10. **Notifications Module** (`/api/v1/notifications`)

**Endpoints:**
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read

---

## 🛡️ Security Features

### 1. **Rate Limiting**
- Login attempts: 5 per 15 minutes
- Password reset: 3 per hour
- Global: 100 requests per 15 minutes
- DDoS detection

### 2. **Authentication**
- JWT tokens (expire after time)
- Session management
- Failed login tracking
- Account lockout after failed attempts

### 3. **Authorization**
- Role-based access control (RBAC)
- Permission checks on every endpoint
- Row-Level Security (RLS) in database

### 4. **Input Validation**
- Request body validation
- SQL injection protection (Supabase handles)
- XSS protection

### 5. **CORS**
- Configured origins only
- Credentials support

---

## 📡 API Endpoints Summary

### Base URL: `/api/v1`

**Authentication:**
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `PUT /auth/update-profile`

**Projects:**
- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `PUT /projects/:id`
- `DELETE /projects/:id`

**Bids:**
- `POST /bids`
- `GET /bids`
- `GET /bids/:id`
- `PUT /bids/:id`
- `POST /bids/:bidId/submit`
- `GET /bids/:bidId/submissions`

**Milestones:**
- `POST /milestones`
- `GET /milestones/project/:projectId`
- `PUT /milestones/:id`
- `POST /milestones/:id/submit`
- `POST /milestones/:id/approve`

**Payments:**
- `POST /payments`
- `GET /payments`
- `GET /payments/:id`
- `GET /payments/project/:projectId`

**Conversations:**
- `POST /conversations`
- `GET /conversations`
- `GET /conversations/:id`
- `POST /messages`
- `GET /messages/:conversationId`

**Jobs:**
- `POST /jobs`
- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/apply`

**Reviews:**
- `POST /reviews`
- `GET /reviews`
- `GET /reviews/user/:userId`

**Admin:**
- `GET /admin/users`
- `PUT /admin/users/:id/role`
- `POST /admin/users/:id/suspend`
- `GET /admin/login-logs`

**Total: 60+ endpoints**

---

## 🔑 Key Concepts

### 1. **owner_id vs contractor_id**

**owner_id:**
- Project ka owner (client)
- Auto-set from `userId` if not provided
- Required field

**contractor_id:**
- Project ka contractor (worker)
- Must be provided manually
- Can be null initially (before bid acceptance)

### 2. **Permission System**

```javascript
// Check permission
hasPermission(roleCode, roleName, 'canCreateBids')

// Middleware
requirePermission('admin.users.create')

// Service level
if (!hasPermission(roleCode, roleName, 'canEditAllProjects')) {
  return formatResponse(false, 'Permission denied');
}
```

### 3. **Response Format**

All responses use standard format:
```javascript
{
  success: true/false,
  message: "Description",
  data: {...} or null
}
```

### 4. **Error Handling**

- Try-catch blocks in all services
- Standard error responses
- Logging for debugging
- User-friendly error messages

---

## 🚀 How to Use

### 1. **Start Server:**
```bash
npm run dev    # Development
npm start      # Production
```

### 2. **API Documentation:**
- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI Spec: `openapi.yaml`

### 3. **Health Check:**
- `GET /api/health`

### 4. **Example Request:**

```javascript
// Login
POST /api/v1/auth/login
Body: { email, password }
Response: { success: true, data: { token, user } }

// Create Project (with token)
POST /api/v1/projects
Headers: { Authorization: "Bearer <token>" }
Body: { contractor_id, title, budget }
Response: { success: true, data: { project } }
```

---

## 📝 Summary

Yeh backend ek **complete construction project management system** hai jisme:

✅ **Authentication** - Login, signup, JWT tokens
✅ **Authorization** - Role-based permissions
✅ **Projects** - Create, manage projects
✅ **Bids** - Bid system with submissions
✅ **Payments** - Milestone-based payments
✅ **Communication** - Messages, conversations
✅ **Reviews** - Rating system
✅ **Admin** - User management
✅ **Security** - Rate limiting, validation, RLS

**Architecture:** MVC pattern with service layer
**Database:** Supabase (PostgreSQL)
**API:** RESTful with versioning (`/api/v1`)

Sab kuch **production-ready** hai aur properly tested hai! 🎉

