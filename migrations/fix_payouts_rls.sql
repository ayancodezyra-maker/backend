-- =====================================================
-- Fix Payouts RLS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON payouts;
DROP POLICY IF EXISTS "Users can create payouts" ON payouts;
DROP POLICY IF EXISTS "Users can update payouts" ON payouts;

-- SELECT: Users can view their own payouts or if they have permission
CREATE POLICY "Users can view their own payouts" ON payouts
  FOR SELECT
  USING (
    contractor_id = auth.uid()
    OR has_permission(auth.uid(), 'canManagePayments')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- INSERT: Users with canManagePayments or admins can create payouts
CREATE POLICY "Users can create payouts" ON payouts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      has_permission(auth.uid(), 'canManagePayments')
      OR is_admin_role(get_user_role_code(auth.uid()))
    )
  );

-- UPDATE: Users with canManagePayments or admins can update payouts
CREATE POLICY "Users can update payouts" ON payouts
  FOR UPDATE
  USING (
    has_permission(auth.uid(), 'canManagePayments')
    OR is_admin_role(get_user_role_code(auth.uid()))
  )
  WITH CHECK (
    has_permission(auth.uid(), 'canManagePayments')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

-- DELETE: Only admins can delete payouts
CREATE POLICY "Admins can delete payouts" ON payouts
  FOR DELETE
  USING (
    has_permission(auth.uid(), 'canManagePayments')
    OR is_admin_role(get_user_role_code(auth.uid()))
  );

