-- =====================================================
-- Check Payments Status Constraint
-- =====================================================
-- Run this to see what the actual constraint allows

SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.payments'::regclass
AND conname LIKE '%status%';

-- If the constraint is wrong, you can fix it with:
-- ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
-- ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
--   CHECK (status IN ('escrow', 'released', 'refunded'));

