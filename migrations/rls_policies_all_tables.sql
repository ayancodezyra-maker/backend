-- =====================================================
-- Complete RLS Policies for ALL Tables
-- Matching Actual Database Schema
-- =====================================================

-- =====================================================
-- ADMIN_ACTIVITY_LOGS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Admins can create activity logs" ON public.admin_activity_logs;

CREATE POLICY "Admins can view activity logs" ON public.admin_activity_logs
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "Admins can create activity logs" ON public.admin_activity_logs
  FOR INSERT
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- AI_GENERATED_CONTRACTS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Project participants can view contracts" ON public.ai_generated_contracts;
DROP POLICY IF EXISTS "Project participants can create contracts" ON public.ai_generated_contracts;

CREATE POLICY "Project participants can view contracts" ON public.ai_generated_contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = ai_generated_contracts.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Project participants can create contracts" ON public.ai_generated_contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = ai_generated_contracts.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
  );

-- =====================================================
-- AI_PROGRESS_ANALYSIS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Project participants can view AI analysis" ON public.ai_progress_analysis;
DROP POLICY IF EXISTS "Admins can manage AI analysis" ON public.ai_progress_analysis;

CREATE POLICY "Project participants can view AI analysis" ON public.ai_progress_analysis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_milestones pm
      JOIN public.projects p ON pm.project_id = p.id
      WHERE pm.id = ai_progress_analysis.milestone_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Admins can manage AI analysis" ON public.ai_progress_analysis
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- BLOCKED_IPS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view blocked IPs" ON public.blocked_ips;
DROP POLICY IF EXISTS "System can manage blocked IPs" ON public.blocked_ips;

CREATE POLICY "Admins can view blocked IPs" ON public.blocked_ips
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "System can manage blocked IPs" ON public.blocked_ips
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- CHANGE_ORDERS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Project participants can view change orders" ON public.change_orders;
DROP POLICY IF EXISTS "Project participants can create change orders" ON public.change_orders;
DROP POLICY IF EXISTS "Project participants can update change orders" ON public.change_orders;

CREATE POLICY "Project participants can view change orders" ON public.change_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = change_orders.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR change_orders.requested_by = auth.uid() OR change_orders.requested_to = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
  );

CREATE POLICY "Project participants can create change orders" ON public.change_orders
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = change_orders.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "Project participants can update change orders" ON public.change_orders
  FOR UPDATE
  USING (
    requested_to = auth.uid()
    OR approved_by = auth.uid()
    OR has_permission(auth.uid(), 'canEditAllProjects')
  )
  WITH CHECK (
    requested_to = auth.uid()
    OR approved_by = auth.uid()
    OR has_permission(auth.uid(), 'canEditAllProjects')
  );

-- =====================================================
-- DDOS_LOGS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view DDoS logs" ON public.ddos_logs;
DROP POLICY IF EXISTS "System can create DDoS logs" ON public.ddos_logs;

CREATE POLICY "Admins can view DDoS logs" ON public.ddos_logs
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "System can create DDoS logs" ON public.ddos_logs
  FOR INSERT
  WITH CHECK (TRUE); -- System can log

-- =====================================================
-- DEVICE_TOKENS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Admins can view all device tokens" ON public.device_tokens;

CREATE POLICY "Users can manage their own device tokens" ON public.device_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all device tokens" ON public.device_tokens
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- DISPUTE_MESSAGES RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Dispute participants can view messages" ON public.dispute_messages;
DROP POLICY IF EXISTS "Dispute participants can send messages" ON public.dispute_messages;

CREATE POLICY "Dispute participants can view messages" ON public.dispute_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_messages.dispute_id
      AND (d.raised_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = d.project_id
        AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      ))
    )
    OR has_permission(auth.uid(), 'canManageUsers')
  );

CREATE POLICY "Dispute participants can send messages" ON public.dispute_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.disputes d
      WHERE d.id = dispute_messages.dispute_id
      AND (d.raised_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = d.project_id
        AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      ))
    )
  );

-- =====================================================
-- EMAIL_CAMPAIGNS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage email campaigns" ON public.email_campaigns;

CREATE POLICY "Admins can manage email campaigns" ON public.email_campaigns
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- EMAIL_VERIFICATION_TOKENS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "System can manage verification tokens" ON public.email_verification_tokens;

CREATE POLICY "Users can view their own verification tokens" ON public.email_verification_tokens
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage verification tokens" ON public.email_verification_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- FAILED_LOGINS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view failed logins" ON public.failed_logins;
DROP POLICY IF EXISTS "System can manage failed logins" ON public.failed_logins;

CREATE POLICY "Admins can view failed logins" ON public.failed_logins
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "System can manage failed logins" ON public.failed_logins
  FOR ALL
  USING (TRUE); -- System can manage

-- =====================================================
-- LOGIN_LOGS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own login logs" ON public.login_logs;
DROP POLICY IF EXISTS "Admins can view all login logs" ON public.login_logs;
DROP POLICY IF EXISTS "System can create login logs" ON public.login_logs;

CREATE POLICY "Users can view their own login logs" ON public.login_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all login logs" ON public.login_logs
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "System can create login logs" ON public.login_logs
  FOR INSERT
  WITH CHECK (TRUE); -- System can log

-- =====================================================
-- MODERATION_QUEUE RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Reporters can view their reports" ON public.moderation_queue;
DROP POLICY IF EXISTS "Moderators can view all reports" ON public.moderation_queue;
DROP POLICY IF EXISTS "Users can create reports" ON public.moderation_queue;
DROP POLICY IF EXISTS "Moderators can manage reports" ON public.moderation_queue;

CREATE POLICY "Reporters can view their reports" ON public.moderation_queue
  FOR SELECT
  USING (reported_by = auth.uid());

CREATE POLICY "Moderators can view all reports" ON public.moderation_queue
  FOR SELECT
  USING (
    has_permission(auth.uid(), 'moderation.content')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Users can create reports" ON public.moderation_queue
  FOR INSERT
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Moderators can manage reports" ON public.moderation_queue
  FOR ALL
  USING (
    has_permission(auth.uid(), 'moderation.content')
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    has_permission(auth.uid(), 'moderation.content')
    OR assigned_to = auth.uid()
  );

-- =====================================================
-- PASSWORD_RESET_LOGS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view password reset logs" ON public.password_reset_logs;
DROP POLICY IF EXISTS "System can create password reset logs" ON public.password_reset_logs;

CREATE POLICY "Admins can view password reset logs" ON public.password_reset_logs
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "System can create password reset logs" ON public.password_reset_logs
  FOR INSERT
  WITH CHECK (TRUE); -- System can log

-- =====================================================
-- PASSWORD_RESET_TOKENS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "System can manage reset tokens" ON public.password_reset_tokens;

CREATE POLICY "Users can view their own reset tokens" ON public.password_reset_tokens
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage reset tokens" ON public.password_reset_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SESSIONS RLS POLICIES (public schema)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;

CREATE POLICY "Users can view their own sessions" ON public.sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions" ON public.sessions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.sessions
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- SUPPORT_TICKET_MESSAGES RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Ticket participants can view messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Ticket participants can send messages" ON public.support_ticket_messages;

CREATE POLICY "Ticket participants can view messages" ON public.support_ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = support_ticket_messages.ticket_id
      AND (st.user_id = auth.uid() OR st.assigned_to = auth.uid())
    )
    OR has_permission(auth.uid(), 'support.tickets.manage')
  );

CREATE POLICY "Ticket participants can send messages" ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = support_ticket_messages.ticket_id
      AND (st.user_id = auth.uid() OR st.assigned_to = auth.uid() OR has_permission(auth.uid(), 'support.tickets.manage'))
    )
  );

-- =====================================================
-- SYSTEM_SETTINGS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

CREATE POLICY "Admins can view system settings" ON public.system_settings
  FOR SELECT
  USING (is_admin_role(get_user_role_code(auth.uid())));

CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL
  USING (is_admin_role(get_user_role_code(auth.uid())))
  WITH CHECK (is_admin_role(get_user_role_code(auth.uid())));

-- =====================================================
-- TRANSACTIONS RLS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Transaction participants can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;

CREATE POLICY "Transaction participants can view transactions" ON public.transactions
  FOR SELECT
  USING (
    payer_id = auth.uid()
    OR payee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = transactions.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid())
      AND p.deleted_at IS NULL
    )
    OR has_permission(auth.uid(), 'canManagePayments')
  );

CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL
  USING (has_permission(auth.uid(), 'canManagePayments'))
  WITH CHECK (has_permission(auth.uid(), 'canManagePayments'));

