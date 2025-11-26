# 🔄 Backend Simple Flow - Step by Step

## 📱 Example: Project Create Kaise Hota Hai?

### Step 1: Client Request
```
POST /api/v1/projects
Headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."
  Content-Type: "application/json"
}
Body: {
  contractor_id: "uuid-123",
  title: "House Construction",
  budget: 50000
}
```

### Step 2: Server Receive (server.js)
```javascript
// Route match: /api/v1/projects
app.use("/api/v1", v1Router);
v1Router.use("/projects", projectRoutes);
```

### Step 3: Route Handler (projectRoutes.js)
```javascript
router.post('/', auth, guard('canCreateBids'), createProject);
//           ↑      ↑
//      JWT check  Permission check
```

### Step 4: Middleware Chain

**4a. auth.js** - JWT Verify
```javascript
// Extract token from header
const token = req.headers.authorization?.split(" ")[1];
// Verify token
const decoded = jwt.verify(token, JWT_SECRET);
// Set user info
req.user = decoded; // { id, email, role_code, ... }
```

**4b. guard('canCreateBids')** - Permission Check
```javascript
// Check if user has permission
hasPermission(roleCode, roleName, 'canCreateBids')
// Returns: true/false
// If false → 403 Forbidden
```

### Step 5: Controller (projectController.js)
```javascript
export const createProject = async (req, res) => {
  const userId = req.user.id; // From JWT token
  const result = await projectService.createProject(req.body, userId);
  return res.status(201).json(result);
};
```

### Step 6: Service (projectService.js)
```javascript
async createProject(data, userId) {
  // Extract data
  const { owner_id, contractor_id, title, budget } = data;
  
  // Auto-set owner_id
  const finalOwnerId = owner_id || userId; // ← Yahan owner_id set hota hai!
  
  // Validate
  if (!finalOwnerId || !contractor_id || !title) {
    return formatResponse(false, 'Missing required fields');
  }
  
  // Database insert
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      owner_id: finalOwnerId,    // ← Auto-set from userId
      contractor_id: contractor_id, // ← From request body
      title,
      budget,
      status: 'open'
    })
    .select()
    .single();
  
  return formatResponse(true, 'Project created', project);
}
```

### Step 7: Response
```javascript
{
  success: true,
  message: "Project created successfully",
  data: {
    id: "uuid-456",
    owner_id: "uuid-user-123",  // ← Auto-set
    contractor_id: "uuid-123",   // ← From request
    title: "House Construction",
    budget: 50000,
    status: "open",
    created_at: "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔑 Key Points

### owner_id Kahan Se Aata Hai?
1. **Request body se** (optional) - `data.owner_id`
2. **Agar nahi diya** → **userId** use hota hai (logged-in user)
3. **Code:** `const finalOwnerId = owner_id || userId;`

### contractor_id Kahan Se Aata Hai?
1. **Request body se** (required) - `data.contractor_id`
2. **Auto-set nahi hota** - manually provide karna padta hai
3. **Can be null** initially (before bid acceptance)

### Permission Check Kahan Hota Hai?
1. **Route level** - `guard('canCreateBids')` middleware
2. **Service level** - `hasPermission()` function
3. **Database level** - RLS policies (Supabase)

---

## 🗂️ File Structure Flow

```
Request
  ↓
server.js (Entry point)
  ↓
routes/projectRoutes.js (URL matching)
  ↓
middlewares/auth.js (JWT verify)
  ↓
middlewares/permission.js (Permission check)
  ↓
controllers/projectController.js (Request handler)
  ↓
services/projectService.js (Business logic)
  ↓
supabaseClient.js (Database)
  ↓
Response
```

---

## 📊 Database Operations

### Insert Example:
```javascript
const { data, error } = await supabase
  .from('projects')
  .insert({
    owner_id: finalOwnerId,
    contractor_id: contractor_id,
    title: title
  })
  .select()
  .single();
```

### Select Example:
```javascript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single();
```

### Update Example:
```javascript
const { data, error } = await supabase
  .from('projects')
  .update({ status: 'completed' })
  .eq('id', projectId)
  .select()
  .single();
```

---

## 🎯 Common Patterns

### 1. Auto-set Fields
```javascript
// owner_id auto-set
const finalOwnerId = owner_id || userId;

// created_by auto-set
if (userId) {
  insertData.created_by = userId;
}
```

### 2. Permission Check
```javascript
// Route level
router.post('/', auth, guard('canCreateBids'), handler);

// Service level
if (!hasPermission(roleCode, roleName, 'canEditAllProjects')) {
  return formatResponse(false, 'Permission denied');
}
```

### 3. Response Format
```javascript
// Success
formatResponse(true, 'Operation successful', data)

// Error
formatResponse(false, 'Error message', null)
```

### 4. Error Handling
```javascript
try {
  const result = await service.method();
  return res.json(result);
} catch (error) {
  return res.status(500).json(
    formatResponse(false, error.message, null)
  );
}
```

---

## 🔄 Complete Request-Response Cycle

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ POST /api/v1/projects
       │ { contractor_id, title, budget }
       │ Authorization: Bearer <token>
       ↓
┌─────────────────────────────────────┐
│         Express Server               │
│  ┌───────────────────────────────┐  │
│  │ 1. CORS Check                 │  │
│  │ 2. Rate Limit Check          │  │
│  │ 3. Body Parser               │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 4. Route Match                │  │
│  │    /api/v1/projects           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 5. auth.js Middleware         │  │
│  │    JWT Verify → req.user      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 6. guard() Middleware          │  │
│  │    Permission Check           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 7. Controller                 │  │
│  │    Extract data, call service │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 8. Service                     │  │
│  │    Business logic, DB ops      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│      Supabase Database              │
│  ┌───────────────────────────────┐  │
│  │ INSERT INTO projects          │  │
│  │ (owner_id, contractor_id, ...) │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ↓
┌─────────────┐
│   Response  │
│ { success:  │
│   true,     │
│   data: {...}│
│ }           │
└─────────────┘
```

---

## 💡 Quick Reference

### owner_id Source:
- ✅ Request body (optional)
- ✅ Auto: userId (if not provided)

### contractor_id Source:
- ✅ Request body (required)
- ❌ Auto-set nahi hota

### Permission Check:
- ✅ Route: `guard('permission')`
- ✅ Service: `hasPermission()`

### Response Format:
- ✅ Always: `{ success, message, data }`

### Error Handling:
- ✅ Try-catch in controllers
- ✅ Standard error responses

---

**Yeh simple flow hai! Ab aap samajh gaye honge kaise sab kuch kaam karta hai! 🎉**

