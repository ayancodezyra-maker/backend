// Admin routes
import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";
/* CURSOR PATCH START */
import { requirePermission } from "../middlewares/permission.js";
/* CURSOR PATCH END */
import { 
  listUsers, 
  changeUserRole, 
  getUserSessions, 
  adminVerifyUser, 
  getLoginLogs, 
  getLoginStats,
  suspendUser,
  unsuspendUser,
  deleteUserSoft,
  deleteUserHard,
  restoreUser,
  lockUser,
  unlockUser
} from "../controllers/adminController.js";

const router = express.Router();

/* CURSOR PATCH START */
// List all users
router.get(
  "/all-users",
  auth,
  requirePermission("admin.users.list"),
  listUsers
);

// Change user role - Support both routes for compatibility
router.put(
  "/update-role",
  auth,
  requirePermission("admin.users.change_role"),
  changeUserRole
);

router.put(
  "/users/change-role",
  auth,
  requirePermission("admin.users.change_role"),
  changeUserRole
);

// GET /admin/sessions/:user_id - Admin route to get all sessions of a user
router.get(
  "/sessions/:user_id",
  auth,
  requireRole(["SUPER", "ADMIN"]),
  getUserSessions
);

// Manually verify user
router.post(
  "/verify-user",
  auth,
  requirePermission("admin.users.change_role"),
  adminVerifyUser
);

// GET /admin/login-logs - Get all login logs with pagination and filters
router.get(
  "/login-logs",
  auth,
  requireRole(["SUPER", "ADMIN"]),
  getLoginLogs
);

// GET /admin/login-stats - Get login statistics
router.get(
  "/login-stats",
  auth,
  requireRole(["SUPER", "ADMIN"]),
  getLoginStats
);

// Account status control routes
router.put(
  "/users/:id/suspend",
  auth,
  requirePermission("admin.user.suspend"),
  suspendUser
);

router.put(
  "/users/:id/unsuspend",
  auth,
  requirePermission("admin.user.unsuspend"),
  unsuspendUser
);

// Soft delete user (deactivates but keeps data)
router.put(
  "/users/:id/delete",
  auth,
  requireRole(["SUPER", "ADMIN"]),
  deleteUserSoft
);

// Hard delete user (permanently removes user and all data)
router.delete(
  "/users/:id",
  auth,
  requireRole(["SUPER", "ADMIN"]),
  deleteUserHard
);

router.put(
  "/users/:id/restore",
  auth,
  requireRole(["SUPER", "ADMIN"]),
  restoreUser
);

router.put(
  "/users/:id/lock",
  auth,
  requireRole(["SUPER", "ADMIN"]),
  lockUser
);

router.put(
  "/users/:id/unlock",
  auth,
  requireRole(["SUPER", "ADMIN"]),
  unlockUser
);
/* CURSOR PATCH END */

export default router;