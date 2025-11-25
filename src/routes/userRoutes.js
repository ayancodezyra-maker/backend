// User routes
import express from "express";
import { auth } from "../middlewares/auth.js";
import { getProfile, updateProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", auth, getProfile);
router.get("/profile", auth, getProfile); // Support both routes
router.put("/update", auth, updateProfile);
router.put("/profile", auth, updateProfile); // Support both routes

export default router;