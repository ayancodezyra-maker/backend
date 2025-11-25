// Auth controller
import { supabase } from "../config/supabaseClient.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import { formatResponse } from "../utils/formatResponse.js";
import { sendEmailVerification, sendOtpEmail } from "../utils/email.js";

dotenv.config();

export const signup = async (req, res) => {
  try {
    const { email, password, full_name, role_code } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(formatResponse(false, "Email and password are required", null));
    }

    // Create user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      // Handle duplicate email error
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return res.status(400).json(formatResponse(false, "Email already registered", null));
      }
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    const userId = data.user.id;

    /* CURSOR PATCH START */
    // Fetch role row (default to VIEWER if role_code not provided)
    const { data: roleRow, error: roleErr } = await supabase
      .from("roles")
      .select("*")
      .eq("role_code", role_code || "VIEWER")
      .single();

    if (roleErr || !roleRow) {
      return res.status(400).json(formatResponse(false, "Invalid role_code", null));
    }

    // Determine user type
    const userType =
      roleRow.role_code === "SUPER" || roleRow.role_code === "ADMIN"
        ? "ADMIN_USER"
        : "APP_USER";

    // 1. Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 2. Set expiry = 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // 3. Save token + expiry in profile (IMPORTANT: Only UPDATE, never INSERT)
    // Note: email_verified set to true for auto-login (verification email still sent)
    const { error: profileUpdateErr } = await supabase
      .from("profiles")
      .update({
        full_name: full_name || "New User",
        role_id: roleRow.id,
        role_code: roleRow.role_code,
        user_type: userType,
        status: 'active',
        email_verified: true, // Auto-login enabled, verification email still sent for security
        verification_token: verificationToken,
        verification_expires_at: expiresAt,
      })
      .eq("id", userId);

    if (profileUpdateErr) {
      return res.status(400).json(formatResponse(false, profileUpdateErr.message, null));
    }

    // 4. Build verification URL
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

    // 5. Send verification email (async, don't block signup)
    try {
      await sendEmailVerification(full_name || "New User", email, verifyUrl);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail signup if email fails, but log it
    }

    // 6. AUTO LOGIN: Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email: email,
        role: roleRow.role_code,
        role_code: roleRow.role_code,
        user_type: userType,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7. AUTO LOGIN: Create session entry
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Get refresh token from Supabase session
    let refreshToken = null;
    try {
      // Sign in to get session with refresh token
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData?.session?.refresh_token) {
        refreshToken = signInData.session.refresh_token;

        // Insert session into sessions table
        try {
          await supabase.from("sessions").insert({
            user_id: userId,
            refresh_token: refreshToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days
          });
        } catch (sessionError) {
          console.error("Failed to create session:", sessionError);
          // Don't fail signup if session insert fails
        }
      }
    } catch (sessionErr) {
      console.error("Failed to create session during signup:", sessionErr);
      // Continue without session - user can still use JWT token
    }

    // 8. Return auto-login response
    return res.status(201).json(
      formatResponse(true, "Signup successful — Auto login completed", {
        token: token,
        user: {
          id: userId,
          email: email,
          full_name: full_name || "New User",
          role: roleRow.role_code,
          role_code: roleRow.role_code,
          user_type: userType,
        }
      })
    );
    /* CURSOR PATCH END */
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* CURSOR PATCH START */
    // Device parser utility function
    const parseDevice = (userAgent) => {
      if (!userAgent) return "Unknown Device";
      const ua = userAgent.toLowerCase();
      let browser = "Unknown Browser";
      if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
      else if (ua.includes("firefox")) browser = "Firefox";
      else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
      else if (ua.includes("edg")) browser = "Edge";
      else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";
      let device = "Unknown";
      if (ua.includes("mobile")) {
        if (ua.includes("iphone")) device = "iPhone";
        else if (ua.includes("ipad")) device = "iPad";
        else if (ua.includes("android")) device = "Android";
        else device = "Mobile";
      } else {
        if (ua.includes("windows")) device = "Windows";
        else if (ua.includes("mac")) device = "macOS";
        else if (ua.includes("linux")) device = "Linux";
        else if (ua.includes("ipad")) device = "iPad";
        else if (ua.includes("iphone")) device = "iPhone";
        else if (ua.includes("android")) device = "Android";
      }
      return `${device} - ${browser}`;
    };

    // Capture request metadata
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const device = parseDevice(userAgent);

    // BEFORE password verification: Check failed_logins table
    const { data: failedLogin, error: failedLoginError } = await supabase
      .from("failed_logins")
      .select("*")
      .eq("email", email)
      .single();

    if (failedLogin && failedLogin.locked_until) {
      const lockedUntil = new Date(failedLogin.locked_until);
      const now = new Date();
      if (lockedUntil > now) {
        // Account is locked
        const minutesRemaining = Math.ceil((lockedUntil - now) / (1000 * 60));
        return res.status(403).json(
          formatResponse(false, `Account locked. Try again in ${minutesRemaining} minute(s).`, null)
        );
      }
    }
    /* CURSOR PATCH END */

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    /* CURSOR PATCH START */
    // ON FAILED LOGIN
    if (error) {
      const reason = error.message.includes("Invalid login") || error.message.includes("password") 
        ? "wrong_password" 
        : "invalid_email";

      // Insert into login_logs
      await supabase.from("login_logs").insert({
        email_attempted: email,
        success: false,
        reason: reason,
        ip_address: ipAddress,
        user_agent: userAgent,
        device: device,
      });

      // Update/Insert failed_logins
      const attempts = (failedLogin?.attempts || 0) + 1;
      let lockedUntil = null;

      // Lock rules
      if (attempts >= 20) {
        // Permanent lock (set to 100 years from now)
        lockedUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
        
        // Set profile status to 'locked' for permanent lock
        // First, get user_id from email if possible
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const user = authUsers?.users?.find(u => u.email === email);
          if (user) {
            await supabase.from("profiles").update({
              status: 'locked',
              locked_reason: 'too_many_failed_logins',
            }).eq("id", user.id);
          }
        } catch (err) {
          console.error("Failed to update profile status:", err);
        }
      } else if (attempts >= 10) {
        // Lock for 24 hours
        lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (attempts >= 5) {
        // Lock for 15 minutes
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }

      await supabase.from("failed_logins").upsert({
        email: email,
        attempts: attempts,
        last_attempt_at: new Date().toISOString(),
        locked_until: lockedUntil,
      }, {
        onConflict: "email"
      });

      return res.status(400).json(formatResponse(false, error.message, null));
    }
    /* CURSOR PATCH END */

    // Fetch profile with role
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, roles(role_code, name)")
      .eq("id", data.user.id)
      .single();

    /* CURSOR PATCH START */
    if (!profile) {
      const userId = data.user.id;
      
      // Get default role "VIEWER"
      const { data: roleRow, error: roleError } = await supabase
        .from("roles")
        .select("id, role_code")
        .eq("role_code", "VIEWER")
        .single();

      if (roleError || !roleRow) {
        return res.status(400).json(formatResponse(false, "Default role 'VIEWER' not found", null));
      }

      // IMPORTANT: Only UPDATE profile, never INSERT
      await supabase.from("profiles").update({
        full_name: "New User",
        role_id: roleRow.id,
        role_code: roleRow.role_code,
        user_type:
          roleRow.role_code === "ADMIN" || roleRow.role_code === "SUPER"
            ? "ADMIN_USER"
            : "APP_USER",
        email_verified: true
      }).eq("id", userId);

      const { data: created } = await supabase
        .from("profiles")
        .select("*, roles(role_code)")
        .eq("id", userId)
        .single();

      profile = created;
    }
    /* CURSOR PATCH END */

    if (!profile) {
      return res.status(400).json(formatResponse(false, "Profile not found", null));
    }

    /* CURSOR PATCH START */
    // Check account status BEFORE email verification check
    const accountStatus = profile.status || 'active';
    
    if (accountStatus === 'suspended') {
      return res
        .status(403)
        .json(formatResponse(false, "Account suspended. Please contact support.", null));
    }
    
    if (accountStatus === 'deleted') {
      return res
        .status(403)
        .json(formatResponse(false, "Account deactivated.", null));
    }
    
    if (accountStatus === 'locked') {
      return res
        .status(403)
        .json(formatResponse(false, "Account locked. Please contact support.", null));
    }
    /* CURSOR PATCH END */

    /* CURSOR PATCH START */
    // Block unverified users from logging in
    if (!profile.email_verified) {
      return res
        .status(403)
        .json(formatResponse(false, "Please verify your email", null));
    }
    /* CURSOR PATCH END */

    /* CURSOR PATCH START */
    // Add role_code and user_type to profile (use profile.role_code if roles relationship missing)
    profile.role_code = profile.roles?.role_code || profile.role_code;
    // Determine user type - Admin panel roles: SUPER, ADMIN, FIN, MOD, SUPPORT
    const adminPanelRoles = ["SUPER", "ADMIN", "FIN", "MOD", "SUPPORT"];
    profile.user_type = profile.user_type || (
      adminPanelRoles.includes(profile.role_code)
        ? "ADMIN_USER"
        : "APP_USER"
    );
    /* CURSOR PATCH END */

    /* CURSOR PATCH START - MFA CHECK */
    // Check if MFA is enabled - if yes, generate OTP instead of JWT
    if (profile.mfa_enabled === true) {
      // Get initial refresh token from login session (before MFA)
      const initialRefreshToken = data.session?.refresh_token;

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
      const tempToken = crypto.randomBytes(32).toString("hex");

      // Update profile with OTP details and store initial refresh token temporarily
      await supabase.from("profiles").update({
        mfa_otp: otp,
        mfa_otp_expires_at: otpExpiresAt,
        mfa_temp_token: tempToken,
        mfa_attempts: 0,
        mfa_temp_refresh_token: initialRefreshToken || null,
      }).eq("id", data.user.id);

      // Send OTP email
      try {
        await sendOtpEmail(profile.full_name || "User", profile.email || email, otp);
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        // Don't fail login if email fails, but log it
      }

      // Return MFA required response - STOP execution here
      return res.json(
        formatResponse(true, "MFA required", {
          mfa_required: true,
          temp_token: tempToken,
          email: email,
        })
      );
    }
    /* CURSOR PATCH END - MFA CHECK */

    /* CURSOR PATCH START */
    // Generate JWT token with role_code and user_type
    const token = jwt.sign(
      {
        id: data.user.id,
        email: data.user.email,
        role: profile.roles?.role_code || profile.roles?.name || profile.role_code,
        role_code: profile.role_code,
        user_type: profile.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Get refresh token from initial login session
    const initialRefreshToken = data.session?.refresh_token;
    
    if (!initialRefreshToken) {
      return res.status(400).json(formatResponse(false, "Failed to get refresh token from login", null));
    }

    // Generate a new refresh token every login
    // NOTE: Do NOT delete old sessions - allow multiple devices
    const { data: sessionData, error: sessionErr } = await supabase.auth.refreshSession({ 
      refresh_token: initialRefreshToken 
    });

    if (sessionErr || !sessionData?.session) {
      return res.status(400).json(formatResponse(false, "Failed to refresh session: " + (sessionErr?.message || "Unknown error"), null));
    }

    // Save refresh token into sessions table
    await supabase.from("sessions").insert({
      user_id: data.user.id,
      refresh_token: sessionData.session.refresh_token,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
    });

    // Use new tokens from refreshed session
    const access_token = sessionData.session.access_token;
    const refresh_token = sessionData.session.refresh_token;
    const expires_at = sessionData.session.expires_at;

    /* CURSOR PATCH START */
    // ON SUCCESSFUL LOGIN: Insert into login_logs
    await supabase.from("login_logs").insert({
      user_id: data.user.id,
      email_attempted: email,
      success: true,
      ip_address: ipAddress,
      user_agent: userAgent,
      device: device,
    });

    // Reset failed_logins for that email (attempts = 0)
    if (failedLogin) {
      await supabase.from("failed_logins").update({
        attempts: 0,
        locked_until: null,
        last_attempt_at: new Date().toISOString(),
      }).eq("email", email);
    }

    // Update profiles.last_login_at and last_login_ip (ONLY UPDATE, never INSERT)
    await supabase.from("profiles").update({
      last_login_at: new Date().toISOString(),
      last_login_ip: ipAddress,
    }).eq("id", data.user.id);
    /* CURSOR PATCH END */

    return res.json(
      formatResponse(true, "Login successful", {
        token, // Custom JWT token
        access_token, // Supabase access token
        refresh_token, // Supabase refresh token
        expires_at, // Token expiration timestamp
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile.full_name,
          role: profile.roles,
          role_code: profile.role_code,
          user_type: profile.user_type,
        },
      })
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

/* CURSOR ADDED START: getMe and updateProfile functions */
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(formatResponse(false, "User not authenticated", null));
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role_code, user_type, phone, avatar_url, created_at, updated_at, roles(name, role_code, type)")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return res.status(404).json(formatResponse(false, "Profile not found", null));
    }

    // Add role_code and user_type to profile response
    profile.role_code = profile.roles?.role_code || profile.role_code;
    profile.user_type = profile.user_type || (
      profile.role_code === "SUPER" || profile.role_code === "ADMIN"
        ? "ADMIN_USER"
        : "APP_USER"
    );

    // Return simplified response matching test expectations
    return res.json(formatResponse(true, "Profile retrieved", {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role_code: profile.role_code,
      user_type: profile.user_type,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
    }));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(formatResponse(false, "User not authenticated", null));
    }

    const { full_name, phone, avatar_url } = req.body;

    // Only allow specific fields to be updated
    const updateData = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    if (Object.keys(updateData).length === 1) { // Only updated_at
      return res
        .status(400)
        .json(formatResponse(false, "No valid fields to update", null));
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, full_name, role_code, user_type, phone, avatar_url")
      .single();

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    if (!data) {
      return res.status(404).json(formatResponse(false, "Profile not found", null));
    }

    return res.json(formatResponse(true, "Profile updated successfully", data));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};
/* CURSOR ADDED END */

/* CURSOR ADDED START: Additional auth functions - change-password, forgot-password, reset-password, refresh-token, logout, admin/create-user */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { old_password, current_password, new_password } = req.body;

    // Support both old_password and current_password
    const passwordToVerify = old_password || current_password;

    if (!passwordToVerify || !new_password) {
      return res
        .status(400)
        .json(formatResponse(false, "current_password (or old_password) and new_password are required"));
    }

    // Get user email if not in JWT
    let email = userEmail;
    if (!email) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(userId);
      if (userError || !userData?.user) {
        return res.status(404).json(formatResponse(false, "User not found"));
      }
      email = userData.user.email;
    }

    // Verify old password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: passwordToVerify,
    });

    if (verifyError) {
      return res
        .status(400)
        .json(formatResponse(false, "Current password is incorrect"));
    }

    // Update password using Supabase admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: new_password }
    );

    if (updateError) {
      return res
        .status(400)
        .json(formatResponse(false, updateError.message));
    }

    return res.json(formatResponse(true, "Password updated successfully"));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

/* CURSOR PATCH START */
// Helper function to check password reset rate limits
const checkPasswordResetRateLimit = async (email, ip, userAgent) => {
  try {
    // Get user_id from auth.users by email, then check profile
    let userId = null;
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const user = authUsers?.users?.find(u => u.email === email);
      userId = user?.id;
    } catch (e) {
      // If can't get user, continue with rate limit check based on logs only
    }

    // Check if user is currently blocked (if user exists)
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("reset_block_until")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        // Profile not found, continue with rate limit check
      } else if (profile.reset_block_until) {
        const blockUntil = new Date(profile.reset_block_until);
        const now = new Date();
        if (blockUntil > now) {
          const minutesRemaining = Math.ceil((blockUntil - now) / (1000 * 60));
          return {
            blocked: true,
            message: `Too many reset requests. Try again in ${minutesRemaining} minute(s).`,
          };
        }
      }
    }

    // Count requests in last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: hourlyCount } = await supabase
      .from("password_reset_logs")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    // Count requests in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dailyCount } = await supabase
      .from("password_reset_logs")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneDayAgo);

    const hourly = hourlyCount || 0;
    const daily = dailyCount || 0;

    // Apply rate limit rules for forgot-password
    // Max 3 requests per hour, Max 10 requests per day
    if (hourly >= 3) {
      const blockUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      if (userId) {
        await supabase
          .from("profiles")
          .update({ reset_block_until: blockUntil })
          .eq("id", userId);
      }
      return {
        blocked: true,
        message: "Too many reset requests. Try again in 1 hour.",
      };
    }

    if (daily >= 10) {
      const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      if (userId) {
        await supabase
          .from("profiles")
          .update({ reset_block_until: blockUntil })
          .eq("id", userId);
      }
      return {
        blocked: true,
        message: "Too many reset requests. Try again in 24 hours.",
      };
    }

    return { blocked: false };
  } catch (err) {
    console.error("Rate limit check error:", err);
    return { blocked: false }; // Allow on error to prevent blocking legitimate users
  }
};
/* CURSOR PATCH END */

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json(formatResponse(false, "Email is required", null));
    }

    /* CURSOR PATCH START - PASSWORD RESET RATE LIMIT */
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ua = req.headers["user-agent"] || "Unknown";

    // Check if user exists (to prevent email enumeration)
    let user = null;
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      user = authUsers?.users?.find(u => u.email === email);
    } catch (e) {
      // If can't check, continue anyway
    }

    // Check rate limit only if user exists
    if (user) {
      const limit = await checkPasswordResetRateLimit(email, ip, ua);

      if (limit.blocked) {
        await supabase.from("password_reset_logs").insert({
          email,
          ip_address: ip,
          user_agent: ua,
          success: false,
          reason: "rate_limit",
        });

        return res.status(429).json(formatResponse(false, limit.message, null));
      }
    }
    /* CURSOR PATCH END */

    // Send password reset email
    // Use current server port for redirect URL
    const serverPort = process.env.PORT || 5000;
    const redirectUrl = process.env.FRONTEND_URL || `http://localhost:${serverPort}`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}/reset-password`,
    });

    if (error) {
      /* CURSOR PATCH START */
      // To prevent email enumeration attacks - always return success message
      // Log failed attempt if user doesn't exist
      if (!user) {
        await supabase.from("password_reset_logs").insert({
          email,
          ip_address: ip,
          user_agent: ua,
          success: false,
          reason: "email_not_found",
        });
      } else {
        await supabase.from("password_reset_logs").insert({
          email,
          ip_address: ip,
          user_agent: ua,
          success: false,
          reason: "email_send_failed",
        });
      }
      /* CURSOR PATCH END */
      // Always return success for security (don't reveal if email exists)
      return res.status(200).json(formatResponse(true, "If the email exists, a reset link will be sent.", null));
    }

    /* CURSOR PATCH START */
    // Log successful email sent
    await supabase.from("password_reset_logs").insert({
      email,
      ip_address: ip,
      user_agent: ua,
      success: true,
      reason: "email_sent",
    });
    /* CURSOR PATCH END */

    // Always return success for security (don't reveal if email exists)
    return res.json(
      formatResponse(
        true,
        "If the email exists, a reset link will be sent.",
        null
      )
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { access_token, new_password, email } = req.body;

    if (!access_token || !new_password) {
      return res
        .status(400)
        .json(formatResponse(false, "access_token and new_password are required", null));
    }

    /* CURSOR PATCH START - RESET PASSWORD ATTEMPT LIMIT */
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ua = req.headers["user-agent"] || "Unknown";

    // Get user email from token first
    let userEmail = email;
    
    // Try to get email from token
    try {
      const { data: userData } = await supabase.auth.getUser(access_token);
      if (userData?.user?.email) {
        userEmail = userData.user.email;
      }
    } catch (e) {
      // Will handle invalid token below
    }

    // Check rate limit for reset-password attempts (if email available)
    // IMPORTANT: Only check reset-specific logs, not forgot-password logs
    if (userEmail) {
      // Get user_id to check profile block status
      let userId = null;
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const user = authUsers?.users?.find(u => u.email === userEmail);
        userId = user?.id;
      } catch (e) {
        // Continue without userId
      }

      // Check if user is currently blocked
      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("reset_block_until")
          .eq("id", userId)
          .single();

        if (!profileError && profile && profile.reset_block_until) {
          const blockUntil = new Date(profile.reset_block_until);
          const now = new Date();
          if (blockUntil > now) {
            const minutes = Math.ceil((blockUntil - now) / 60000);
            await supabase.from("password_reset_logs").insert({
              email: userEmail,
              ip_address: ip,
              user_agent: ua,
              success: false,
              reason: "rate_limit_reset_attempts",
            });
            return res.status(429).json(formatResponse(false, `Too many reset requests. Try again in ${minutes} minutes.`, null));
          }
        }
      }

      // Count ONLY reset-password attempts (not forgot-password) in last 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: attempts } = await supabase
        .from("password_reset_logs")
        .select("*")
        .eq("email", userEmail)
        .in("reason", ["invalid_token", "password_reset_success", "password_update_failed"])
        .gte("created_at", oneHourAgo);

      const hourlyAttempts = attempts?.length || 0;

      // Max 5 reset-password attempts per hour
      if (hourlyAttempts >= 5) {
        await supabase.from("password_reset_logs").insert({
          email: userEmail,
          ip_address: ip,
          user_agent: ua,
          success: false,
          reason: "rate_limit_reset_attempts",
        });
        return res.status(429).json(formatResponse(false, "Too many reset attempts. Try later.", null));
      }

      // Check daily limit (15 per day) - only reset-specific logs
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: dailyAttempts } = await supabase
        .from("password_reset_logs")
        .select("*")
        .eq("email", userEmail)
        .in("reason", ["invalid_token", "password_reset_success", "password_update_failed"])
        .gte("created_at", oneDayAgo);

      const dailyCount = dailyAttempts?.length || 0;

      if (dailyCount >= 15) {
        await supabase.from("password_reset_logs").insert({
          email: userEmail,
          ip_address: ip,
          user_agent: ua,
          success: false,
          reason: "rate_limit_reset_attempts_daily",
        });
        return res.status(429).json(formatResponse(false, "Too many reset attempts today. Try again tomorrow.", null));
      }
    }
    /* CURSOR PATCH END */

    // Verify the token and get user info
    // The access_token from email is a recovery token
    const { data: userData, error: verifyError } = await supabase.auth.getUser(access_token);

    if (verifyError || !userData?.user) {
      /* CURSOR PATCH START */
      // Log invalid token attempt
      if (userEmail) {
        await supabase.from("password_reset_logs").insert({
          email: userEmail,
          ip_address: ip,
          user_agent: ua,
          success: false,
          reason: "invalid_token",
        });
      }
      /* CURSOR PATCH END */
      return res
        .status(400)
        .json(formatResponse(false, "Invalid or expired reset token. Please request a new password reset link.", null));
    }

    const userId = userData.user.id;
    const finalEmail = userData.user.email || userEmail;

    // Check if profile exists before updating
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(400).json(formatResponse(false, "Profile not found", null));
    }

    // Use admin API to update password directly (since we have service role key)
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: new_password,
    });

    if (updateError) {
      /* CURSOR PATCH START */
      // Log password update failure
      await supabase.from("password_reset_logs").insert({
        email: finalEmail,
        ip_address: ip,
        user_agent: ua,
        success: false,
        reason: "password_update_failed",
      });
      /* CURSOR PATCH END */
      return res.status(400).json(formatResponse(false, updateError.message, null));
    }

    /* CURSOR PATCH START */
    // Log successful password reset
    await supabase.from("password_reset_logs").insert({
      email: finalEmail,
      ip_address: ip,
      user_agent: ua,
      success: true,
      reason: "password_reset_success",
    });

    // Clear reset_block_until on successful reset
    await supabase
      .from("profiles")
      .update({ reset_block_until: null })
      .eq("id", userId);
    /* CURSOR PATCH END */

    return res.json(formatResponse(true, "Password reset successfully", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res
        .status(400)
        .json(formatResponse(false, "refresh_token is required"));
    }

    /* CURSOR PATCH START */
    // Validate refresh_token exists in sessions table
    const { data: sessionRecord, error: sessionCheckError } = await supabase
      .from("sessions")
      .select("*")
      .eq("refresh_token", refresh_token)
      .single();

    // If not found → reject (token reuse attack)
    if (sessionCheckError || !sessionRecord) {
      return res
        .status(401)
        .json(formatResponse(false, "Token reuse detected. Invalid or expired refresh token."));
    }

    // Generate new access + refresh tokens
    const { data: newSession, error: refreshError } = await supabase.auth.refreshSession({ 
      refresh_token 
    });

    if (refreshError || !newSession?.session) {
      return res
        .status(401)
        .json(formatResponse(false, "Failed to refresh session: " + (refreshError?.message || "Unknown error")));
    }

    // Delete old session
    await supabase.from("sessions").delete().eq("refresh_token", refresh_token);

    // Insert new session with new refresh_token
    await supabase.from("sessions").insert({
      user_id: sessionRecord.user_id,
      refresh_token: newSession.session.refresh_token,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
    });
    /* CURSOR PATCH END */

    return res.json(
      formatResponse(true, "Token refreshed successfully", {
        access_token: newSession.session.access_token,
        refresh_token: newSession.session.refresh_token,
      })
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res
        .status(400)
        .json(formatResponse(false, "refresh_token is required", null));
    }

    /* CURSOR PATCH START */
    // Delete session by refresh_token from sessions table
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("refresh_token", refresh_token);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }
    /* CURSOR PATCH END */

    return res.json(
      formatResponse(true, "Logged out successfully", null)
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

/* CURSOR PATCH START - MFA VERIFY OTP */
// Verify OTP for MFA login
export const verifyOtp = async (req, res) => {
  try {
    const { temp_token, otp } = req.body;

    if (!temp_token || !otp) {
      return res.status(400).json(formatResponse(false, "temp_token and otp are required", null));
    }

    // Find user by temp_token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, roles(role_code, name)")
      .eq("mfa_temp_token", temp_token)
      .single();

    if (profileError || !profile) {
      return res.status(400).json(formatResponse(false, "Invalid or expired temp_token", null));
    }

    // Check if user is blocked (reset_block_until)
    if (profile.reset_block_until && new Date(profile.reset_block_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(profile.reset_block_until) - new Date()) / (1000 * 60));
      return res.status(429).json(
        formatResponse(false, `Too many OTP attempts. Try again in ${minutesRemaining} minute(s).`, null)
      );
    }

    // Check if OTP is expired
    if (profile.mfa_otp_expires_at && new Date(profile.mfa_otp_expires_at) < new Date()) {
      // Clear expired OTP
      await supabase.from("profiles").update({
        mfa_otp: null,
        mfa_otp_expires_at: null,
        mfa_temp_token: null,
        mfa_attempts: 0,
        mfa_temp_refresh_token: null,
      }).eq("id", profile.id);

      return res.status(400).json(formatResponse(false, "OTP expired", null));
    }

    // Verify OTP
    const providedOtp = otp.toString().trim();
    const storedOtp = profile.mfa_otp?.toString().trim();

    if (providedOtp !== storedOtp) {
      // Increment attempts
      const attempts = (profile.mfa_attempts || 0) + 1;
      let blockUntil = null;

      // If 5+ attempts, block for 15 minutes
      if (attempts >= 5) {
        blockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await supabase.from("profiles").update({
          reset_block_until: blockUntil,
          mfa_attempts: attempts,
        }).eq("id", profile.id);

        return res.status(429).json(formatResponse(false, "Too many OTP attempts. Try again in 15 minutes.", null));
      }

      // Update attempts
      await supabase.from("profiles").update({
        mfa_attempts: attempts,
      }).eq("id", profile.id);

      return res.status(400).json(formatResponse(false, "Invalid OTP", null));
    }

    // OTP is correct - proceed with login
    const userId = profile.id;
    const email = profile.email;

    // Get stored refresh token from login (before MFA)
    const storedRefreshToken = profile.mfa_temp_refresh_token;

    // Clear OTP fields
    await supabase.from("profiles").update({
      mfa_otp: null,
      mfa_otp_expires_at: null,
      mfa_temp_token: null,
      mfa_attempts: 0,
      mfa_temp_refresh_token: null,
    }).eq("id", userId);

    // Generate JWT token (same as login)
    profile.role_code = profile.roles?.role_code || profile.role_code;
    const adminPanelRoles = ["SUPER", "ADMIN", "FIN", "MOD", "SUPPORT"];
    profile.user_type = profile.user_type || (
      adminPanelRoles.includes(profile.role_code)
        ? "ADMIN_USER"
        : "APP_USER"
    );

    const token = jwt.sign(
      {
        id: userId,
        email: email,
        role: profile.roles?.role_code || profile.roles?.name || profile.role_code,
        role_code: profile.role_code,
        user_type: profile.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create session using stored refresh token from login
    let refreshToken = null;
    let accessToken = null;
    let expiresAt = null;

    if (storedRefreshToken) {
      try {
        // Refresh the session to get new tokens
        const { data: sessionData, error: sessionErr } = await supabase.auth.refreshSession({
          refresh_token: storedRefreshToken,
        });

        if (!sessionErr && sessionData?.session) {
          refreshToken = sessionData.session.refresh_token;
          accessToken = sessionData.session.access_token;
          expiresAt = sessionData.session.expires_at;

          // Insert new session
          const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          const userAgent = req.headers['user-agent'] || 'Unknown';

          await supabase.from("sessions").insert({
            user_id: userId,
            refresh_token: refreshToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
          });
        }
      } catch (sessionErr) {
        console.error("Failed to create session after OTP verification:", sessionErr);
        // Continue without session - user can still use JWT token
      }
    } else {
      // If no stored refresh token, try to use existing session
      try {
        const { data: latestSession } = await supabase
          .from("sessions")
          .select("refresh_token, expires_at")
          .eq("user_id", userId)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (latestSession?.refresh_token) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.refreshSession({
            refresh_token: latestSession.refresh_token,
          });

          if (!sessionErr && sessionData?.session) {
            refreshToken = sessionData.session.refresh_token;
            accessToken = sessionData.session.access_token;
            expiresAt = sessionData.session.expires_at;

            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'] || 'Unknown';

            await supabase.from("sessions").insert({
              user_id: userId,
              refresh_token: refreshToken,
              ip_address: ipAddress,
              user_agent: userAgent,
              expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            });
          }
        }
      } catch (sessionErr) {
        console.error("Failed to create session after OTP verification:", sessionErr);
      }
    }

    // Log successful login
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await supabase.from("login_logs").insert({
      user_id: userId,
      email_attempted: email,
      success: true,
      ip_address: ipAddress,
      user_agent: userAgent,
      device: "Unknown Device",
    });

    // Update last login
    await supabase.from("profiles").update({
      last_login_at: new Date().toISOString(),
      last_login_ip: ipAddress,
    }).eq("id", userId);

    // Return login success response
    return res.json(
      formatResponse(true, "Login successful", {
        token,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        user: {
          id: userId,
          email: email,
          full_name: profile.full_name,
          role: profile.roles,
          role_code: profile.role_code,
          user_type: profile.user_type,
        },
      })
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// Toggle MFA on/off
export const toggleMfa = async (req, res) => {
  try {
    const { enable } = req.body;
    const userId = req.user.id;

    if (typeof enable !== "boolean") {
      return res.status(400).json(formatResponse(false, "enable must be true or false", null));
    }

    // Update MFA enabled status
    const { error } = await supabase
      .from("profiles")
      .update({
        mfa_enabled: enable,
        // Clear OTP fields when disabling
        ...(enable === false && {
          mfa_otp: null,
          mfa_otp_expires_at: null,
          mfa_temp_token: null,
          mfa_attempts: 0,
        }),
      })
      .eq("id", userId);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(
      formatResponse(true, "MFA updated", {
        enabled: enable,
      })
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};
/* CURSOR PATCH END - MFA VERIFY OTP */

/* CURSOR PATCH START */
// Utility function to parse device from user-agent
function parseDevice(userAgent) {
  if (!userAgent) return "Unknown Device";
  
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = "Unknown Browser";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";
  
  // Detect device/OS
  let device = "Unknown";
  if (ua.includes("mobile")) {
    if (ua.includes("iphone")) device = "iPhone";
    else if (ua.includes("ipad")) device = "iPad";
    else if (ua.includes("android")) device = "Android";
    else device = "Mobile";
  } else {
    if (ua.includes("windows")) device = "Windows";
    else if (ua.includes("mac")) device = "macOS";
    else if (ua.includes("linux")) device = "Linux";
    else if (ua.includes("ipad")) device = "iPad";
    else if (ua.includes("iphone")) device = "iPhone";
    else if (ua.includes("android")) device = "Android";
  }
  
  return `${device} - ${browser}`;
}

// GET /auth/sessions - Return current user's active sessions
export const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active sessions for current user
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("id, ip_address, user_agent, created_at, expires_at")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString()) // Only active sessions
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json(formatResponse(false, error.message));
    }

    // Format sessions with parsed device info
    const formattedSessions = (sessions || []).map(session => ({
      id: session.id,
      ip_address: session.ip_address,
      device: parseDevice(session.user_agent),
      login_time: session.created_at,
      expires_at: session.expires_at,
    }));

    return res.json(
      formatResponse(true, "Sessions retrieved", formattedSessions)
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// DELETE /auth/sessions/:id - Delete specific session
export const deleteSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    if (!sessionId) {
      return res.status(400).json(formatResponse(false, "Session ID is required"));
    }

    // First verify the session belongs to the current user
    const { data: session, error: checkError } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (checkError || !session) {
      return res.status(404).json(formatResponse(false, "Session not found"));
    }

    // Ensure user can only delete their own session
    if (session.user_id !== userId) {
      return res.status(403).json(formatResponse(false, "Access denied"));
    }

    // Delete the session
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId); // Double check for security

    if (error) {
      return res.status(400).json(formatResponse(false, error.message));
    }

    return res.json(formatResponse(true, "Session deleted successfully"));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};
/* CURSOR PATCH END */

/* CURSOR PATCH START */
// Verify email endpoint
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json(formatResponse(false, "Missing token", null));
    }

    // Find token in DB
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("verification_token", token)
      .single();

    if (error || !user) {
      return res.status(400).json(formatResponse(false, "Invalid token", null));
    }

    if (new Date(user.verification_expires_at) < new Date()) {
      return res.status(400).json(formatResponse(false, "Token expired", null));
    }

    // Update profile → Verified
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email_verified: true,
        verified_at: new Date().toISOString(),
        verification_token: null,
        verification_expires_at: null,
      })
      .eq("id", user.id);

    if (updateError) {
      return res.status(400).json(formatResponse(false, updateError.message, null));
    }

    return res.json(formatResponse(true, "Email verified successfully", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(formatResponse(false, "Email is required", null));
    }

    // Try to get user by email using admin API
    let userId = null;
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const user = authUsers?.users?.find(u => u.email === email);
      if (user) {
        userId = user.id;
      }
    } catch (authError) {
      // If we can't find user, return generic message for security
      return res.json(formatResponse(true, "If this email exists, we sent a link.", null));
    }

    if (!userId) {
      // Don't reveal if email exists for security
      return res.json(formatResponse(true, "If this email exists, we sent a link.", null));
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.json(formatResponse(true, "If this email exists, we sent a link.", null));
    }

    if (profile.email_verified) {
      return res.json(formatResponse(false, "Email already verified", null));
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Update profile with new token
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        verification_token: token,
        verification_expires_at: expiresAt,
      })
      .eq("id", userId);

    if (updateError) {
      return res.status(400).json(formatResponse(false, updateError.message, null));
    }

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    try {
      await sendEmailVerification(profile.full_name, email, verifyUrl);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json(formatResponse(false, "Failed to send email", null));
    }

    return res.json(formatResponse(true, "Verification email resent", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};
/* CURSOR PATCH END */

export const adminCreateUser = async (req, res) => {
  try {
    const { email, password, full_name, role_code } = req.body;

    if (!email || !password || !full_name || !role_code) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "email, password, full_name, and role_code are required"
          )
        );
    }

    /* CURSOR PATCH START */
    // Find role by role_code - get full role data
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("*")
      .eq("role_code", role_code)
      .single();

    if (roleError || !roleData) {
      return res.status(400).json(formatResponse(false, "Invalid role_code"));
    }

    // Create user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json(formatResponse(false, error.message));
    }

    // IMPORTANT: Only UPDATE profile, never INSERT
    // Determine user type
    const userType =
      roleData.role_code === "SUPER" || roleData.role_code === "ADMIN"
        ? "ADMIN_USER"
        : "APP_USER";

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name,
        role_id: roleData.id,
        role_code: roleData.role_code,
        user_type: userType,
        email_verified: true,
      })
      .eq("id", data.user.id);

    if (profileError) {
      // Cleanup: delete the created user if profile update fails
      await supabase.auth.admin.deleteUser(data.user.id);
      return res.status(400).json(formatResponse(false, profileError.message));
    }
    /* CURSOR PATCH END */

    return res.status(201).json(
      formatResponse(true, "User created successfully", {
        userId: data.user.id,
        email: data.user.email,
      })
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};
/* CURSOR ADDED END */