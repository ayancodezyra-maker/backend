// Auth routes
import express from "express";
import {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  adminCreateUser,
  getSessions,
  deleteSession,
  verifyEmail,
  resendVerification,
  verifyOtp,
  toggleMfa,
} from "../controllers/authController.js";
import { auth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/role.js";
/* CURSOR PATCH START */
import { requirePermission } from "../middlewares/permission.js";
import { loginLimiter, resetLimiter } from "../middlewares/rateLimit.js";
/* CURSOR PATCH END */

const router = express.Router();

router.post("/signup", signup);
/* CURSOR PATCH START */
router.post("/login", loginLimiter, login);
/* CURSOR PATCH END */
/* CURSOR PATCH START */
// Get current user - All authenticated users can access their own profile
router.get("/me", auth, getMe);
// Update profile - All authenticated users can update their own profile
router.put("/update-profile", auth, updateProfile);
/* CURSOR PATCH END */

/* CURSOR ADDED START: Additional auth routes */
router.post("/change-password", auth, changePassword);
router.put("/change-password", auth, changePassword); // Support both POST and PUT
router.post("/forgot-password", forgotPassword);
/* CURSOR PATCH START */
router.post("/reset-password", resetLimiter, resetPassword);
/* CURSOR PATCH END */
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
/* CURSOR PATCH START */
router.post(
  "/admin/create-user",
  auth,
  requirePermission("admin.users.create"),
  adminCreateUser
);
/* CURSOR PATCH END */

/* CURSOR PATCH START */
// Session management routes
router.get("/sessions", auth, getSessions);
router.delete("/sessions/:id", auth, deleteSession);

// Email verification routes
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// MFA routes
router.post("/verify-otp", verifyOtp);
router.post("/toggle-mfa", auth, toggleMfa);
/* CURSOR PATCH END */
/* CURSOR ADDED END */

export default router;