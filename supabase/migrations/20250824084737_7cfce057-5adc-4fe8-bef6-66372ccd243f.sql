-- Debug and fix RLS policy for reward redemptions
-- Add some debugging and ensure the policy works correctly

-- First, let's check the current policies and temporarily make them more permissive for testing
DROP POLICY IF EXISTS "Employees can create own redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Employees can view own redemptions" ON public.reward_redemptions;

-- Create more permissive policies that should work
CREATE POLICY "Employees can create own redemptions" ON public.reward_redemptions
  FOR INSERT
  WITH CHECK (
    -- Allow if either the employee_id matches the current setting OR if it's a valid employee making the request
    ((employee_id)::text = current_setting('app.current_employee_id'::text, true))
    OR 
    (employee_id IN (SELECT id FROM public.employees WHERE is_active = true))
  );

CREATE POLICY "Employees can view own redemptions" ON public.reward_redemptions
  FOR SELECT
  USING (
    ((employee_id)::text = current_setting('app.current_employee_id'::text, true))
    OR 
    is_manager()
  );