-- Fixed and consolidated schema for Supabase
-- Source: user's uploaded schema. Cleaned: typed arrays, deleted_at columns, pgcrypto extension, ordering fixed.
-- File saved: /mnt/data/complete_fixed_schema.sql
-- NOTE: Run in Supabase Primary DB. Some auth/storage/realtime objects are left as-is (Supabase provides them).

/* Extensions */
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- provides gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SET SESSION characteristics AS TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- =========================
-- Core: ROLES / PERMISSIONS
-- =========================
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  type text CHECK (type IN ('app','admin')) DEFAULT 'app',
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  module text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code text NOT NULL,
  permission_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (role_code, permission_code),
  CONSTRAINT fk_permission FOREIGN KEY (permission_code) REFERENCES public.permissions(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_code ON public.role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_code ON public.role_permissions(permission_code);

-- =========================
-- Profiles (depends on auth.users existing in Supabase)
-- =========================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY, -- typically references auth.users(id)
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role_id uuid,
  role_code text CHECK (role_code IN ('PM','GC','SUB','TS','VIEWER','SUPER','ADMIN','MOD','SUPPORT','FIN')),
  email_verified boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active','suspended','deleted','locked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  deleted_at timestamptz,
  account_type text DEFAULT 'APP_USER' CHECK (account_type IN ('APP_USER','ADMIN_USER')),
  CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_code ON public.profiles(role_code);

-- =========================
-- Projects
-- =========================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  budget numeric,
  owner_id uuid,
  contractor_id uuid,
  created_by uuid,
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id),
  CONSTRAINT projects_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.profiles(id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON public.projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at) WHERE deleted_at IS NULL;

-- =========================
-- Jobs
-- =========================
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  description text NOT NULL,
  location varchar(255) NOT NULL,
  trade_type varchar(100) NOT NULL,
  specialization varchar(255),
  status varchar(50) DEFAULT 'open',
  urgency varchar(50) DEFAULT 'normal',
  budget_min numeric,
  budget_max numeric,
  pay_type varchar(100),
  pay_rate numeric,
  start_date date,
  end_date date,
  requirements jsonb DEFAULT '[]'::jsonb,
  images text[] DEFAULT '{}'::text[],
  documents text[] DEFAULT '{}'::text[],
  project_manager_id uuid NOT NULL,
  created_by uuid NOT NULL,
  application_count integer DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT jobs_project_manager_id_fkey FOREIGN KEY (project_manager_id) REFERENCES public.profiles(id),
  CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_trade_type ON public.jobs(trade_type);
CREATE INDEX IF NOT EXISTS idx_jobs_project_manager ON public.jobs(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON public.jobs(deleted_at) WHERE deleted_at IS NULL;

-- =========================
-- Job Applications
-- =========================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  status varchar(50) DEFAULT 'pending',
  cover_letter text,
  proposed_rate numeric,
  available_start_date date,
  attachments text[] DEFAULT '{}'::text[],
  owner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_applications_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_contractor_id ON public.job_applications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- =========================
-- Bids & Submissions
-- =========================
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  submitted_by uuid,
  amount numeric,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT bids_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT bids_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_bids_project_id ON public.bids(project_id);
CREATE INDEX IF NOT EXISTS idx_bids_submitted_by ON public.bids(submitted_by);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_deleted_at ON public.bids(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.bid_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  amount numeric NOT NULL,
  timeline_days integer,
  proposal text,
  documents text[] DEFAULT '{}'::text[],
  status varchar(50) DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT bid_submissions_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id),
  CONSTRAINT bid_submissions_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_bid_submissions_bid_id ON public.bid_submissions(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_contractor_id ON public.bid_submissions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_bid_submissions_status ON public.bid_submissions(status);

-- =========================
-- Project Milestones, Milestones
-- =========================
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  due_date date NOT NULL,
  payment_amount numeric NOT NULL,
  deliverables text[] DEFAULT '{}'::text[],
  acceptance_criteria text[] DEFAULT '{}'::text[],
  status varchar(50) DEFAULT 'not_started',
  order_number integer NOT NULL,
  depends_on uuid,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  rejection_reason text,
  revision_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT project_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_milestones_depends_on_fkey FOREIGN KEY (depends_on) REFERENCES public.project_milestones(id),
  CONSTRAINT project_milestones_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON public.project_milestones(status);

CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text,
  amount numeric,
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','approved')),
  proof_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);

-- =========================
-- Payments, Payouts, Transactions, Escrow
-- =========================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  milestone_id uuid,
  payment_type varchar(50),
  amount numeric,
  status text DEFAULT 'escrow' CHECK (status IN ('escrow','released','refunded')),
  payment_method varchar(50),
  transaction_id varchar(255),
  paid_by uuid,
  paid_to uuid,
  escrow_held boolean DEFAULT false,
  released_at timestamptz,
  invoice_url text,
  receipt_url text,
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT payments_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id),
  CONSTRAINT payments_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.profiles(id),
  CONSTRAINT payments_paid_to_fkey FOREIGN KEY (paid_to) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_milestone_id ON public.payments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_by ON public.payments(paid_by);
CREATE INDEX IF NOT EXISTS idx_payments_paid_to ON public.payments(paid_to);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON public.payments(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid,
  contractor_id uuid NOT NULL,
  project_id uuid,
  amount numeric NOT NULL,
  status varchar(50) DEFAULT 'pending',
  stripe_account_id text,
  processor_payout_id text,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT payouts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
  CONSTRAINT payouts_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.profiles(id),
  CONSTRAINT payouts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE IF NOT EXISTS public.escrow_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE,
  balance numeric DEFAULT 0,
  funded_amount numeric DEFAULT 0,
  released_amount numeric DEFAULT 0,
  status varchar(50) DEFAULT 'pending',
  funded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT escrow_accounts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  milestone_id uuid,
  payer_id uuid,
  payee_id uuid,
  type varchar(50) NOT NULL,
  status varchar(50) DEFAULT 'pending',
  amount numeric NOT NULL,
  platform_fee numeric DEFAULT 0,
  processor_fee numeric DEFAULT 0,
  payment_processor text,
  processor_payment_id text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT transactions_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id),
  CONSTRAINT transactions_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.profiles(id),
  CONSTRAINT transactions_payee_id_fkey FOREIGN KEY (payee_id) REFERENCES public.profiles(id)
);

-- =========================
-- Contractors / Contractor Profiles
-- =========================
CREATE TABLE IF NOT EXISTS public.contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  trade_type varchar(100),
  location varchar(255),
  availability_status varchar(50) DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contractors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.contractor_profiles (
  user_id uuid PRIMARY KEY,
  company_name varchar(255),
  bio text,
  license_number varchar(100),
  insurance_amount numeric,
  years_in_business integer,
  specialties text[] DEFAULT '{}'::text[],
  portfolio jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  ratings_average numeric DEFAULT 0,
  ratings_count integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contractor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- =========================
-- Reviews & Reports
-- =========================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  photos text[] DEFAULT '{}'::text[],
  is_verified boolean DEFAULT true,
  reported boolean DEFAULT false,
  hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT reviews_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status varchar(50) DEFAULT 'pending',
  moderator_id uuid,
  moderator_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT review_reports_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id),
  CONSTRAINT review_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id),
  CONSTRAINT review_reports_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.profiles(id)
);

-- =========================
-- Conversations / Messages / Participants
-- =========================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text,
  created_by uuid NOT NULL,
  project_id uuid,
  job_id uuid,
  bid_id uuid,
  owner_id uuid,
  contractor_id uuid,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT conversations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT conversations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT conversations_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id)
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- =========================
-- Notifications, Support Tickets, etc.
-- =========================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type varchar(100),
  title varchar(255),
  message text,
  priority varchar(20) DEFAULT 'normal',
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number varchar(50) UNIQUE NOT NULL,
  user_id uuid,
  assigned_to uuid,
  subject varchar(255) NOT NULL,
  description text NOT NULL,
  category varchar(50) NOT NULL,
  priority varchar(20) DEFAULT 'normal',
  status varchar(50) DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  sender_id uuid,
  message text NOT NULL,
  attachments text[] DEFAULT '{}'::text[],
  internal_only boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT support_ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id),
  CONSTRAINT support_ticket_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);

-- =========================
-- Misc: admin logs, ddos, device tokens, change orders, documents
-- =========================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action varchar(255) NOT NULL,
  resource_type varchar(255),
  resource_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT admin_activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.ddos_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  endpoint text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  milestone_id uuid,
  requested_by uuid NOT NULL,
  requested_to uuid NOT NULL,
  title varchar(255) NOT NULL,
  description text NOT NULL,
  cost_impact numeric DEFAULT 0,
  timeline_impact_days integer DEFAULT 0,
  documents text[] DEFAULT '{}'::text[],
  status varchar(50) DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT change_orders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT change_orders_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id),
  CONSTRAINT change_orders_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id),
  CONSTRAINT change_orders_requested_to_fkey FOREIGN KEY (requested_to) REFERENCES public.profiles(id),
  CONSTRAINT change_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  milestone_id uuid,
  uploaded_by uuid,
  document_type varchar(100),
  title varchar(255),
  file_url text,
  file_size bigint,
  mime_type varchar(100),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT documents_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id),
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);

-- =========================
-- Other utility tables (email campaigns, moderation, etc.)
-- =========================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  subject varchar(255) NOT NULL,
  content text NOT NULL,
  target_segment jsonb,
  status varchar(50) DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT email_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type varchar(100) NOT NULL,
  content_id uuid NOT NULL,
  reported_by uuid,
  report_reason varchar(255) NOT NULL,
  report_details text,
  status varchar(50) DEFAULT 'pending',
  priority varchar(50) DEFAULT 'normal',
  assigned_to uuid,
  moderator_notes text,
  action_taken varchar(100),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT moderation_queue_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id),
  CONSTRAINT moderation_queue_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
);

-- =========================
-- Storage / Auth / Realtime / Vault sections are left as-is (Supabase-managed objects)
-- If you want them recreated, run the original supabase system SQL. We do not modify Supabase-managed schemas here.
-- =========================

-- END OF SCHEMA
