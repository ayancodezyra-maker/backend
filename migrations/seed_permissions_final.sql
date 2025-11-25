-- =====================================================
-- Final Permission Matrix Seed
-- Based on exact RBAC requirements
-- =====================================================

-- Insert RBAC permissions
INSERT INTO public.permissions (code, description, module) VALUES
  ('canManageUsers', 'Manage users (Admin only)', 'rbac'),
  ('canCreateBids', 'Create bids', 'rbac'),
  ('canViewAllBids', 'View all bids', 'rbac'),
  ('canEditAllProjects', 'Edit all projects', 'rbac'),
  ('canManagePayments', 'Manage payments', 'rbac'),
  ('canViewReports', 'View reports', 'rbac'),
  ('canInviteContractors', 'Invite contractors', 'rbac'),
  ('canSchedule', 'Schedule appointments', 'rbac'),
  ('canPostJobs', 'Post jobs', 'rbac'),
  ('canManageApplications', 'Manage job applications', 'rbac'),
  -- Auth permissions
  ('auth.me', 'Get current user profile', 'auth'),
  ('auth.update_profile', 'Update own profile', 'auth'),
  -- Admin permissions
  ('admin.users.create', 'Create users (Admin only)', 'admin'),
  ('admin.users.list', 'List all users (Admin only)', 'admin'),
  ('admin.users.change_role', 'Change user role (Admin only)', 'admin'),
  ('admin.users.view', 'View user details (Admin only)', 'admin'),
  ('admin.user.suspend', 'Suspend user (Admin only)', 'admin'),
  ('admin.user.unsuspend', 'Unsuspend user (Admin only)', 'admin'),
  -- Notification permissions
  ('notifications.create', 'Create notifications', 'notifications'),
  -- Contractor permissions
  ('contractor.update', 'Update contractor profile', 'contractors'),
  ('contractor.verify', 'Verify contractor (Admin only)', 'contractors'),
  -- Project permissions
  ('projects.create', 'Create projects', 'projects'),
  ('projects.update', 'Update projects', 'projects'),
  -- Job permissions
  ('jobs.create', 'Create jobs', 'jobs'),
  -- Milestone permissions
  ('milestones.create', 'Create milestones', 'milestones'),
  -- Bid permissions
  ('bids.create', 'Create bids', 'bids'),
  -- Review permissions
  ('reviews.create', 'Create reviews', 'reviews'),
  -- Dispute permissions
  ('disputes.create', 'Create disputes', 'disputes'),
  -- Progress update permissions
  ('progress_updates.create', 'Create progress updates', 'progress'),
  -- Admin permissions (additional)
  ('admin.change_role', 'Change user role (Admin only)', 'admin')
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  module = EXCLUDED.module;

-- =====================================================
-- Admin Roles (SUPER, ADMIN, FIN, SUPPORT, MOD) → All Admin permissions
-- =====================================================

-- SUPER → ALL permissions
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('SUPER', 'canManageUsers'),
  ('SUPER', 'canCreateBids'),
  ('SUPER', 'canViewAllBids'),
  ('SUPER', 'canEditAllProjects'),
  ('SUPER', 'canManagePayments'),
  ('SUPER', 'canViewReports'),
  ('SUPER', 'canInviteContractors'),
  ('SUPER', 'canSchedule'),
  ('SUPER', 'canPostJobs'),
  ('SUPER', 'canManageApplications'),
  ('SUPER', 'auth.me'),
  ('SUPER', 'auth.update_profile'),
  ('SUPER', 'admin.users.create'),
  ('SUPER', 'admin.users.list'),
  ('SUPER', 'admin.users.change_role'),
  ('SUPER', 'admin.users.view'),
  ('SUPER', 'admin.user.suspend'),
  ('SUPER', 'admin.user.unsuspend'),
  ('SUPER', 'notifications.create'),
  ('SUPER', 'contractor.update'),
  ('SUPER', 'contractor.verify'),
  ('SUPER', 'projects.create'),
  ('SUPER', 'jobs.create')
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- ADMIN → ALL permissions
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('ADMIN', 'canManageUsers'),
  ('ADMIN', 'canCreateBids'),
  ('ADMIN', 'canViewAllBids'),
  ('ADMIN', 'canEditAllProjects'),
  ('ADMIN', 'canManagePayments'),
  ('ADMIN', 'canViewReports'),
  ('ADMIN', 'canInviteContractors'),
  ('ADMIN', 'canSchedule'),
  ('ADMIN', 'canPostJobs'),
  ('ADMIN', 'canManageApplications'),
  ('ADMIN', 'auth.me'),
  ('ADMIN', 'auth.update_profile'),
  ('ADMIN', 'admin.users.create'),
  ('ADMIN', 'admin.users.list'),
  ('ADMIN', 'admin.users.change_role'),
  ('ADMIN', 'admin.users.view'),
  ('ADMIN', 'admin.user.suspend'),
  ('ADMIN', 'admin.user.unsuspend'),
  ('ADMIN', 'notifications.create'),
  ('ADMIN', 'contractor.update'),
  ('ADMIN', 'contractor.verify'),
  ('ADMIN', 'projects.create'),
  ('ADMIN', 'projects.update'),
  ('ADMIN', 'jobs.create'),
  ('ADMIN', 'milestones.create'),
  ('ADMIN', 'bids.create'),
  ('ADMIN', 'reviews.create'),
  ('ADMIN', 'disputes.create'),
  ('ADMIN', 'progress_updates.create'),
  ('ADMIN', 'admin.change_role')
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- FIN → ALL permissions
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('FIN', 'canManageUsers'),
  ('FIN', 'canCreateBids'),
  ('FIN', 'canViewAllBids'),
  ('FIN', 'canEditAllProjects'),
  ('FIN', 'canManagePayments'),
  ('FIN', 'canViewReports'),
  ('FIN', 'canInviteContractors'),
  ('FIN', 'canSchedule'),
  ('FIN', 'canPostJobs'),
  ('FIN', 'canManageApplications'),
  ('FIN', 'auth.me'),
  ('FIN', 'auth.update_profile'),
  ('FIN', 'admin.users.create'),
  ('FIN', 'admin.users.list'),
  ('FIN', 'admin.users.change_role'),
  ('FIN', 'admin.users.view'),
  ('FIN', 'admin.user.suspend'),
  ('FIN', 'admin.user.unsuspend'),
  ('FIN', 'notifications.create'),
  ('FIN', 'contractor.update'),
  ('FIN', 'contractor.verify'),
  ('FIN', 'projects.create'),
  ('FIN', 'projects.update'),
  ('FIN', 'jobs.create'),
  ('FIN', 'milestones.create'),
  ('FIN', 'bids.create'),
  ('FIN', 'reviews.create'),
  ('FIN', 'disputes.create'),
  ('FIN', 'progress_updates.create'),
  ('FIN', 'admin.change_role')
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- SUPPORT → ALL permissions
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('SUPPORT', 'canManageUsers'),
  ('SUPPORT', 'canCreateBids'),
  ('SUPPORT', 'canViewAllBids'),
  ('SUPPORT', 'canEditAllProjects'),
  ('SUPPORT', 'canManagePayments'),
  ('SUPPORT', 'canViewReports'),
  ('SUPPORT', 'canInviteContractors'),
  ('SUPPORT', 'canSchedule'),
  ('SUPPORT', 'canPostJobs'),
  ('SUPPORT', 'canManageApplications'),
  ('SUPPORT', 'auth.me'),
  ('SUPPORT', 'auth.update_profile'),
  ('SUPPORT', 'admin.users.create'),
  ('SUPPORT', 'admin.users.list'),
  ('SUPPORT', 'admin.users.change_role'),
  ('SUPPORT', 'admin.users.view'),
  ('SUPPORT', 'admin.user.suspend'),
  ('SUPPORT', 'admin.user.unsuspend'),
  ('SUPPORT', 'notifications.create'),
  ('SUPPORT', 'contractor.update'),
  ('SUPPORT', 'contractor.verify'),
  ('SUPPORT', 'projects.create'),
  ('SUPPORT', 'projects.update'),
  ('SUPPORT', 'jobs.create'),
  ('SUPPORT', 'milestones.create'),
  ('SUPPORT', 'bids.create'),
  ('SUPPORT', 'reviews.create'),
  ('SUPPORT', 'disputes.create'),
  ('SUPPORT', 'progress_updates.create'),
  ('SUPPORT', 'admin.change_role')
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- MOD → ALL permissions
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('MOD', 'canManageUsers'),
  ('MOD', 'canCreateBids'),
  ('MOD', 'canViewAllBids'),
  ('MOD', 'canEditAllProjects'),
  ('MOD', 'canManagePayments'),
  ('MOD', 'canViewReports'),
  ('MOD', 'canInviteContractors'),
  ('MOD', 'canSchedule'),
  ('MOD', 'canPostJobs'),
  ('MOD', 'canManageApplications'),
  ('MOD', 'auth.me'),
  ('MOD', 'auth.update_profile'),
  ('MOD', 'admin.users.create'),
  ('MOD', 'admin.users.list'),
  ('MOD', 'admin.users.change_role'),
  ('MOD', 'admin.users.view'),
  ('MOD', 'admin.user.suspend'),
  ('MOD', 'admin.user.unsuspend'),
  ('MOD', 'notifications.create'),
  ('MOD', 'contractor.update'),
  ('MOD', 'contractor.verify'),
  ('MOD', 'projects.create'),
  ('MOD', 'projects.update'),
  ('MOD', 'jobs.create'),
  ('MOD', 'milestones.create'),
  ('MOD', 'bids.create'),
  ('MOD', 'reviews.create'),
  ('MOD', 'disputes.create'),
  ('MOD', 'progress_updates.create'),
  ('MOD', 'admin.change_role')
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- =====================================================
-- App Roles - Exact match to permission matrix
-- =====================================================

-- GC permissions
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('GC', 'canCreateBids'),
  ('GC', 'canViewAllBids'),
  ('GC', 'canEditAllProjects'),
  ('GC', 'canManagePayments'),
  ('GC', 'canViewReports'),
  ('GC', 'canInviteContractors'),
  ('GC', 'canSchedule'),
  ('GC', 'auth.me'),
  ('GC', 'auth.update_profile'),
  ('GC', 'notifications.create'),
  ('GC', 'contractor.update'),
  ('GC', 'projects.create'),
  ('GC', 'projects.update'),
  ('GC', 'jobs.create'),
  ('GC', 'milestones.create'),
  ('GC', 'bids.create'),
  ('GC', 'reviews.create'),
  ('GC', 'disputes.create'),
  ('GC', 'progress_updates.create')
  -- canManageUsers: false
  -- canPostJobs: false
  -- canManageApplications: false
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- PM (Project Manager) permissions
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('PM', 'canCreateBids'),
  ('PM', 'canViewAllBids'),
  ('PM', 'canViewReports'),
  ('PM', 'canInviteContractors'),
  ('PM', 'canSchedule'),
  ('PM', 'canPostJobs'),
  ('PM', 'canManageApplications'),
  ('PM', 'auth.me'),
  ('PM', 'auth.update_profile'),
  ('PM', 'notifications.create'),
  ('PM', 'contractor.update'),
  ('PM', 'projects.create'),
  ('PM', 'jobs.create'),
  ('PM', 'milestones.create'),
  ('PM', 'bids.create'),
  ('PM', 'reviews.create'),
  ('PM', 'disputes.create'),
  ('PM', 'progress_updates.create')
  -- canManageUsers: false
  -- canEditAllProjects: false
  -- canManagePayments: false
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- SUB (Subcontractor) permissions - ALL FALSE
-- No permissions inserted (all false per matrix)

-- TS (Trade Specialist) permissions - ALL FALSE
-- No permissions inserted (all false per matrix)

-- SUB (Subcontractor) permissions - Basic auth + can submit bids and apply to jobs
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('SUB', 'auth.me'),
  ('SUB', 'auth.update_profile'),
  ('SUB', 'contractor.update'),
  ('SUB', 'bids.create'), -- Can submit bid submissions
  ('SUB', 'reviews.create'),
  ('SUB', 'disputes.create'),
  ('SUB', 'progress_updates.create')
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- TS (Trade Specialist) permissions - Basic auth + can submit bids
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('TS', 'auth.me'),
  ('TS', 'auth.update_profile'),
  ('TS', 'contractor.update'),
  ('TS', 'bids.create'), -- Can submit bid submissions
  ('TS', 'reviews.create'),
  ('TS', 'disputes.create'),
  ('TS', 'progress_updates.create')
ON CONFLICT (role_code, permission_code) DO NOTHING;

-- VIEWER permissions - Only canViewReports + basic auth
INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('VIEWER', 'canViewReports'),
  ('VIEWER', 'auth.me'),
  ('VIEWER', 'auth.update_profile')
  -- All other permissions false
ON CONFLICT (role_code, permission_code) DO NOTHING;

