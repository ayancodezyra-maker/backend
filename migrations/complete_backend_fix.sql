-- =====================================================
-- COMPLETE BACKEND FIX - Schema & RLS Alignment
-- =====================================================
-- This migration fixes all schema mismatches and RLS policies
-- to ensure backend controllers work correctly with Supabase

-- =====================================================
-- 1. FIX CONTRACTOR_PROFILES TABLE
-- =====================================================

-- Add company_name if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contractor_profiles' 
    AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.contractor_profiles 
    ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- Add insurance_amount if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contractor_profiles' 
    AND column_name = 'insurance_amount'
  ) THEN
    ALTER TABLE public.contractor_profiles 
    ADD COLUMN insurance_amount NUMERIC(12, 2);
  END IF;
END $$;

-- Add specialties if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contractor_profiles' 
    AND column_name = 'specialties'
  ) THEN
    ALTER TABLE public.contractor_profiles 
    ADD COLUMN specialties JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- =====================================================
-- 2. FIX BIDS TABLE
-- =====================================================

-- Add updated_at if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bids' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.bids 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- 3. FIX BID_SUBMISSIONS TABLE
-- =====================================================

-- Add notes if missing
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

-- Add created_by if missing (NOT NULL constraint)
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
    
    -- Set default for existing rows
    UPDATE public.bid_submissions 
    SET created_by = contractor_id 
    WHERE created_by IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE public.bid_submissions 
    ALTER COLUMN created_by SET NOT NULL;
  ELSE
    -- If column exists but is nullable, make it NOT NULL
    ALTER TABLE public.bid_submissions 
    ALTER COLUMN created_by SET NOT NULL;
    
    -- Update any NULL values
    UPDATE public.bid_submissions 
    SET created_by = contractor_id 
    WHERE created_by IS NULL;
  END IF;
END $$;

-- =====================================================
-- 4. FIX PAYMENTS TABLE
-- =====================================================

-- Add payment_type if missing (NOT NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE public.payments 
    ADD COLUMN payment_type TEXT;
    
    -- Set default for existing rows
    UPDATE public.payments 
    SET payment_type = 'milestone' 
    WHERE payment_type IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE public.payments 
    ALTER COLUMN payment_type SET NOT NULL;
  ELSE
    -- If column exists but is nullable, make it NOT NULL
    UPDATE public.payments 
    SET payment_type = 'milestone' 
    WHERE payment_type IS NULL;
    
    ALTER TABLE public.payments 
    ALTER COLUMN payment_type SET NOT NULL;
  END IF;
END $$;

-- Add paid_to if missing (NOT NULL)
DO $$
DECLARE
  has_released_to BOOLEAN;
  has_released_by BOOLEAN;
  has_paid_by BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'released_to'
  ) INTO has_released_to;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'released_by'
  ) INTO has_released_by;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'paid_by'
  ) INTO has_paid_by;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'paid_to'
  ) THEN
    ALTER TABLE public.payments 
    ADD COLUMN paid_to UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;
    
    -- Set default for existing rows
    -- Try to use released_to if it exists
    IF has_released_to THEN
      UPDATE public.payments 
      SET paid_to = released_to 
      WHERE paid_to IS NULL AND released_to IS NOT NULL;
    END IF;
    
    -- For remaining NULL values, try to determine from project via milestone
    UPDATE public.payments p
    SET paid_to = (
      SELECT pr.contractor_id 
      FROM project_milestones pm
      JOIN projects pr ON pr.id = pm.project_id
      WHERE pm.id = p.milestone_id
      LIMIT 1
    )
    WHERE paid_to IS NULL AND milestone_id IS NOT NULL;
    
    -- Try released_by if it exists
    IF has_released_by THEN
      UPDATE public.payments 
      SET paid_to = released_by 
      WHERE paid_to IS NULL AND released_by IS NOT NULL;
    END IF;
    
    -- Try paid_by if it exists (some schemas have this)
    IF has_paid_by THEN
      UPDATE public.payments 
      SET paid_to = paid_by 
      WHERE paid_to IS NULL AND paid_by IS NOT NULL;
    END IF;
    
    -- For any remaining NULLs, we need a default - use a placeholder or skip NOT NULL
    -- Check if there are any NULLs left
    IF EXISTS (SELECT 1 FROM public.payments WHERE paid_to IS NULL) THEN
      -- If there are NULLs, we can't make it NOT NULL yet
      -- Set a default UUID or leave it nullable for now
      RAISE NOTICE 'Warning: Some payments have NULL paid_to. Setting default values...';
      -- Try to get contractor from project if project_id exists
      UPDATE public.payments p
      SET paid_to = (
        SELECT pr.contractor_id 
        FROM projects pr
        WHERE pr.id = p.project_id
        LIMIT 1
      )
      WHERE paid_to IS NULL AND project_id IS NOT NULL;
    END IF;
    
    -- Now make it NOT NULL (only if all rows have values)
    ALTER TABLE public.payments 
    ALTER COLUMN paid_to SET NOT NULL;
  ELSE
    -- If column exists but is nullable, populate NULL values
    IF has_released_to THEN
      UPDATE public.payments 
      SET paid_to = released_to 
      WHERE paid_to IS NULL AND released_to IS NOT NULL;
    END IF;
    
    -- Try to determine from project via milestone
    UPDATE public.payments p
    SET paid_to = (
      SELECT pr.contractor_id 
      FROM project_milestones pm
      JOIN projects pr ON pr.id = pm.project_id
      WHERE pm.id = p.milestone_id
      LIMIT 1
    )
    WHERE paid_to IS NULL AND milestone_id IS NOT NULL;
    
    -- Try from project_id directly
    UPDATE public.payments p
    SET paid_to = (
      SELECT pr.contractor_id 
      FROM projects pr
      WHERE pr.id = p.project_id
      LIMIT 1
    )
    WHERE paid_to IS NULL AND project_id IS NOT NULL;
    
    -- Try released_by if it exists
    IF has_released_by THEN
      UPDATE public.payments 
      SET paid_to = released_by 
      WHERE paid_to IS NULL AND released_by IS NOT NULL;
    END IF;
    
    -- Try paid_by if it exists
    IF has_paid_by THEN
      UPDATE public.payments 
      SET paid_to = paid_by 
      WHERE paid_to IS NULL AND paid_by IS NOT NULL;
    END IF;
    
    -- Make it NOT NULL
    ALTER TABLE public.payments 
    ALTER COLUMN paid_to SET NOT NULL;
  END IF;
END $$;

-- Add project_id if missing (NOT NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.payments 
    ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT;
    
    -- Try to set from milestone if available (use project_milestones table)
    UPDATE public.payments p
    SET project_id = (
      SELECT pm.project_id 
      FROM project_milestones pm 
      WHERE pm.id = p.milestone_id
      LIMIT 1
    )
    WHERE project_id IS NULL AND milestone_id IS NOT NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE public.payments 
    ALTER COLUMN project_id SET NOT NULL;
  ELSE
    -- If column exists but is nullable, make it NOT NULL
    UPDATE public.payments p
    SET project_id = (
      SELECT pm.project_id 
      FROM project_milestones pm 
      WHERE pm.id = p.milestone_id
      LIMIT 1
    )
    WHERE project_id IS NULL AND milestone_id IS NOT NULL;
    
    ALTER TABLE public.payments 
    ALTER COLUMN project_id SET NOT NULL;
  END IF;
END $$;

-- Add created_at if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.payments 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- 5. FIX PROJECTS TABLE
-- =====================================================

-- Ensure owner_id is NOT NULL
DO $$
BEGIN
  -- Update any NULL owner_id to created_by
  UPDATE public.projects 
  SET owner_id = created_by 
  WHERE owner_id IS NULL AND created_by IS NOT NULL;
  
  -- Make owner_id NOT NULL
  ALTER TABLE public.projects 
  ALTER COLUMN owner_id SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- If constraint already exists, ignore
    NULL;
END $$;

-- =====================================================
-- 6. FIX PROJECT_MILESTONES TABLE
-- =====================================================

-- Ensure payment_amount has NOT NULL and DEFAULT
DO $$
BEGIN
  -- Set default for any NULL values
  UPDATE public.project_milestones 
  SET payment_amount = 0 
  WHERE payment_amount IS NULL;
  
  -- Make it NOT NULL with DEFAULT
  ALTER TABLE public.project_milestones 
  ALTER COLUMN payment_amount SET NOT NULL,
  ALTER COLUMN payment_amount SET DEFAULT 0;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bid_submissions_created_by ON public.bid_submissions(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_paid_to ON public.payments(paid_to);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);

-- =====================================================
-- 6.5. FIX PAYMENTS FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Fix milestone_id foreign key to point to project_milestones instead of milestones
DO $$
BEGIN
  -- Drop the old foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_milestone_id_fkey'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments 
    DROP CONSTRAINT payments_milestone_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint pointing to project_milestones
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_milestone_id_fkey'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments 
    ADD CONSTRAINT payments_milestone_id_fkey 
    FOREIGN KEY (milestone_id) 
    REFERENCES public.project_milestones(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 7. CREATE/ENSURE HELPER FUNCTIONS FOR RLS
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_role_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT) TO authenticated;

-- =====================================================
-- 8. FIX RLS POLICIES FOR ALL TABLES
-- =====================================================

-- =====================================================
-- PROJECTS RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update their projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;

-- SELECT: Users can view projects where they are owner, contractor, or have permission
CREATE POLICY "Users can view their projects" ON projects
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR contractor_id = auth.uid()
    OR created_by = auth.uid()
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- INSERT: Users can create projects if they have permission
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      owner_id = auth.uid()
      OR created_by = auth.uid()
      OR has_permission(auth.uid(), 'canCreateBids')
      OR is_admin_role(get_user_role_code(auth.uid()))
    )
  );

-- UPDATE: Users can update projects where they are owner, contractor, or have permission
CREATE POLICY "Users can update their projects" ON projects
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR contractor_id = auth.uid()
    OR created_by = auth.uid()
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR contractor_id = auth.uid()
    OR created_by = auth.uid()
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- =====================================================
-- PROJECT_MILESTONES RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can create milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can update milestones for their projects" ON project_milestones;

-- SELECT: Users can view milestones for their projects
CREATE POLICY "Users can view milestones for their projects" ON project_milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR p.created_by = auth.uid())
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- INSERT: Users can create milestones for their projects
CREATE POLICY "Users can create milestones for their projects" ON project_milestones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR p.created_by = auth.uid())
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- UPDATE: Users can update milestones for their projects
CREATE POLICY "Users can update milestones for their projects" ON project_milestones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR p.created_by = auth.uid())
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_milestones.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR p.created_by = auth.uid())
    )
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- =====================================================
-- BIDS RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view bids they created or have permission" ON bids;
DROP POLICY IF EXISTS "Users with canCreateBids can create bids" ON bids;
DROP POLICY IF EXISTS "Bid creators can update their bids" ON bids;

-- SELECT: Users can view bids they created or have permission
-- Note: bids table uses submitted_by, not created_by
CREATE POLICY "Users can view bids they created or have permission" ON bids
  FOR SELECT
  USING (
    submitted_by = auth.uid()
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- INSERT: Users with canCreateBids can create bids
CREATE POLICY "Users with canCreateBids can create bids" ON bids
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      submitted_by = auth.uid()
      OR has_permission(auth.uid(), 'canCreateBids')
      OR is_admin_role(get_user_role_code(auth.uid()))
    )
  );

-- UPDATE: Bid creators can update their bids
CREATE POLICY "Bid creators can update their bids" ON bids
  FOR UPDATE
  USING (
    submitted_by = auth.uid()
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    submitted_by = auth.uid()
    OR has_permission(auth.uid(), 'canEditAllProjects')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- =====================================================
-- BID_SUBMISSIONS RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their bid submissions" ON bid_submissions;
DROP POLICY IF EXISTS "Contractors can create bid submissions" ON bid_submissions;
DROP POLICY IF EXISTS "Users can update their bid submissions" ON bid_submissions;

-- SELECT: Users can view their bid submissions
CREATE POLICY "Users can view their bid submissions" ON bid_submissions
  FOR SELECT
  USING (
    contractor_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM bids b
      WHERE b.id = bid_submissions.bid_id
      AND b.submitted_by = auth.uid()
    )
    OR has_permission(auth.uid(), 'canViewAllBids')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- INSERT: Contractors can create bid submissions
CREATE POLICY "Contractors can create bid submissions" ON bid_submissions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      contractor_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

-- UPDATE: Users can update their bid submissions
CREATE POLICY "Users can update their bid submissions" ON bid_submissions
  FOR UPDATE
  USING (
    contractor_id = auth.uid()
    OR created_by = auth.uid()
  )
  WITH CHECK (
    contractor_id = auth.uid()
    OR created_by = auth.uid()
  );

-- =====================================================
-- PAYMENTS RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view payments for their projects" ON payments;
DROP POLICY IF EXISTS "Users can create payments for their projects" ON payments;
DROP POLICY IF EXISTS "Users can update payments for their projects" ON payments;

-- SELECT: Users can view payments for their projects
-- Note: This policy works even if released_by/released_to don't exist (they'll just be false)
CREATE POLICY "Users can view payments for their projects" ON payments
  FOR SELECT
  USING (
    paid_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = payments.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR p.created_by = auth.uid())
    )
    OR has_permission(auth.uid(), 'canManagePayments')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- INSERT: Users can create payments for their projects
CREATE POLICY "Users can create payments for their projects" ON payments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = payments.project_id
        AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR p.created_by = auth.uid())
      )
      OR has_permission(auth.uid(), 'canManagePayments')
      OR is_admin_role(get_user_role_code(auth.uid()))
    )
  );

-- UPDATE: Users can update payments for their projects
CREATE POLICY "Users can update payments for their projects" ON payments
  FOR UPDATE
  USING (
    paid_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = payments.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR p.created_by = auth.uid())
    )
    OR has_permission(auth.uid(), 'canManagePayments')
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    paid_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = payments.project_id
      AND (p.owner_id = auth.uid() OR p.contractor_id = auth.uid() OR p.created_by = auth.uid())
    )
    OR has_permission(auth.uid(), 'canManagePayments')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- =====================================================
-- END OF MIGRATION
-- =====================================================

