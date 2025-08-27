-- Fix RLS policy for reward_redemptions to allow employees to create their own redemptions
DROP POLICY IF EXISTS "Managers can manage all redemptions" ON public.reward_redemptions;

-- Create proper RLS policies for reward_redemptions
CREATE POLICY "Employees can view own redemptions" 
ON public.reward_redemptions 
FOR SELECT 
USING ((employee_id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Employees can create own redemptions" 
ON public.reward_redemptions 
FOR INSERT 
WITH CHECK ((employee_id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can manage all redemptions" 
ON public.reward_redemptions 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());