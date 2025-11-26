# 🔧 Supabase Connection Troubleshooting Guide

## ❌ Error: Connect Timeout Error

If you're seeing this error:
```
ConnectTimeoutError: Connect Timeout Error
attempted address: htalbivqrrahviwyotba.supabase.co:443
```

---

## ✅ SOLUTION STEPS

### 1. Check Environment Variables

Create/verify `.env` file in `backend/` directory:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-jwt-secret
PORT=5000
```

**How to get Supabase credentials:**
1. Go to https://supabase.com
2. Open your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

---

### 2. Verify Internet Connection

```bash
# Test internet connectivity
ping google.com

# Test Supabase connectivity
curl https://your-project-id.supabase.co
```

---

### 3. Check Firewall/Proxy

- **Windows Firewall**: Allow Node.js through firewall
- **Corporate Proxy**: Configure proxy settings
- **VPN**: Disable VPN if causing issues

---

### 4. Verify Supabase Project Status

1. Go to https://supabase.com/dashboard
2. Check if project is **Active** (not paused)
3. If paused, click **Resume Project**

---

### 5. Test Connection Manually

Create a test file: `backend/test-supabase.js`

```javascript
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const { data, error } = await supabase.from("profiles").select("id").limit(1);
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("✅ Connection successful!");
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
})();
```

Run: `node test-supabase.js`

---

### 6. Common Issues & Fixes

#### Issue: Wrong Supabase URL
**Fix:** Ensure URL format is: `https://xxxxx.supabase.co` (no trailing slash)

#### Issue: Wrong Service Role Key
**Fix:** Use **service_role** key (not anon key) from Supabase dashboard

#### Issue: Project Paused
**Fix:** Resume project in Supabase dashboard

#### Issue: Network/Firewall
**Fix:** 
- Check firewall settings
- Try different network
- Disable VPN

#### Issue: RLS Policies
**Fix:** Service role key bypasses RLS, but verify table exists

---

### 7. Quick Fix Commands

```bash
# 1. Check if .env file exists
cd backend
ls -la .env

# 2. Verify environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"

# 3. Test Supabase connection
node test-supabase.js
```

---

## 📋 CHECKLIST

- [ ] `.env` file exists in `backend/` directory
- [ ] `SUPABASE_URL` is set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- [ ] Supabase project is **Active** (not paused)
- [ ] Internet connection is working
- [ ] Firewall allows Node.js connections
- [ ] No VPN/proxy blocking connection

---

## 🆘 Still Not Working?

1. **Check Supabase Dashboard**: Verify project is active
2. **Try Different Network**: Test on mobile hotspot
3. **Check Supabase Status**: https://status.supabase.com
4. **Contact Support**: Supabase support or check logs

---

**After fixing, restart the backend server:**
```bash
cd backend
npm start
```

