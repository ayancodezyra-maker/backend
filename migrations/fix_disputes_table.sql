-- =====================================================
-- Fix Disputes Table - Add Optional Columns
-- =====================================================

-- Add dispute_type column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'dispute_type'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN dispute_type TEXT;
  END IF;
END $$;

-- Add description column if missing
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

-- Add evidence column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'evidence'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN evidence JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add amount_disputed column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'amount_disputed'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN amount_disputed NUMERIC(12, 2);
  END IF;
END $$;

-- Add desired_resolution column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'desired_resolution'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN desired_resolution TEXT;
  END IF;
END $$;

-- Add milestone_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'milestone_id'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add updated_at column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add admin_assigned column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'disputes' 
    AND column_name = 'admin_assigned'
  ) THEN
    ALTER TABLE public.disputes 
    ADD COLUMN admin_assigned UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

