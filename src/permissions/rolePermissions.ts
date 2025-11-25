/**
 * RBAC Permission System - Final Implementation
 * Based on the exact permission matrix provided
 */

export type Permission =
  | 'canManageUsers'
  | 'canCreateBids'
  | 'canViewAllBids'
  | 'canEditAllProjects'
  | 'canManagePayments'
  | 'canViewReports'
  | 'canInviteContractors'
  | 'canSchedule'
  | 'canPostJobs'
  | 'canManageApplications';

export type AppRole = 'Admin' | 'GC' | 'Project Manager' | 'Subcontractor' | 'Trade Specialist' | 'Viewer';
export type BackendRoleCode = 'SUPER' | 'ADMIN' | 'FIN' | 'SUPPORT' | 'MOD' | 'PM' | 'GC' | 'SUB' | 'TS' | 'VIEWER';

/**
 * Complete permission matrix - FINAL TRUTH
 * DO NOT MODIFY without explicit approval
 */
export const ROLE_PERMISSIONS: Record<AppRole, Record<Permission, boolean>> = {
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
export function mapBackendRoleToAppRole(roleCode: string | null | undefined): AppRole | null {
  if (!roleCode) return null;

  const upperRoleCode = roleCode.toUpperCase() as BackendRoleCode;

  // Admin roles → Admin
  if (['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'].includes(upperRoleCode)) {
    return 'Admin';
  }

  // App roles map directly
  const roleMap: Record<string, AppRole> = {
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
export function mapRoleNameToAppRole(roleName: string | null | undefined): AppRole | null {
  if (!roleName) return null;

  const roleMap: Record<string, AppRole> = {
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
 * @param roleCode - Backend role code (SUPER, ADMIN, PM, GC, etc.)
 * @param roleName - App role name (Admin, GC, Project Manager, etc.)
 * @param permission - Permission key (e.g., 'canCreateBids')
 * @returns boolean
 */
export function hasPermission(
  roleCode: string | null | undefined,
  roleName: string | null | undefined,
  permission: Permission
): boolean {
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
 * @param roleCode - Backend role code
 * @param roleName - App role name
 * @returns Permission object with all permissions
 */
export function getRolePermissions(
  roleCode: string | null | undefined,
  roleName: string | null | undefined
): Record<Permission, boolean> {
  let appRole = mapBackendRoleToAppRole(roleCode);

  if (!appRole && roleName) {
    appRole = mapRoleNameToAppRole(roleName);
  }

  if (!appRole) {
    return {} as Record<Permission, boolean>;
  }

  return ROLE_PERMISSIONS[appRole] || ({} as Record<Permission, boolean>);
}

/**
 * Permission guard middleware factory
 * @param permission - Permission to check
 * @returns Express middleware function
 */
export function guard(permission: Permission) {
  return async (req: any, res: any, next: any) => {
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
    } catch (err: any) {
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
export function hasAllPermissions(
  roleCode: string | null | undefined,
  roleName: string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(roleCode, roleName, permission));
}

/**
 * Check multiple permissions (OR logic)
 */
export function hasAnyPermission(
  roleCode: string | null | undefined,
  roleName: string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(roleCode, roleName, permission));
}

