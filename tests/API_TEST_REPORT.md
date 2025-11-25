# 📊 API TEST REPORT

**Generated:** 11/24/2025, 5:46:36 PM
**Base URL:** http://localhost:5000
**API Base:** http://localhost:5000/api/v1

---

## 📈 SUMMARY

| Metric | Count |
|--------|-------|
| Total Tests | 50 |
| ✅ Passed | 26 |
| ❌ Failed | 15 |
| ⏭️ Skipped | 9 |
| Success Rate | 52.00% |

## 🗄️ TEST DATA CREATED

| Key | Value |
|-----|-------|
| admin_id | 12d1664a-85a5-45fe-8f14-6273f056ab0d |
| gc_id | 246296fa-27db-4879-bac6-54fd1c8fcab1 |
| pm_id | 0f195040-8faf-43de-ae9f-4d32072bc98e |
| sub_id | c1e54482-32fe-478b-99ff-dce77c9cdb26 |

---

## 🧪 ALL TESTS

### 1. ✅ Login as Admin

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "email": "admin@bidroom.com",
  "password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyZDE2NjRhLTg1YTUtNDVmZS04ZjE0LTYyNzNmMDU2YWIwZCIsImVtYWlsIjoiYWRtaW5AYmlkcm9vbS5jb20iLCJyb2xlIjoiU1VQRVIiLCJyb2xlX2NvZGUiOiJTVVBFUiIsInVzZXJfdHlwZSI6IkFETUlOX1VTRVIiLCJpYXQiOjE3NjM5ODgzOTgsImV4cCI6MTc2NDU5MzE5OH0.wgM8z4V4imqDVWUnfxwn3YOWw4x6MQ55FcVozr6TL4I",
    "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6IlhTTjVSVzVUZ2Jha2E0V0QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2h0YWxiaXZxcnJhaHZpd3lvdGJhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxMmQxNjY0YS04NWE1LTQ1ZmUtOGYxNC02MjczZjA1NmFiMGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzOTkyMDAwLCJpYXQiOjE3NjM5ODg0MDAsImVtYWlsIjoiYWRtaW5AYmlkcm9vbS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2Mzk4ODM5OX1dLCJzZXNzaW9uX2lkIjoiMmNlN2MwNTEtMzk0OS00NTE4LTg0ZWEtYzBkMzhkYWI5Y2ZjIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.WhjCtpdqQW7cH_fcuYftHTCGOCkcl0ryOknVKNxTED8",
    "refresh_token": "ixp7xqakzvoo",
    "expires_at": 1763992000,
    "user": {
      "id": "12d1664a-85a5-45fe-8f14-6273f056ab0d",
      "email": "admin@bidroom.com",
      "full_name": "string",
      "role": null,
      "role_code": "SUPER",
      "user_type": "ADMIN_USER"
    }
  }
}
```

---

### 2. ✅ Login as GC

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "email": "gc@bidroom.com",
  "password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI0NjI5NmZhLTI3ZGItNDg3OS1iYWM2LTU0ZmQxYzhmY2FiMSIsImVtYWlsIjoiZ2NAYmlkcm9vbS5jb20iLCJyb2xlIjoiR0MiLCJyb2xlX2NvZGUiOiJHQyIsInVzZXJfdHlwZSI6IkFQUF9VU0VSIiwiaWF0IjoxNzYzOTg4NDAxLCJleHAiOjE3NjQ1OTMyMDF9.nekuYVPQsysWzDfbum2KklkDgsY1LrbfEf7HVpqBEAE",
    "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6IlhTTjVSVzVUZ2Jha2E0V0QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2h0YWxiaXZxcnJhaHZpd3lvdGJhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyNDYyOTZmYS0yN2RiLTQ4NzktYmFjNi01NGZkMWM4ZmNhYjEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzOTkyMDAyLCJpYXQiOjE3NjM5ODg0MDIsImVtYWlsIjoiZ2NAYmlkcm9vbS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2Mzk4ODQwMn1dLCJzZXNzaW9uX2lkIjoiYzkzZmI2NmQtNzI4MC00YWFmLTkwNjItZjEzODVjNjZkZjY3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.AsnfsfsshOFJ1QJTZv4uGsJBLBXhMSMSEcyNTTZvy9s",
    "refresh_token": "gnijq2ajzbgi",
    "expires_at": 1763992002,
    "user": {
      "id": "246296fa-27db-4879-bac6-54fd1c8fcab1",
      "email": "gc@bidroom.com",
      "full_name": null,
      "role": null,
      "role_code": "GC",
      "user_type": "APP_USER"
    }
  }
}
```

---

### 3. ✅ Login as PM

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "email": "pm@bidroom.com",
  "password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBmMTk1MDQwLThmYWYtNDNkZS1hZTlmLTRkMzIwNzJiYzk4ZSIsImVtYWlsIjoicG1AYmlkcm9vbS5jb20iLCJyb2xlIjoiUE0iLCJyb2xlX2NvZGUiOiJQTSIsInVzZXJfdHlwZSI6IkFQUF9VU0VSIiwiaWF0IjoxNzYzOTg4NDAzLCJleHAiOjE3NjQ1OTMyMDN9.9TJPzjGEZ-TaPD7Mp5xvPoXitrpYum_147j6Ut1nbLU",
    "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6IlhTTjVSVzVUZ2Jha2E0V0QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2h0YWxiaXZxcnJhaHZpd3lvdGJhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIwZjE5NTA0MC04ZmFmLTQzZGUtYWU5Zi00ZDMyMDcyYmM5OGUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzOTkyMDA1LCJpYXQiOjE3NjM5ODg0MDUsImVtYWlsIjoicG1AYmlkcm9vbS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2Mzk4ODQwNH1dLCJzZXNzaW9uX2lkIjoiNGQ5ZTZjMGYtOWEwNC00ZDczLWIyOTUtZTI3NWM1OTc4MWEzIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.Tuk9mudNYhzB32-GQh5vzhP8i3ofRDhWRUe8PygHVfY",
    "refresh_token": "g2w5lee3ylal",
    "expires_at": 1763992005,
    "user": {
      "id": "0f195040-8faf-43de-ae9f-4d32072bc98e",
      "email": "pm@bidroom.com",
      "full_name": null,
      "role": null,
      "role_code": "PM",
      "user_type": "APP_USER"
    }
  }
}
```

---

### 4. ✅ Login as SUB

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "email": "sub@bidroom.com",
  "password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMxZTU0NDgyLTMyZmUtNDc4Yi05OWZmLWRjZTc3YzljZGIyNiIsImVtYWlsIjoic3ViQGJpZHJvb20uY29tIiwicm9sZSI6IlNVQiIsInJvbGVfY29kZSI6IlNVQiIsInVzZXJfdHlwZSI6IkFQUF9VU0VSIiwiaWF0IjoxNzYzOTg4NDA1LCJleHAiOjE3NjQ1OTMyMDV9.scaA3gQOB1UCiDV2qghoiH1sqa10ehZUR6ZN85pMb0g",
    "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6IlhTTjVSVzVUZ2Jha2E0V0QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2h0YWxiaXZxcnJhaHZpd3lvdGJhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjMWU1NDQ4Mi0zMmZlLTQ3OGItOTlmZi1kY2U3N2M5Y2RiMjYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzOTkyMDA3LCJpYXQiOjE3NjM5ODg0MDcsImVtYWlsIjoic3ViQGJpZHJvb20uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjM5ODg0MDZ9XSwic2Vzc2lvbl9pZCI6Ijk0ZDZmYjU1LWFmODEtNDQ5YS05MzdkLTU2YzRkMDI3NjVhMSIsImlzX2Fub255bW91cyI6ZmFsc2V9.PX11vfbzENHN69S5Qg9jGi-aF4j1St_Jr6yvVJeCg2M",
    "refresh_token": "7osu27d6iedk",
    "expires_at": 1763992007,
    "user": {
      "id": "c1e54482-32fe-478b-99ff-dce77c9cdb26",
      "email": "sub@bidroom.com",
      "full_name": null,
      "role": null,
      "role_code": "SUB",
      "user_type": "APP_USER"
    }
  }
}
```

---

### 5. ❌ Get Current User (Me)

**Status:** FAIL
**Message:** Request error or no response

---

### 6. ❌ Update Profile

**Status:** FAIL
**Message:** Request error or no response

**Request Data:**
```json
{
  "full_name": "Updated Admin Name"
}
```

---

### 7. ✅ Change Password (POST)

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "current_password": "Test123!@#",
  "new_password": "Test123!@#"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": null
}
```

---

### 8. ✅ Get User Sessions

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Sessions retrieved",
  "data": [
    {
      "id": "0597cf8d-e1ec-420e-887d-204848c3f92d",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-24T12:46:40.771611",
      "expires_at": "2025-12-24T12:46:39.36"
    },
    {
      "id": "37f18161-b5ce-46ff-880f-41c6cddc53bc",
      "ip_address": "::1",
      "device": "Unknown - Unknown Browser",
      "login_time": "2025-11-24T12:35:33.814466",
      "expires_at": "2025-12-24T12:35:32.494"
    },
    {
      "id": "f2a1eb99-be6c-444a-a850-ee288b77e815",
      "ip_address": "::1",
      "device": "Unknown - Unknown Browser",
      "login_time": "2025-11-23T19:45:46.282958",
      "expires_at": "2025-12-23T19:45:45.176"
    },
    {
      "id": "15e1e146-b8e6-41cd-8ec7-ed01bdd1455f",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-23T19:43:39.64016",
      "expires_at": "2025-12-23T19:43:38.494"
    },
    {
      "id": "289a0915-94d6-4834-be61-43229379cfa4",
      "ip_address": "::1",
      "device": "Windows - Chrome",
      "login_time": "2025-11-23T00:03:01.431801",
      "expires_at": "2025-12-23T00:03:00.477"
    },
    {
      "id": "2894cb9c-5a21-4130-9440-7e783aced7da",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T22:33:38.103735",
      "expires_at": "2025-12-22T22:33:37.186"
    },
    {
      "id": "5951ba8a-55e7-4778-9a33-fcbc541479f2",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T22:30:54.562344",
      "expires_at": "2025-12-22T22:30:53.622"
    },
    {
      "id": "afabe313-7b88-42c1-9c48-c1d3a368532e",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T22:27:47.660989",
      "expires_at": "2025-12-22T22:27:46.762"
    },
    {
      "id": "7ffb9a45-8f82-4bf5-9ed2-451cb1fe609f",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T22:24:57.113943",
      "expires_at": "2025-12-22T22:24:56.174"
    },
    {
      "id": "8efa161e-aede-42d9-937c-e48fbaeeb403",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T22:21:56.861588",
      "expires_at": "2025-12-22T22:21:55.94"
    },
    {
      "id": "3aa10be9-ee45-427d-99b2-eee455ca07d2",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T20:45:01.59053",
      "expires_at": "2025-12-22T20:45:01.101"
    },
    {
      "id": "406f02eb-d761-465d-9ea8-7872c6080ce4",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T20:27:32.169312",
      "expires_at": "2025-12-22T20:27:31.701"
    },
    {
      "id": "a607cace-9568-4503-a1d9-44fe78131632",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T20:26:02.497161",
      "expires_at": "2025-12-22T20:26:02.011"
    },
    {
      "id": "4f6553a7-e512-414e-ae3f-7744431807ab",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T20:08:16.313625",
      "expires_at": "2025-12-22T20:08:15.82"
    },
    {
      "id": "45ca03f0-b8a4-4195-a0a0-6693803035bf",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T19:46:04.994124",
      "expires_at": "2025-12-22T19:46:04.516"
    },
    {
      "id": "51dc0fdf-64a3-4002-85c9-8065a8ad2623",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T00:57:48.130472",
      "expires_at": "2025-12-22T00:57:47.881"
    },
    {
      "id": "94d484b8-a041-44bf-b15e-86d144d36cd0",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-22T00:41:40.328116",
      "expires_at": "2025-12-22T00:41:40.122"
    },
    {
      "id": "5348b6b9-177e-443f-85dc-7c9e375f8ffc",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-21T23:45:47.603844",
      "expires_at": "2025-12-21T23:45:47.407"
    },
    {
      "id": "923099ed-2521-4fc5-a8ca-8d54b0abdb1a",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-21T23:26:24.114078",
      "expires_at": "2025-12-21T23:26:23.902"
    },
    {
      "id": "072ba1f8-18b7-4a77-8aed-17be4213ccee",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-21T23:14:50.433476",
      "expires_at": "2025-12-21T23:14:50.237"
    },
    {
      "id": "bf1e5a6f-cabf-46bb-8d4b-709df98fb23e",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-21T21:54:08.672682",
      "expires_at": "2025-12-21T21:54:12.207"
    },
    {
      "id": "e54b2220-e06b-4b0d-84e5-682fff26a3f5",
      "ip_address": "::1",
      "device": "Unknown Device",
      "login_time": "2025-11-21T21:48:24.912973",
      "expires_at": "2025-12-21T21:48:28.442"
    },
    {
      "id": "4dff90f2-a4cf-4711-9a85-ef69cb9a0f13",
      "ip_address": "::1",
      "device": "Unknown - Unknown Browser",
      "login_time": "2025-11-21T21:29:33.135644",
      "expires_at": "2025-12-21T21:29:36.647"
    }
  ]
}
```

---

### 9. ✅ Signup New User

**Status:** PASS
**HTTP Status:** 201

**Request Data:**
```json
{
  "email": "test1763988412255@bidroom.com",
  "password": "Test123!@#",
  "full_name": "Test User",
  "role_code": "VIEWER"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "Signup successful — Auto login completed",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyZDU1MTkyLTBiZTEtNDEwZS05NTljLWJlZDdjYjMxN2QyZiIsImVtYWlsIjoidGVzdDE3NjM5ODg0MTIyNTVAYmlkcm9vbS5jb20iLCJyb2xlIjoiVklFV0VSIiwicm9sZV9jb2RlIjoiVklFV0VSIiwidXNlcl90eXBlIjoiQVBQX1VTRVIiLCJpYXQiOjE3NjM5ODg0MTcsImV4cCI6MTc2NDU5MzIxN30.X7bPGzGXuvaIL9K_VlIBE3RXmO3DA9HPswq4n-_RN5I",
    "user": {
      "id": "62d55192-0be1-410e-959c-bed7cb317d2f",
      "email": "test1763988412255@bidroom.com",
      "full_name": "Test User",
      "role": "VIEWER",
      "role_code": "VIEWER",
      "user_type": "APP_USER"
    }
  }
}
```

---

### 10. ✅ Forgot Password

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "email": "admin@bidroom.com"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "If the email exists, a reset link will be sent.",
  "data": null
}
```

---

### 11. ✅ Resend Verification Email

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "email": "admin@bidroom.com"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "If this email exists, we sent a link.",
  "data": null
}
```

---

### 12. ✅ Health Check

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2025-11-24T12:47:10.432Z",
    "uptime": 63.8907186,
    "environment": "development"
  }
}
```

---

### 13. ❌ Create Project

**Status:** FAIL
**HTTP Status:** 400
**Message:** Expected 200,201 or 2xx, got 400

**Request Data:**
```json
{
  "title": "Test Project - API Testing",
  "description": "Project created by automated test suite",
  "owner_id": "12d1664a-85a5-45fe-8f14-6273f056ab0d",
  "contractor_id": "246296fa-27db-4879-bac6-54fd1c8fcab1",
  "budget": 50000,
  "status": "open"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "new row violates row-level security policy for table \"projects\"",
  "data": null
}
```

---

### 14. ✅ Get All Projects

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Projects retrieved",
  "data": [
    {
      "id": "e8492429-f261-4ca7-85c4-676818a37341",
      "title": "New Construction Project",
      "description": "Project description here",
      "budget": 50000,
      "created_by": "12d1664a-85a5-45fe-8f14-6273f056ab0d",
      "status": "open",
      "created_at": "2025-11-23T00:15:50.536395",
      "owner_id": "12d1664a-85a5-45fe-8f14-6273f056ab0d",
      "contractor_id": "246296fa-27db-4879-bac6-54fd1c8fcab1",
      "updated_at": "2025-11-23T00:15:50.536395+00:00",
      "project_id": "e8492429-f261-4ca7-85c4-676818a37341"
    }
  ]
}
```

---

### 15. ⏭️ Milestones Tests

**Status:** SKIP
**Message:** Admin token or project_id not available

---

### 16. ⏭️ Bids Tests

**Status:** SKIP
**Message:** GC token or project_id not available

---

### 17. ❌ Create Job

**Status:** FAIL
**HTTP Status:** 403
**Message:** Expected 200,201 or 2xx, got 403

**Request Data:**
```json
{
  "title": "Electrician Needed - Test",
  "description": "Need licensed electrician for test project",
  "location": "Los Angeles, CA",
  "trade_type": "Electrical",
  "specialization": "Commercial",
  "budget_min": 5000,
  "budget_max": 15000,
  "project_manager_id": "0f195040-8faf-43de-ae9f-4d32072bc98e"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "new row violates row-level security policy for table \"jobs\"",
  "data": null
}
```

---

### 18. ✅ Get All Jobs

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Jobs retrieved",
  "data": [
    {
      "id": "01fd1ceb-6025-4031-a49b-4449a431dd44",
      "title": "Electrician Needed",
      "description": "Need licensed electrician for commercial project",
      "location": "Los Angeles, CA",
      "trade_type": "Electrical",
      "specialization": null,
      "status": "open",
      "urgency": "normal",
      "budget_min": 5000,
      "budget_max": 15000,
      "pay_type": null,
      "pay_rate": null,
      "start_date": "2025-11-23",
      "end_date": "2025-11-23",
      "requirements": {
        "license": true,
        "experience": "5+ years"
      },
      "images": [
        "https://example.com/image1.jpg"
      ],
      "documents": [],
      "project_manager_id": "12d1664a-85a5-45fe-8f14-6273f056ab0d",
      "created_by": "12d1664a-85a5-45fe-8f14-6273f056ab0d",
      "application_count": 0,
      "created_at": "2025-11-23T00:23:50.331029+00:00",
      "updated_at": "2025-11-23T00:23:50.331029+00:00"
    }
  ]
}
```

---

### 19. ⏭️ Payments Tests

**Status:** SKIP
**Message:** Required data not available

---

### 20. ⏭️ Payouts Tests

**Status:** SKIP
**Message:** Required data not available

---

### 21. ✅ Get All Contractors

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": false,
  "message": "Could not find the table 'public.contractors' in the schema cache",
  "data": null
}
```

---

### 22. ✅ Search Contractors

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Contractors retrieved",
  "data": []
}
```

---

### 23. ❌ Get Contractor by ID

**Status:** FAIL
**HTTP Status:** 404
**Message:** Expected 200 or 2xx, got 404

**Response Data:**
```json
{
  "success": false,
  "message": "Contractor not found",
  "data": null
}
```

---

### 24. ❌ Update Contractor

**Status:** FAIL
**HTTP Status:** 403
**Message:** Expected 200,201 or 2xx, got 403

**Request Data:**
```json
{
  "full_name": "Updated GC Name"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Cannot coerce the result to a single JSON object",
  "data": null
}
```

---

### 25. ✅ Get Contractor Profile

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Contractor profile retrieved",
  "data": {
    "user_id": "246296fa-27db-4879-bac6-54fd1c8fcab1",
    "company_name": null,
    "license_number": null,
    "verified": false
  }
}
```

---

### 26. ✅ Upsert Contractor Profile

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "user_id": "246296fa-27db-4879-bac6-54fd1c8fcab1",
  "bio": "Experienced contractor",
  "license_number": "LIC123456"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "new row violates row-level security policy for table \"contractor_profiles\"",
  "data": null
}
```

---

### 27. ❌ Update Verification Status

**Status:** FAIL
**HTTP Status:** 403
**Message:** Expected 200,201 or 2xx, got 403

**Request Data:**
```json
{
  "license_verified": true
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Could not find the 'verified' column of 'contractor_profiles' in the schema cache",
  "data": null
}
```

---

### 28. ⏭️ Conversations Tests

**Status:** SKIP
**Message:** Required data not available

---

### 29. ⏭️ Messages Tests

**Status:** SKIP
**Message:** Required data not available

---

### 30. ❌ Create Notification (try variant)

**Status:** FAIL
**HTTP Status:** 400
**Message:** Expected 200,201 or 2xx, got 400

**Request Data:**
```json
{
  "user_id": "246296fa-27db-4879-bac6-54fd1c8fcab1",
  "type": "info",
  "title": "Test Notification - message",
  "message": "This is a test notification (message)"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Could not find the 'priority' column of 'notifications' in the schema cache",
  "data": null
}
```

---

### 31. ❌ Create Notification (try variant)

**Status:** FAIL
**HTTP Status:** 400
**Message:** Expected 200,201 or 2xx, got 400

**Request Data:**
```json
{
  "user_id": "246296fa-27db-4879-bac6-54fd1c8fcab1",
  "type": "info",
  "title": "Test Notification - body",
  "body": "This is a test notification (body)"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Could not find the 'priority' column of 'notifications' in the schema cache",
  "data": null
}
```

---

### 32. ❌ Create Notification

**Status:** FAIL
**Message:** All payload variants failed

---

### 33. ✅ Get User Notifications

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Notifications retrieved",
  "data": []
}
```

---

### 34. ✅ Mark All Notifications as Read

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": null
}
```

---

### 35. ✅ Get Unread Notification Count

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Unread count retrieved",
  "data": {
    "count": 0
  }
}
```

---

### 36. ⏭️ Progress Updates Tests

**Status:** SKIP
**Message:** Required data not available

---

### 37. ⏭️ Reviews Tests

**Status:** SKIP
**Message:** Required data not available

---

### 38. ⏭️ Disputes Tests

**Status:** SKIP
**Message:** Required data not available

---

### 39. ✅ List All Users

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Users retrieved",
  "data": [
    {
      "id": "62d55192-0be1-410e-959c-bed7cb317d2f",
      "email": "test1763988412255@bidroom.com",
      "full_name": null,
      "phone": null,
      "avatar_url": null,
      "role_id": null,
      "email_verified": true,
      "status": "active",
      "created_at": "2025-11-24T12:46:53.960401",
      "updated_at": "2025-11-24T12:46:58.498568",
      "user_type": "APP_USER",
      "role_code": null,
      "verified_at": null,
      "verification_token": null,
      "verification_expires_at": null,
      "last_login_at": null,
      "last_login_ip": null,
      "suspended_at": null,
      "suspension_reason": null,
      "deleted_at": null,
      "locked_reason": null,
      "reset_block_until": null,
      "mfa_enabled": false,
      "mfa_otp": null,
      "mfa_otp_expires_at": null,
      "mfa_temp_token": null,
      "mfa_attempts": 0,
      "mfa_temp_refresh_token": null,
      "account_type": "APP_USER",
      "first_name": null,
      "last_name": null,
      "company_name": null,
      "bio": null,
      "location": null,
      "trust_score": 0,
      "roles": null
    }
  ]
}
```

---

### 40. ✅ Get Login Logs

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Login logs retrieved",
  "data": {
    "logs": [],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

---

### 41. ✅ Get Login Stats

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "Login statistics retrieved",
  "data": {
    "failed_attempts_last_30_days": 0,
    "successful_logins_30_days": 0,
    "top_ips": [],
    "top_devices": []
  }
}
```

---

### 42. ❌ Change User Role

**Status:** FAIL
**Message:** Request error or no response

**Request Data:**
```json
{
  "user_id": "c1e54482-32fe-478b-99ff-dce77c9cdb26",
  "role_code": "VIEWER"
}
```

---

### 43. ✅ Get User Sessions (admin)

**Status:** PASS
**HTTP Status:** 200

**Response Data:**
```json
{
  "success": true,
  "message": "User sessions retrieved",
  "data": []
}
```

---

### 44. ✅ Verify User

**Status:** PASS
**HTTP Status:** 200

**Request Data:**
```json
{
  "user_id": "c1e54482-32fe-478b-99ff-dce77c9cdb26"
}
```

**Response Data:**
```json
{
  "success": true,
  "message": "User verified manually",
  "data": null
}
```

---

### 45. ❌ Suspend User

**Status:** FAIL
**Message:** Request error or no response

---

### 46. ❌ Unsuspend User

**Status:** FAIL
**Message:** Request error or no response

---

### 47. ❌ Get User Profile

**Status:** FAIL
**Message:** Request error or no response

---

### 48. ❌ Update User Profile

**Status:** FAIL
**Message:** Request error or no response

**Request Data:**
```json
{
  "full_name": "Updated Name"
}
```

---

### 49. ✅ SUB cannot create bid (Permission Test)

**Status:** PASS
**HTTP Status:** 403

**Request Data:**
```json
{
  "project_id": null,
  "amount": 10000
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Permission denied: canCreateBids",
  "data": null
}
```

---

### 50. ✅ SUB cannot create job (Permission Test)

**Status:** PASS
**HTTP Status:** 403

**Request Data:**
```json
{
  "title": "Test Job",
  "description": "Test",
  "location": "Test",
  "trade_type": "Electrical"
}
```

**Response Data:**
```json
{
  "success": false,
  "message": "Permission denied: canPostJobs",
  "data": null
}
```

---

## ❌ FAILED TESTS SUMMARY

1. **Get Current User (Me)** - Request error or no response

2. **Update Profile** - Request error or no response

3. **Create Project** - Expected 200,201 or 2xx, got 400

4. **Create Job** - Expected 200,201 or 2xx, got 403

5. **Get Contractor by ID** - Expected 200 or 2xx, got 404

6. **Update Contractor** - Expected 200,201 or 2xx, got 403

7. **Update Verification Status** - Expected 200,201 or 2xx, got 403

8. **Create Notification (try variant)** - Expected 200,201 or 2xx, got 400

9. **Create Notification (try variant)** - Expected 200,201 or 2xx, got 400

10. **Create Notification** - All payload variants failed

11. **Change User Role** - Request error or no response

12. **Suspend User** - Request error or no response

13. **Unsuspend User** - Request error or no response

14. **Get User Profile** - Request error or no response

15. **Update User Profile** - Request error or no response

## ⏭️ SKIPPED TESTS SUMMARY

1. **Milestones Tests** - Admin token or project_id not available

2. **Bids Tests** - GC token or project_id not available

3. **Payments Tests** - Required data not available

4. **Payouts Tests** - Required data not available

5. **Conversations Tests** - Required data not available

6. **Messages Tests** - Required data not available

7. **Progress Updates Tests** - Required data not available

8. **Reviews Tests** - Required data not available

9. **Disputes Tests** - Required data not available

