-- =====================================================
-- Fix Notifications Table - Add Optional Columns
-- =====================================================

-- Add metadata column if missing (to store reference IDs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add job_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'job_id'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add application_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'application_id'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add bid_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'bid_id'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add project_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add milestone_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'milestone_id'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add dispute_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'dispute_id'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN dispute_id UUID REFERENCES public.disputes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add action_url column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'action_url'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN action_url TEXT;
  END IF;
END $$;

