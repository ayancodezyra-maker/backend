// Admin controller
import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

/* CURSOR PATCH START */
export const listUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, roles(name, role_code)")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json(formatResponse(false, error.message));
    }

    // Add role_code and user_type to each profile
    const profiles = (data || []).map(profile => ({
      ...profile,
      role_code: profile.roles?.role_code || profile.role_code,
      user_type: profile.user_type || (
        profile.roles?.role_code === "SUPER" || profile.roles?.role_code === "ADMIN"
          ? "ADMIN_USER"
          : "APP_USER"
      )
    }));

    return res.json(formatResponse(true, "Users retrieved", profiles));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message));
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { user_id, role_id, role_code } = req.body;

    if (!user_id || (!role_id && !role_code)) {
      return res
        .status(400)
        .json(formatResponse(false, "user_id and role_id (or role_code) are required", null));
    }

    let roleData;
    let roleError;

    // Support both role_id and role_code
    if (role_code) {
      // Try case-insensitive lookup
      const upperRoleCode = role_code.toUpperCase();
      const result = await supabase
        .from("roles")
        .select("*")
        .eq("role_code", upperRoleCode)
        .maybeSingle();
      
      if (result.error || !result.data) {
        // Try exact match if uppercase doesn't work
        const exactResult = await supabase
          .from("roles")
          .select("*")
          .eq("role_code", role_code)
          .maybeSingle();
        roleData = exactResult.data;
        roleError = exactResult.error;
      } else {
        roleData = result.data;
        roleError = null;
      }
    } else if (role_id) {
      const result = await supabase
        .from("roles")
        .select("*")
        .eq("id", role_id)
        .maybeSingle();
      roleData = result.data;
      roleError = result.error;
    } else {
      return res.status(400).json(formatResponse(false, "role_id or role_code is required", null));
    }

    if (roleError || !roleData) {
      return res.status(400).json(formatResponse(false, `Invalid role_id or role_code. Role not found: ${role_code || role_id}`, null));
    }

    // Determine user type
    const userType =
      roleData.role_code === "SUPER" || roleData.role_code === "ADMIN"
        ? "ADMIN_USER"
        : "APP_USER";

    // Use roleData.id if role_id wasn't provided
    const finalRoleId = role_id || roleData.id;

    // Update profile with role_id, role_code, and user_type
    const { data, error } = await supabase
      .from("profiles")
      .update({
        role_id: finalRoleId, // Use roleData.id if role_id wasn't provided
        role_code: roleData.role_code,
        user_type: userType
      })
      .eq("id", user_id)
      .select("*, roles(name, role_code)")
      .maybeSingle();

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    if (!data) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Add role_code and user_type to response
    data.role_code = data.roles?.role_code || data.role_code;
    data.user_type = data.user_type || userType;

    return res.json(formatResponse(true, "User role updated successfully", data));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

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

// GET /admin/sessions/:user_id - Admin route to get all sessions of a user
export const getUserSessions = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json(formatResponse(false, "user_id is required"));
    }

    // Get all sessions for the specified user, sorted by created_at desc
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("id, ip_address, user_agent, created_at, expires_at")
      .eq("user_id", user_id)
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
      is_active: new Date(session.expires_at) > new Date(),
    }));

    return res.json(
      formatResponse(true, "User sessions retrieved", formattedSessions)
    );
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message));
  }
};

// Admin manually verify user
export const adminVerifyUser = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json(formatResponse(false, "user_id is required", null));
    }

    // Check if user has SUPER or ADMIN role
    const userRole = req.user.role_code || req.user.role;
    if (!["SUPER", "ADMIN"].includes(userRole)) {
      return res.status(403).json(formatResponse(false, "Access denied", null));
    }

    // Update profile to verified
    const { error } = await supabase
      .from("profiles")
      .update({
        email_verified: true,
        verified_at: new Date().toISOString(),
        verification_token: null,
        verification_expires_at: null,
      })
      .eq("id", user_id);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, "User verified manually", null));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

/* CURSOR PATCH START */
// GET /admin/login-logs - Get all login logs with pagination and filters
export const getLoginLogs = async (req, res) => {
  try {
    const { email, user_id, ip, success, limit = 50, page = 1 } = req.query;

    let query = supabase
      .from("login_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (email) {
      query = query.ilike("email_attempted", `%${email}%`);
    }
    if (user_id) {
      query = query.eq("user_id", user_id);
    }
    if (ip) {
      query = query.eq("ip_address", ip);
    }
    if (success !== undefined) {
      query = query.eq("success", success === "true");
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(
      formatResponse(true, "Login logs retrieved", {
        logs: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum),
        },
      })
    );
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

// GET /admin/login-stats - Get login statistics
export const getLoginStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Failed attempts in last 30 days
    const { count: failedCount, error: failedError } = await supabase
      .from("login_logs")
      .select("*", { count: "exact", head: true })
      .eq("success", false)
      .gte("created_at", thirtyDaysAgo);

    if (failedError) {
      return res.status(400).json(formatResponse(false, failedError.message, null));
    }

    // Successful logins in last 30 days
    const { count: successCount, error: successError } = await supabase
      .from("login_logs")
      .select("*", { count: "exact", head: true })
      .eq("success", true)
      .gte("created_at", thirtyDaysAgo);

    if (successError) {
      return res.status(400).json(formatResponse(false, successError.message, null));
    }

    // Top IPs (last 30 days)
    const { data: topIPs, error: topIPsError } = await supabase
      .from("login_logs")
      .select("ip_address")
      .gte("created_at", thirtyDaysAgo)
      .not("ip_address", "is", null);

    if (topIPsError) {
      return res.status(400).json(formatResponse(false, topIPsError.message, null));
    }

    // Count IP occurrences
    const ipCounts = {};
    (topIPs || []).forEach((log) => {
      if (log.ip_address) {
        ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1;
      }
    });

    const topIPsArray = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top devices (last 30 days)
    const { data: topDevices, error: topDevicesError } = await supabase
      .from("login_logs")
      .select("device")
      .gte("created_at", thirtyDaysAgo)
      .not("device", "is", null);

    if (topDevicesError) {
      return res.status(400).json(formatResponse(false, topDevicesError.message, null));
    }

    // Count device occurrences
    const deviceCounts = {};
    (topDevices || []).forEach((log) => {
      if (log.device) {
        deviceCounts[log.device] = (deviceCounts[log.device] || 0) + 1;
      }
    });

    const topDevicesArray = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.json(
      formatResponse(true, "Login statistics retrieved", {
        failed_attempts_last_30_days: failedCount || 0,
        successful_logins_30_days: successCount || 0,
        top_ips: topIPsArray,
        top_devices: topDevicesArray,
      })
    );
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

/* CURSOR PATCH START */
// Suspend user
export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason || null,
      })
      .eq("id", id);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, "User suspended", null));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

// Unsuspend user
export const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, status")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Check if user is actually suspended
    const currentStatus = profile.status || 'active';
    if (currentStatus !== 'suspended') {
      return res.status(400).json(formatResponse(false, "User is not suspended", null));
    }

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        status: 'active',
        suspended_at: null,
        suspension_reason: null,
      })
      .eq("id", id);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, "User unsuspended", null));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

// Soft delete user
export const deleteUserSoft = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    // Optionally delete all sessions for that user
    await supabase
      .from("sessions")
      .delete()
      .eq("user_id", id);

    return res.json(formatResponse(true, "User deactivated", null));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

// Restore user
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, status")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Check if user can be restored
    const currentStatus = profile.status || 'active';
    if (!['deleted', 'suspended', 'locked'].includes(currentStatus)) {
      return res.status(400).json(formatResponse(false, "User is already active", null));
    }

    // Get user email for failed_logins reset
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const user = authUsers?.users?.find(u => u.id === id);
    const userEmail = user?.email;

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        status: 'active',
        deleted_at: null,
        suspended_at: null,
        suspension_reason: null,
        locked_reason: null,
      })
      .eq("id", id);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    // Reset failed_logins if email exists
    if (userEmail) {
      await supabase
        .from("failed_logins")
        .update({
          attempts: 0,
          locked_until: null,
        })
        .eq("email", userEmail);
    }

    return res.json(formatResponse(true, "User restored", null));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

// Lock user
export const lockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Get user email for failed_logins update
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const user = authUsers?.users?.find(u => u.id === id);
    const userEmail = user?.email;

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        status: 'locked',
        locked_reason: reason || 'locked_by_admin',
      })
      .eq("id", id);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    // Update failed_logins - set locked_until to 1 year from now
    if (userEmail) {
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("failed_logins")
        .upsert({
          email: userEmail,
          locked_until: oneYearFromNow,
          attempts: 20, // Set high to prevent unlock
        }, {
          onConflict: "email"
        });
    }

    return res.json(formatResponse(true, "User locked", null));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

// Unlock user
export const unlockUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, status")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Check if user is actually locked
    const currentStatus = profile.status || 'active';
    if (currentStatus !== 'locked') {
      return res.status(400).json(formatResponse(false, "User is not locked", null));
    }

    // Get user email for failed_logins update
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const user = authUsers?.users?.find(u => u.id === id);
    const userEmail = user?.email;

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        status: 'active',
        locked_reason: null,
      })
      .eq("id", id);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    // Reset failed_logins
    if (userEmail) {
      await supabase
        .from("failed_logins")
        .update({
          attempts: 0,
          locked_until: null,
        })
        .eq("email", userEmail);
    }

    return res.json(formatResponse(true, "User unlocked", null));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};

// Hard delete user (permanently delete)
export const deleteUserHard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    // Prevent deleting yourself
    if (req.user.id === id) {
      return res.status(400).json(formatResponse(false, "You cannot delete your own account", null));
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Delete all user sessions
    await supabase
      .from("sessions")
      .delete()
      .eq("user_id", id);

    // Delete profile
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(400).json(formatResponse(false, `Failed to delete profile: ${deleteError.message}`, null));
    }

    // Delete user from Supabase Auth (requires admin client)
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
      if (authDeleteError) {
        // Log error but don't fail if auth user doesn't exist
        console.error("Error deleting auth user:", authDeleteError.message);
      }
    } catch (authError) {
      console.error("Error deleting from auth:", authError.message);
      // Continue even if auth deletion fails
    }

    // Delete from failed_logins if email exists
    if (profile.email) {
      await supabase
        .from("failed_logins")
        .delete()
        .eq("email", profile.email);
    }

    return res.json(formatResponse(true, "User permanently deleted", null));
  } catch (e) {
    return res.status(500).json(formatResponse(false, e.message, null));
  }
};
/* CURSOR PATCH END */