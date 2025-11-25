-- =====================================================
-- Complete Database Schema - Matching Actual Supabase Database
-- With Foreign Keys, Indexes, Soft Delete, and Audit Trail
-- Production-Ready Schema for BidRoom Platform
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ADMIN_ACTIVITY_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_resource ON public.admin_activity_logs(resource_type, resource_id);

-- =====================================================
-- 2. AI_GENERATED_CONTRACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_generated_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
  owner_notes TEXT,
  generated_contract JSONB NOT NULL,
  california_law_provisions JSONB NOT NULL,
  generation_time_ms INTEGER,
  ai_model_version TEXT,
  owner_edits JSONB,
  contractor_edits JSONB,
  final_contract JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_contracts_project_id ON public.ai_generated_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_contracts_bid_id ON public.ai_generated_contracts(bid_id);

-- =====================================================
-- 3. AI_PROGRESS_ANALYSIS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_progress_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  progress_update_id UUID REFERENCES public.progress_updates(id) ON DELETE SET NULL,
  analysis_result JSONB NOT NULL,
  work_quality VARCHAR,
  completion_percentage INTEGER,
  issues_detected JSONB,
  recommendations TEXT[],
  compliance_check JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_progress_analysis_milestone_id ON public.ai_progress_analysis(milestone_id);
CREATE INDEX IF NOT EXISTS idx_ai_progress_analysis_progress_update_id ON public.ai_progress_analysis(progress_update_id);

-- =====================================================
-- 4. ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  target_audience VARCHAR(50),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

-- =====================================================
-- 5. ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  role TEXT CHECK (role = ANY (ARRAY['GC'::text, 'SUB'::text])),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON public.assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON public.assignments(assigned_to);

-- =====================================================
-- 6. BID_SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bid_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  timeline_days INTEGER,
  proposal TEXT,
  documents TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bid_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_bid_submissions_bid_id ON public.bid_submissions(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_contractor_id ON public.bid_submissions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_status ON public.bid_submissions(status);

-- =====================================================
-- 7. BIDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_project_id ON public.bids(project_id);
CREATE INDEX IF NOT EXISTS idx_bids_submitted_by ON public.bids(submitted_by);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);

-- =====================================================
-- 8. BLOCKED_IPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  ip TEXT PRIMARY KEY,
  reason TEXT,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_until ON public.blocked_ips(blocked_until);

-- =====================================================
-- 9. CHANGE_ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  requested_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  cost_impact NUMERIC(12, 2) DEFAULT 0,
  timeline_impact_days INTEGER DEFAULT 0,
  documents TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON public.change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_milestone_id ON public.change_orders(milestone_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_requested_by ON public.change_orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON public.change_orders(status);

-- =====================================================
-- 10. CONTRACTOR_PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contractor_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  mission_statement TEXT,
  service_area TEXT,
  service_area_geo JSONB,
  license_number TEXT,
  license_type TEXT,
  license_state TEXT,
  license_expires_at DATE,
  license_verified BOOLEAN DEFAULT false,
  insurance_company TEXT,
  insurance_policy_number TEXT,
  insurance_coverage_amount NUMERIC(12, 2),
  insurance_expires_at DATE,
  insurance_verified BOOLEAN DEFAULT false,
  bonding_info TEXT,
  certifications JSONB DEFAULT '[]',
  affiliations JSONB DEFAULT '[]',
  years_in_business INTEGER,
  team_size INTEGER,
  avg_rating NUMERIC(3, 2),
  review_count INTEGER DEFAULT 0,
  response_rate NUMERIC(5, 2),
  typical_response_time_minutes INTEGER,
  completion_rate NUMERIC(5, 2),
  on_time_completion_rate NUMERIC(5, 2),
  repeat_customer_rate NUMERIC(5, 2),
  portfolio_projects JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractor_profiles_user_id ON public.contractor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_license_verified ON public.contractor_profiles(license_verified);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_avg_rating ON public.contractor_profiles(avg_rating DESC);

-- =====================================================
-- 11. CONVERSATION_PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);

-- =====================================================
-- 12. CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON public.conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job_id ON public.conversations(job_id);
CREATE INDEX IF NOT EXISTS idx_conversations_bid_id ON public.conversations(bid_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);

-- =====================================================
-- 13. DDOS_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ddos_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ddos_logs_ip ON public.ddos_logs(ip);
CREATE INDEX IF NOT EXISTS idx_ddos_logs_created_at ON public.ddos_logs(created_at DESC);

-- =====================================================
-- 14. DEVICE_TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON public.device_tokens(token);

-- =====================================================
-- 15. DISPUTE_MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON public.dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sender_id ON public.dispute_messages(sender_id);

-- =====================================================
-- 16. DISPUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  raised_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT DEFAULT 'open' CHECK (status = ANY (ARRAY['open'::text, 'review'::text, 'resolved'::text])),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_project_id ON public.disputes(project_id);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON public.disputes(raised_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

-- =====================================================
-- 17. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  url TEXT,
  type TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);

-- =====================================================
-- 18. EMAIL_CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_segment JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipients_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON public.email_campaigns(created_by);

-- =====================================================
-- 19. EMAIL_VERIFICATION_TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

-- =====================================================
-- 20. ESCROW_ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  total_amount NUMERIC(12, 2) NOT NULL,
  funded_amount NUMERIC(12, 2) DEFAULT 0,
  remaining_balance NUMERIC(12, 2) DEFAULT 0,
  balance NUMERIC(12, 2) DEFAULT 0,
  released_amount NUMERIC(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'open',
  funded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_accounts_project_id ON public.escrow_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_status ON public.escrow_accounts(status);

-- =====================================================
-- 21. FAILED_LOGINS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.failed_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON public.failed_logins(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_locked_until ON public.failed_logins(locked_until);

-- =====================================================
-- 22. JOB_APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status VARCHAR(50) DEFAULT 'pending',
  cover_letter TEXT,
  proposed_rate NUMERIC(10, 2),
  available_start_date DATE,
  availability_start DATE,
  attachments TEXT[] DEFAULT '{}',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, contractor_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_contractor_id ON public.job_applications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- =====================================================
-- 23. JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  trade_type VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open',
  urgency VARCHAR(50) DEFAULT 'normal',
  budget_min NUMERIC(12, 2),
  budget_max NUMERIC(12, 2),
  pay_type VARCHAR(50),
  pay_rate NUMERIC(10, 2),
  start_date DATE,
  end_date DATE,
  requirements JSONB DEFAULT '[]',
  images TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  project_manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_trade_type ON public.jobs(trade_type);
CREATE INDEX IF NOT EXISTS idx_jobs_project_manager_id ON public.jobs(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);

-- =====================================================
-- 24. LOGIN_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_attempted TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_email_attempted ON public.login_logs(email_attempted);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON public.login_logs(created_at DESC);

-- =====================================================
-- 25. MESSAGES TABLE (with all columns from actual schema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message TEXT,
  content TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  is_read BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(receiver_id, read);

-- =====================================================
-- 26. MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT,
  amount NUMERIC(12, 2),
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'approved'::text])),
  proof_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);

-- =====================================================
-- 27. MODERATION_QUEUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR NOT NULL,
  content_id UUID NOT NULL,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  report_reason VARCHAR NOT NULL,
  report_details TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  action_taken VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_content ON public.moderation_queue(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned_to ON public.moderation_queue(assigned_to);

-- =====================================================
-- 28. NOTIFICATIONS TABLE (matching actual schema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT,
  body TEXT,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- =====================================================
-- 29. PASSWORD_RESET_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.password_reset_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_logs_email ON public.password_reset_logs(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_logs_created_at ON public.password_reset_logs(created_at DESC);

-- =====================================================
-- 30. PASSWORD_RESET_TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- =====================================================
-- 31. PAYMENTS TABLE (matching actual schema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  released_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  released_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2),
  status TEXT DEFAULT 'escrow' CHECK (status = ANY (ARRAY['escrow'::text, 'released'::text, 'refunded'::text])),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_milestone_id ON public.payments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_payments_released_by ON public.payments(released_by);
CREATE INDEX IF NOT EXISTS idx_payments_released_to ON public.payments(released_to);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- =====================================================
-- 32. PAYOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  stripe_account_id TEXT,
  processor_payout_id TEXT,
  payout_method VARCHAR(50),
  account_details JSONB,
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_contractor_id ON public.payouts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payouts_project_id ON public.payouts(project_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_payment_id ON public.payouts(payment_id);

-- =====================================================
-- 33. PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);

-- =====================================================
-- 34. PROFILES TABLE (matching actual schema)
-- =====================================================
-- Note: profiles table structure from actual database
-- This table already exists in Supabase auth, we're just ensuring structure matches
-- We don't CREATE this table as it's managed by Supabase Auth

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add columns that might be missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE public.profiles ADD COLUMN first_name VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE public.profiles ADD COLUMN last_name VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
    ALTER TABLE public.profiles ADD COLUMN company_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE public.profiles ADD COLUMN location VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trust_score') THEN
    ALTER TABLE public.profiles ADD COLUMN trust_score INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_code ON public.profiles(role_code);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- =====================================================
-- 35. PROGRESS_UPDATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  update_type VARCHAR(50) DEFAULT 'daily',
  work_completed TEXT,
  work_planned TEXT,
  issues TEXT,
  hours_worked NUMERIC(5, 2),
  crew_members INTEGER,
  photos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  gps_location JSONB,
  weather_conditions VARCHAR(100),
  ai_analyzed BOOLEAN DEFAULT false,
  ai_analysis_id UUID REFERENCES public.ai_progress_analysis(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_updates_project_id ON public.progress_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_milestone_id ON public.progress_updates(milestone_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_contractor_id ON public.progress_updates(contractor_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_created_at ON public.progress_updates(created_at DESC);

-- =====================================================
-- 36. PROJECT_MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  payment_amount NUMERIC(12, 2) NOT NULL,
  deliverables TEXT[] DEFAULT '{}',
  acceptance_criteria TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'not_started',
  order_number INTEGER NOT NULL,
  depends_on UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  revision_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON public.project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_depends_on ON public.project_milestones(depends_on);
CREATE INDEX IF NOT EXISTS idx_project_milestones_order ON public.project_milestones(project_id, order_number);

-- =====================================================
-- 37. PROJECTS TABLE (matching actual schema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  budget NUMERIC(12, 2),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON public.projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- =====================================================
-- 38. REVIEW_REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  details TEXT,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON public.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reported_by ON public.review_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON public.review_reports(status);

-- =====================================================
-- 39. REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rating_overall INTEGER CHECK (rating_overall >= 1 AND rating_overall <= 5),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_quality INTEGER,
  rating_communication INTEGER,
  rating_timeline INTEGER,
  rating_professionalism INTEGER,
  rating_value INTEGER,
  title VARCHAR(255),
  body TEXT,
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT true,
  reported BOOLEAN DEFAULT false,
  hidden BOOLEAN DEFAULT false,
  project_type VARCHAR(100),
  helpful_count INTEGER DEFAULT 0,
  response TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id, reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON public.reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating_overall);

-- =====================================================
-- 40. ROLE_PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (role_code, permission_code),
  CONSTRAINT fk_permission FOREIGN KEY (permission_code) REFERENCES public.permissions(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_code ON public.role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_code ON public.role_permissions(permission_code);

-- =====================================================
-- 41. ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  type TEXT CHECK (type = ANY (ARRAY['app'::text, 'admin'::text])),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_role_code ON public.roles(role_code);

-- =====================================================
-- 42. SESSIONS TABLE (public schema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- =====================================================
-- 43. SUPPORT_TICKET_MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  internal_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_sender_id ON public.support_ticket_messages(sender_id);

-- =====================================================
-- 44. SUPPORT_TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'open',
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);

-- =====================================================
-- 45. SYSTEM_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key VARCHAR PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 46. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  payer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  payee_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  type VARCHAR NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  amount NUMERIC(12, 2) NOT NULL,
  platform_fee NUMERIC(12, 2) DEFAULT 0,
  processor_fee NUMERIC(12, 2) DEFAULT 0,
  payment_processor TEXT,
  processor_payment_id TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_milestone_id ON public.transactions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON public.transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee_id ON public.transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- =====================================================
-- Enable Row Level Security on all tables
-- =====================================================
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_progress_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
