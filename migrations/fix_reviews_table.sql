-- =====================================================
-- Fix Reviews Table - Add Missing Columns
-- =====================================================

-- Add rating column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'rating'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- Add comment column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'comment'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN comment TEXT;
  END IF;
END $$;

-- Add photos column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'photos'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN photos TEXT[] DEFAULT '{}'::text[];
  END IF;
END $$;

-- Add response column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'response'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN response TEXT;
  END IF;
END $$;

-- Add response_date column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'response_date'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN response_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

