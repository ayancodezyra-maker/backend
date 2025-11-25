-- =====================================================
-- Missing RLS Policies for 15 Tables
-- =====================================================

-- =====================================================
-- JOBS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "All users can view open jobs" ON jobs;
DROP POLICY IF EXISTS "PMs can create jobs" ON jobs;
DROP POLICY IF EXISTS "PMs can update their jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can manage all jobs" ON jobs;

CREATE POLICY "All users can view open jobs" ON jobs
  FOR SELECT
  USING (
    status = 'open' 
    OR project_manager_id = auth.uid()
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "PMs can create jobs" ON jobs
  FOR INSERT
  WITH CHECK (
    project_manager_id = auth.uid()
    AND has_permission(auth.uid(), 'canPostJobs')
  );

CREATE POLICY "PMs can update their jobs" ON jobs
  FOR UPDATE
  USING (
    project_manager_id = auth.uid() 
    OR has_permission(auth.uid(), 'canEditAllProjects')
  )
  WITH CHECK (
    project_manager_id = auth.uid() 
    OR has_permission(auth.uid(), 'canEditAllProjects')
  );

CREATE POLICY "Admins can manage all jobs" ON jobs
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- MILESTONES RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view milestones for their projects" ON milestones;
DROP POLICY IF EXISTS "Users can manage milestones for their projects" ON milestones;

CREATE POLICY "Users can view milestones for their projects" ON milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Users can manage milestones for their projects" ON milestones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
  );

-- =====================================================
-- ASSIGNMENTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view assignments for their projects" ON assignments;
DROP POLICY IF EXISTS "Users can manage assignments for their projects" ON assignments;

CREATE POLICY "Users can view assignments for their projects" ON assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = assignments.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR assignments.assigned_to = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Users can manage assignments for their projects" ON assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = assignments.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR assignments.assigned_to = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = assignments.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR assignments.assigned_to = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
  );

-- =====================================================
-- CONTRACTOR_PROFILES RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "All users can view contractor profiles" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors can update own profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON contractor_profiles;

CREATE POLICY "All users can view contractor profiles" ON contractor_profiles
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Contractors can update own profile" ON contractor_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON contractor_profiles
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- CONTRACTORS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "All users can view contractors" ON contractors;
DROP POLICY IF EXISTS "Contractors can update own record" ON contractors;
DROP POLICY IF EXISTS "Admins can manage all contractors" ON contractors;

CREATE POLICY "All users can view contractors" ON contractors
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Contractors can update own record" ON contractors
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all contractors" ON contractors
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- PAYOUTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON payouts;

CREATE POLICY "Users can view their own payouts" ON payouts
  FOR SELECT
  USING (
    contractor_id = auth.uid()
    OR has_permission(auth.uid(), 'canManagePayments')
  );

CREATE POLICY "Admins can manage all payouts" ON payouts
  FOR ALL
  USING (has_permission(auth.uid(), 'canManagePayments'))
  WITH CHECK (has_permission(auth.uid(), 'canManagePayments'));

-- =====================================================
-- REVIEWS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "All users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their projects" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

CREATE POLICY "All users can view reviews" ON reviews
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create reviews for their projects" ON reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = reviews.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- =====================================================
-- REVIEW_REPORTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own reports" ON review_reports;
DROP POLICY IF EXISTS "Users can create reports" ON review_reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON review_reports;

CREATE POLICY "Users can view their own reports" ON review_reports
  FOR SELECT
  USING (
    reported_by = auth.uid()
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

CREATE POLICY "Users can create reports" ON review_reports
  FOR INSERT
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admins can manage all reports" ON review_reports
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- PROGRESS_UPDATES RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Project participants can view progress updates" ON progress_updates;
DROP POLICY IF EXISTS "Contractors can create their own updates" ON progress_updates;
DROP POLICY IF EXISTS "Project participants can update their own updates" ON progress_updates;

CREATE POLICY "Project participants can view progress updates" ON progress_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = progress_updates.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Contractors can create their own updates" ON progress_updates
  FOR INSERT
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Project participants can update their own updates" ON progress_updates
  FOR UPDATE
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- =====================================================
-- ESCROW_ACCOUNTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Project participants can view escrow" ON escrow_accounts;
DROP POLICY IF EXISTS "Admins can manage all escrow accounts" ON escrow_accounts;

CREATE POLICY "Project participants can view escrow" ON escrow_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = escrow_accounts.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canManagePayments')
  );

CREATE POLICY "Admins can manage all escrow accounts" ON escrow_accounts
  FOR ALL
  USING (has_permission(auth.uid(), 'canManagePayments'))
  WITH CHECK (has_permission(auth.uid(), 'canManagePayments'));

-- =====================================================
-- CONVERSATION_PARTICIPANTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their conversation participants" ON conversation_participants;

CREATE POLICY "Users can view their conversation participants" ON conversation_participants
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their conversation participants" ON conversation_participants
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SUPPORT_TICKETS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Support staff can manage tickets" ON support_tickets;

CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR has_permission(auth.uid(), 'support.tickets.manage')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Support staff can manage tickets" ON support_tickets
  FOR ALL
  USING (
    has_permission(auth.uid(), 'support.tickets.manage')
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    has_permission(auth.uid(), 'support.tickets.manage')
    OR assigned_to = auth.uid()
  );

-- =====================================================
-- DOCUMENTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Project participants can view documents" ON documents;
DROP POLICY IF EXISTS "Project participants can upload documents" ON documents;
DROP POLICY IF EXISTS "Project participants can delete their own documents" ON documents;

CREATE POLICY "Project participants can view documents" ON documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = documents.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Project participants can upload documents" ON documents
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = documents.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "Project participants can delete their own documents" ON documents
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- =====================================================
-- ANNOUNCEMENTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "All authenticated users can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;

CREATE POLICY "All authenticated users can view active announcements" ON announcements
  FOR SELECT
  USING (
    is_active = TRUE
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- PERMISSIONS & ROLE_PERMISSIONS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;

CREATE POLICY "Admins can view permissions" ON permissions
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "Admins can manage permissions" ON permissions
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "Admins can view role permissions" ON role_permissions
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "Admins can manage role permissions" ON role_permissions
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

