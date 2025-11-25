-- =====================================================
-- Complete RLS Policies for All Tables
-- With Dynamic Permission Checking from role_permissions Table
-- =====================================================

-- =====================================================
-- Helper Functions
-- =====================================================

-- Helper function to get user role code
CREATE OR REPLACE FUNCTION get_user_role_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_code TEXT;
BEGIN
  SELECT p.role_code INTO role_code
  FROM profiles p
  WHERE p.id = user_id;
  
  RETURN COALESCE(role_code, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if role is admin
CREATE OR REPLACE FUNCTION is_admin_role(role_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN role_code IN ('SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to check permission (DYNAMIC - queries role_permissions table)
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_code TEXT;
  is_admin BOOLEAN;
  has_perm BOOLEAN;
BEGIN
  user_role_code := get_user_role_code(user_id);
  is_admin := is_admin_role(user_role_code);
  
  -- Admin roles have all permissions
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Query role_permissions table dynamically
  SELECT EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role_code = user_role_code
    AND permission_code = permission_name
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROJECTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view projects they own or are contractors on" ON projects;
DROP POLICY IF EXISTS "Users with canViewAllBids can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects they own or have edit permission" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Only admins or owners can delete projects" ON projects;

CREATE POLICY "Users can view projects they own or are contractors on" ON projects
  FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR contractor_id = auth.uid()
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Users can update projects they own or have edit permission" ON projects
  FOR UPDATE
  USING (
    owner_id = auth.uid() 
    OR contractor_id = auth.uid()
    OR has_permission(auth.uid(), 'canEditAllProjects')
  )
  WITH CHECK (
    owner_id = auth.uid() 
    OR contractor_id = auth.uid()
    OR has_permission(auth.uid(), 'canEditAllProjects')
  );

CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins or owners can delete projects" ON projects
  FOR DELETE
  USING (
    owner_id = auth.uid()
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- =====================================================
-- PROJECT_MILESTONES RLS POLICIES
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
  );

-- =====================================================
-- BIDS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view bids they created or have permission" ON bids;
DROP POLICY IF EXISTS "Users with canCreateBids can create bids" ON bids;
DROP POLICY IF EXISTS "Bid creators can update their bids" ON bids;

CREATE POLICY "Users can view bids they created or have permission" ON bids
  FOR SELECT
  USING (
    submitted_by = auth.uid() OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Users with canCreateBids can create bids" ON bids
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND has_permission(auth.uid(), 'canCreateBids')
  );

CREATE POLICY "Bid creators can update their bids" ON bids
  FOR UPDATE
  USING (
    submitted_by = auth.uid() OR has_permission(auth.uid(), 'canEditAllProjects')
  )
  WITH CHECK (
    submitted_by = auth.uid() OR has_permission(auth.uid(), 'canEditAllProjects')
  );

-- =====================================================
-- BID_SUBMISSIONS RLS POLICIES
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
  );

CREATE POLICY "Users with canCreateBids can create bid submissions" ON bid_submissions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND has_permission(auth.uid(), 'canCreateBids')
  );

CREATE POLICY "Users can update their bid submissions" ON bid_submissions
  FOR UPDATE
  USING (contractor_id = auth.uid());

-- =====================================================
-- JOB_APPLICATIONS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view applications they're involved in" ON job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update applications they're involved in" ON job_applications;

CREATE POLICY "Users can view applications they're involved in" ON job_applications
  FOR SELECT
  USING (
    contractor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_applications.job_id 
      AND j.project_manager_id = auth.uid()
    )
    OR has_permission(auth.uid(), 'canManageApplications')
  );

CREATE POLICY "Users can create applications" ON job_applications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update applications they're involved in" ON job_applications
  FOR UPDATE
  USING (
    contractor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_applications.job_id 
      AND j.project_manager_id = auth.uid()
    )
    OR has_permission(auth.uid(), 'canManageApplications')
  );

-- =====================================================
-- PAYMENTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view payments for their projects" ON payments;
DROP POLICY IF EXISTS "Users with canManagePayments can create payments" ON payments;
DROP POLICY IF EXISTS "Users with canManagePayments can update payments" ON payments;

CREATE POLICY "Users can view payments for their projects" ON payments
  FOR SELECT
  USING (
    has_permission(auth.uid(), 'canManagePayments')
    OR released_by = auth.uid()
    OR released_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM milestones m
      JOIN projects p ON p.id = m.project_id
      WHERE m.id = payments.milestone_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
    )
  );

CREATE POLICY "Users with canManagePayments can create payments" ON payments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND has_permission(auth.uid(), 'canManagePayments')
  );

CREATE POLICY "Users with canManagePayments can update payments" ON payments
  FOR UPDATE
  USING (has_permission(auth.uid(), 'canManagePayments'))
  WITH CHECK (has_permission(auth.uid(), 'canManagePayments'));

-- =====================================================
-- CONVERSATIONS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can manage all conversations" ON conversations;

CREATE POLICY "Users can view conversations they're part of" ON conversations
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR owner_id = auth.uid()
    OR contractor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can manage all conversations" ON conversations
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- MESSAGES RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.created_by = auth.uid() OR c.owner_id = auth.uid() OR c.contractor_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- =====================================================
-- NOTIFICATIONS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_role_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT) TO authenticated;

