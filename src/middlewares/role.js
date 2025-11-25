import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      /* CURSOR PATCH START */
      // First check JWT token role (faster, no DB call needed)
      const jwtRole = req.user.role;
      const jwtRoleCode = req.user.role_code;

      if (jwtRole && allowedRoles.includes(jwtRole)) {
        return next();
      }
      if (jwtRoleCode && allowedRoles.includes(jwtRoleCode)) {
        return next();
      }

      // Fallback: Check database if JWT doesn't have role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role_id, roles(name, role_code), role_code")
        .eq("id", userId)
        .single();

      if (!profile) {
        return res.status(401).json(formatResponse(false, "Profile not found"));
      }

      const roleName = profile.roles?.name;
      const roleCode = profile.roles?.role_code || profile.role_code;

      // Check if user's role (name or code) is in allowed roles
      const hasAccess =
        allowedRoles.includes(roleName) || allowedRoles.includes(roleCode);

      if (!hasAccess) {
        return res.status(403).json(formatResponse(false, "Access denied"));
      }
      /* CURSOR PATCH END */

      next();
    } catch (err) {
      return res.status(500).json(formatResponse(false, err.message));
    }
  };
};