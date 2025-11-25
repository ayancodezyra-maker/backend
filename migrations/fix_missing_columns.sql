-- =====================================================
-- Fix Missing Columns - Schema Cache Errors
-- =====================================================

-- Add updated_at to projects if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.projects 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add submitted_at to bid_submissions if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bid_submissions' 
    AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE public.bid_submissions 
    ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add portfolio to contractor_profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contractor_profiles' 
    AND column_name = 'portfolio'
  ) THEN
    ALTER TABLE public.contractor_profiles 
    ADD COLUMN portfolio JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add message to notifications if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'message'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN message TEXT;
  END IF;
END $$;

-- =====================================================
-- Fix Disputes Table Relationships
-- =====================================================

-- Add project_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add created_by if missing (for compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add dispute_type if missing (default = 'quality')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'dispute_type'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN dispute_type VARCHAR(50) DEFAULT 'quality';
  END IF;
END $$;

-- Add description if missing (for compatibility, but reason is the actual field)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create indexes for disputes
CREATE INDEX IF NOT EXISTS idx_disputes_project_id ON public.disputes(project_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON public.disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

