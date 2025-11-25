-- =====================================================
-- Complete RLS Policy Fixes - All Tables
-- =====================================================

-- =====================================================
-- JOBS RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "All users can view open jobs" ON jobs;
DROP POLICY IF EXISTS "PMs can create jobs" ON jobs;
DROP POLICY IF EXISTS "PMs can update their jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can manage all jobs" ON jobs;

-- Allow all authenticated users to view open jobs
CREATE POLICY "All users can view open jobs" ON jobs
  FOR SELECT
  USING (
    status = 'open' 
    OR project_manager_id = auth.uid()
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- PMs and Admins can create jobs
CREATE POLICY "PMs can create jobs" ON jobs
  FOR INSERT
  WITH CHECK (
    (project_manager_id = auth.uid() AND has_permission(auth.uid(), 'canPostJobs'))
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- PMs and Admins can update jobs
CREATE POLICY "PMs can update their jobs" ON jobs
  FOR UPDATE
  USING (
    project_manager_id = auth.uid() 
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    project_manager_id = auth.uid() 
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- Admins can manage all jobs
CREATE POLICY "Admins can manage all jobs" ON jobs
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- MILESTONES RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "Users can view milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can update milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can create milestones for their projects" ON project_milestones;

CREATE POLICY "Users can view milestones for their projects" ON project_milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

CREATE POLICY "Users can create milestones for their projects" ON project_milestones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

CREATE POLICY "Users can update milestones for their projects" ON project_milestones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- =====================================================
-- BIDS RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "Users can view bids they created or have permission" ON bids;
DROP POLICY IF EXISTS "Users with canCreateBids can create bids" ON bids;
DROP POLICY IF EXISTS "Bid creators can update their bids" ON bids;

CREATE POLICY "Users can view bids they created or have permission" ON bids
  FOR SELECT
  USING (
    submitted_by = auth.uid() 
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- GC and Admins can create bids
CREATE POLICY "Users with canCreateBids can create bids" ON bids
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      has_permission(auth.uid(), 'canCreateBids')
      OR is_admin_role(get_user_role_code(auth.uid()))
    )
  );

CREATE POLICY "Bid creators can update their bids" ON bids
  FOR UPDATE
  USING (
    submitted_by = auth.uid() 
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    submitted_by = auth.uid() 
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- =====================================================
-- BID_SUBMISSIONS RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "Users can view their bid submissions" ON bid_submissions;
DROP POLICY IF EXISTS "Users with canCreateBids can create bid submissions" ON bid_submissions;
DROP POLICY IF EXISTS "Users can update their bid submissions" ON bid_submissions;

CREATE POLICY "Users can view their bid submissions" ON bid_submissions
  FOR SELECT
  USING (
    contractor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM bids b
      WHERE b.id = bid_submissions.bid_id
      AND b.submitted_by = auth.uid()
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- SUB can submit bids (contractor_id = auth.uid())
CREATE POLICY "Contractors can create bid submissions" ON bid_submissions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND contractor_id = auth.uid()
  );

CREATE POLICY "Users can update their bid submissions" ON bid_submissions
  FOR UPDATE
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- =====================================================
-- NOTIFICATIONS RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins and system can create notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins and system can create notifications
CREATE POLICY "Admins and system can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    is_admin_role(get_user_role_code(auth.uid()))
    OR has_permission(auth.uid(), 'notifications.create')
  );

-- =====================================================
-- PROGRESS_UPDATES RLS POLICIES - FIXED
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
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- Contractors can create progress updates
CREATE POLICY "Contractors can create their own updates" ON progress_updates
  FOR INSERT
  WITH CHECK (
    contractor_id = auth.uid()
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

CREATE POLICY "Project participants can update their own updates" ON progress_updates
  FOR UPDATE
  USING (
    contractor_id = auth.uid()
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    contractor_id = auth.uid()
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- =====================================================
-- REVIEWS RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Project participants can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT
  USING (true); -- Reviews are public

-- Project participants can create reviews
CREATE POLICY "Project participants can create reviews" ON reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = reviews.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
    )
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- =====================================================
-- DISPUTES RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "Project participants can view disputes" ON disputes;
DROP POLICY IF EXISTS "Project participants can create disputes" ON disputes;
DROP POLICY IF EXISTS "Admins can manage disputes" ON disputes;

CREATE POLICY "Project participants can view disputes" ON disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = disputes.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
    )
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- Project participants can create disputes
CREATE POLICY "Project participants can create disputes" ON disputes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = disputes.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
    )
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- Admins can manage disputes
CREATE POLICY "Admins can manage disputes" ON disputes
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- CONTRACTOR_PROFILES RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "Users can view contractor profiles" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors can update their own profiles" ON contractor_profiles;
DROP POLICY IF EXISTS "Admins can verify contractor profiles" ON contractor_profiles;

CREATE POLICY "Users can view contractor profiles" ON contractor_profiles
  FOR SELECT
  USING (true); -- Profiles are public

-- Contractors can update their own profiles
CREATE POLICY "Contractors can update their own profiles" ON contractor_profiles
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- Contractors can create their profiles
CREATE POLICY "Contractors can create their profiles" ON contractor_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can verify contractor profiles
CREATE POLICY "Admins can verify contractor profiles" ON contractor_profiles
  FOR UPDATE
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- PROJECTS RLS POLICIES - FIXED
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;

CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      has_permission(auth.uid(), 'projects.create')
      OR has_permission(auth.uid(), 'canCreateBids')
      OR is_admin_role(get_user_role_code(auth.uid()))
    )
  );


