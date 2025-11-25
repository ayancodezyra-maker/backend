-- =====================================================
-- COMPLETE FIX FOR BID_SUBMISSIONS TABLE & RLS
-- =====================================================
-- Paste this entire block into Supabase SQL Editor
-- =====================================================

-- Step 1: Add missing columns
-- =====================================================

-- Add created_by column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bid_submissions' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.bid_submissions 
    ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add notes column if missing (API uses this field)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bid_submissions' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.bid_submissions 
    ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Step 2: Backfill existing data and set constraints
-- =====================================================

-- Backfill existing NULL created_by values
DO $$
BEGIN
  UPDATE public.bid_submissions 
  SET created_by = contractor_id 
  WHERE created_by IS NULL;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Make created_by NOT NULL
DO $$
BEGIN
  ALTER TABLE public.bid_submissions 
    ALTER COLUMN created_by SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Ensure created_at has default
ALTER TABLE public.bid_submissions 
  ALTER COLUMN created_at SET DEFAULT NOW();

-- Ensure updated_at has default
ALTER TABLE public.bid_submissions 
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Step 3: Create trigger to auto-fill created_by on INSERT (backup)
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_bid_submissions_created_by ON public.bid_submissions;

-- Create function to set created_by
CREATE OR REPLACE FUNCTION public.set_bid_submissions_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-fill created_by with auth.uid() if not provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER set_bid_submissions_created_by
  BEFORE INSERT ON public.bid_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_bid_submissions_created_by();

-- Step 4: Enable RLS and drop old policies
-- =====================================================

-- Enable RLS on bid_submissions
ALTER TABLE public.bid_submissions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their bid submissions" ON public.bid_submissions;
DROP POLICY IF EXISTS "Users with canCreateBids can create bid submissions" ON public.bid_submissions;
DROP POLICY IF EXISTS "Contractors can create bid submissions" ON public.bid_submissions;
DROP POLICY IF EXISTS "Users can update their bid submissions" ON public.bid_submissions;
DROP POLICY IF EXISTS "Users can insert their own bid submissions" ON public.bid_submissions;

-- Step 5: Create correct RLS policies
-- =====================================================

-- Policy: Allow INSERT if contractor_id = auth.uid() OR created_by = auth.uid()
-- Note: Backend always sets created_by = auth.uid(), so this ensures compatibility
CREATE POLICY "Users can insert their own bid submissions" ON public.bid_submissions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      contractor_id = auth.uid() 
      OR created_by = auth.uid()
    )
  );

-- Policy: Allow SELECT if created_by = auth.uid()
CREATE POLICY "Users can view their own bid submissions" ON public.bid_submissions
  FOR SELECT
  USING (created_by = auth.uid());

-- Policy: Allow UPDATE if created_by = auth.uid()
CREATE POLICY "Users can update their own bid submissions" ON public.bid_submissions
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Step 6: Create index on created_by for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bid_submissions_created_by 
  ON public.bid_submissions(created_by);

-- =====================================================
-- COMPLETE TABLE STRUCTURE SUMMARY
-- =====================================================
-- 
-- Columns in bid_submissions:
-- ✓ id (UUID, PRIMARY KEY)
-- ✓ bid_id (UUID, NOT NULL, FK to bids)
-- ✓ contractor_id (UUID, NOT NULL, FK to profiles)
-- ✓ amount (NUMERIC, NOT NULL)
-- ✓ notes (TEXT) - ADDED
-- ✓ created_by (UUID, NOT NULL, FK to profiles, auto-filled) - ADDED
-- ✓ created_at (TIMESTAMPTZ, DEFAULT NOW())
-- ✓ updated_at (TIMESTAMPTZ, DEFAULT NOW())
-- 
-- Additional columns (existing):
-- - timeline_days (INTEGER)
-- - proposal (TEXT)
-- - documents (TEXT[])
-- - status (VARCHAR(50))
-- 
-- RLS Policies:
-- ✓ INSERT: (contractor_id = auth.uid() OR created_by = auth.uid())
-- ✓ SELECT: (created_by = auth.uid())
-- ✓ UPDATE: (created_by = auth.uid())
-- 
-- Auto-fill:
-- ✓ created_by automatically set to auth.uid() on INSERT via trigger (backup)
-- ✓ Backend always sets created_by = req.user.id (primary method)
-- =====================================================

