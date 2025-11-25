-- =====================================================
-- Quick Fix: Update payments.milestone_id foreign key
-- =====================================================
-- This fixes the foreign key constraint to point to project_milestones
-- instead of milestones table

-- Drop the old foreign key constraint if it exists
DO $$
BEGIN
  -- Drop the old constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_milestone_id_fkey'
    AND table_name = 'payments'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.payments 
    DROP CONSTRAINT payments_milestone_id_fkey;
    RAISE NOTICE 'Dropped old payments_milestone_id_fkey constraint';
  END IF;
  
  -- Add the correct foreign key constraint pointing to project_milestones
  ALTER TABLE public.payments 
  ADD CONSTRAINT payments_milestone_id_fkey 
  FOREIGN KEY (milestone_id) 
  REFERENCES public.project_milestones(id) 
  ON DELETE SET NULL;
  
  RAISE NOTICE 'Added new payments_milestone_id_fkey constraint pointing to project_milestones';
END $$;

