/**
 * RBAC Permission System - Final Implementation
 * Based on the exact permission matrix provided
 */

/**
 * Complete permission matrix - FINAL TRUTH
 * DO NOT MODIFY without explicit approval
 */
export const ROLE_PERMISSIONS = {
  Admin: {
    canManageUsers: true,
    canCreateBids: true,
    canViewAllBids: true,
    canEditAllProjects: true,
    canManagePayments: true,
    canViewReports: true,
    canInviteContractors: true,
    canSchedule: true,
    canPostJobs: true,
    canManageApplications: true,
  },
  GC: {
    canManageUsers: false,
    canCreateBids: true,
    canViewAllBids: true,
    canEditAllProjects: true,
    canManagePayments: true,
    canViewReports: true,
    canInviteContractors: true,
    canSchedule: true,
    canPostJobs: false,
    canManageApplications: false,
  },
  'Project Manager': {
    canManageUsers: false,
    canCreateBids: true,
    canViewAllBids: true,
    canEditAllProjects: false,
    canManagePayments: false,
    canViewReports: true,
    canInviteContractors: true,
    canSchedule: true,
    canPostJobs: true,
    canManageApplications: true,
  },
  Subcontractor: {
    canManageUsers: false,
    canCreateBids: false,
    canViewAllBids: false,
    canEditAllProjects: false,
    canManagePayments: false,
    canViewReports: false,
    canInviteContractors: false,
    canSchedule: false,
    canPostJobs: false,
    canManageApplications: false,
  },
  'Trade Specialist': {
    canManageUsers: false,
    canCreateBids: false,
    canViewAllBids: false,
    canEditAllProjects: false,
    canManagePayments: false,
    canViewReports: false,
    canInviteContractors: false,
    canSchedule: false,
    canPostJobs: false,
    canManageApplications: false,
  },
  Viewer: {
    canManageUsers: false,
    canCreateBids: false,
    canViewAllBids: false,
    canEditAllProjects: false,
    canManagePayments: false,
    canViewReports: true, // ONLY permission for Viewer
    canInviteContractors: false,
    canSchedule: false,
    canPostJobs: false,
    canManageApplications: false,
  },
};

/**
 * Map backend role codes to app roles
 * Admin roles (SUPER, ADMIN, FIN, SUPPORT, MOD) → Admin
 * App roles map directly
 */
export function mapBackendRoleToAppRole(roleCode) {
  if (!roleCode) return null;

  const upperRoleCode = roleCode.toUpperCase();

  // Admin roles → Admin
  if (['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(upperRoleCode)) {
    return 'Admin';
  }

  // App roles map directly
  const roleMap = {
    PM: 'Project Manager',
    GC: 'GC',
    SUB: 'Subcontractor',
    TS: 'Trade Specialist',
    VIEWER: 'Viewer',
  };

  return roleMap[upperRoleCode] || null;
}

/**
 * Map app role name to app role enum
 */
export function mapRoleNameToAppRole(roleName) {
  if (!roleName) return null;

  const roleMap = {
    Admin: 'Admin',
    GC: 'GC',
    'Project Manager': 'Project Manager',
    Subcontractor: 'Subcontractor',
    'Trade Specialist': 'Trade Specialist',
    Viewer: 'Viewer',
  };

  return roleMap[roleName] || null;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(roleCode, roleName, permission) {
  // Try to get app role from roleCode first, then roleName
  let appRole = mapBackendRoleToAppRole(roleCode);

  if (!appRole && roleName) {
    appRole = mapRoleNameToAppRole(roleName);
  }

  if (!appRole) {
    return false;
  }

  const rolePerms = ROLE_PERMISSIONS[appRole];
  if (!rolePerms) {
    return false;
  }

  return rolePerms[permission] === true;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(roleCode, roleName) {
  let appRole = mapBackendRoleToAppRole(roleCode);

  if (!appRole && roleName) {
    appRole = mapRoleNameToAppRole(roleName);
  }

  if (!appRole) {
    return {};
  }

  return ROLE_PERMISSIONS[appRole] || {};
}

/**
 * Permission guard middleware factory
 */
export function guard(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          data: null,
        });
      }

      const roleCode = req.user?.role_code || req.user?.role;
      const roleName = req.user?.role_name || req.user?.role;

      const allowed = hasPermission(roleCode, roleName, permission);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${permission}`,
          data: null,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        data: null,
      });
    }
  };
}

/**
 * Check multiple permissions (AND logic)
 */
export function hasAllPermissions(roleCode, roleName, permissions) {
  return permissions.every((permission) => hasPermission(roleCode, roleName, permission));
}

/**
 * Check multiple permissions (OR logic)
 */
export function hasAnyPermission(roleCode, roleName, permissions) {
  return permissions.some((permission) => hasPermission(roleCode, roleName, permission));
}

