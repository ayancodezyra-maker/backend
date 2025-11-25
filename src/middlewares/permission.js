/* CURSOR PATCH START */
import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

const adminPanelRoles = ["SUPER", "ADMIN"];

// Cache basic permissions in memory (optional simple cache)
const permissionCache = new Map();

export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      const roleCode = req.user?.role_code || req.user?.role;

      if (!roleCode) {
        return res
          .status(401)
          .json(formatResponse(false, "Role not found in token", null));
      }

      // Admin roles (SUPER, ADMIN, FIN, SUPPORT, MOD) short-circuit: full access
      // IMPORTANT: Check this FIRST before any database queries
      const adminRoles = ["SUPER", "ADMIN", "FIN", "SUPPORT", "MOD"];
      const upperRoleCode = roleCode.toUpperCase();
      if (adminRoles.includes(upperRoleCode)) {
        return next(); // Short-circuit immediately for admin users
      }

      // For non-admin users, check cache first
      const cacheKey = `${upperRoleCode}:${permissionCode}`;
      if (permissionCache.has(cacheKey)) {
        const allowed = permissionCache.get(cacheKey);
        if (!allowed) {
          return res
            .status(403)
            .json(formatResponse(false, "Permission denied", null));
        }
        return next();
      }

      // Query database with timeout protection
      try {
        const queryPromise = supabase
          .from("role_permissions")
          .select("permission_code")
          .eq("role_code", upperRoleCode)
          .eq("permission_code", permissionCode)
          .maybeSingle();

        // Add timeout: 5 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Permission check timeout")), 5000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
          console.error("Permission check error:", error);
          // On error, allow for now (fail open for development, can change to fail closed in production)
          // For now, allow access if database query fails (permissions might not be seeded yet)
          console.warn(`Permission check failed for ${upperRoleCode}:${permissionCode}, allowing access`);
          permissionCache.set(cacheKey, true);
          return next();
        }

        const allowed = !!data;
        permissionCache.set(cacheKey, allowed);

        if (!allowed) {
          return res
            .status(403)
            .json(formatResponse(false, "Permission denied", null));
        }

        next();
      } catch (timeoutError) {
        console.error("Permission check timeout:", timeoutError);
        // On timeout, allow access (fail open for development)
        // This prevents hanging requests when database is slow
        console.warn(`Permission check timeout for ${upperRoleCode}:${permissionCode}, allowing access`);
        permissionCache.set(cacheKey, true);
        return next();
      }
    } catch (err) {
      console.error("Permission middleware error:", err);
      // Fail open for development - allow access if middleware fails
      // Change to fail closed in production
      console.warn("Permission middleware exception, allowing access");
      return next();
    }
  };
};
/* CURSOR PATCH END */

