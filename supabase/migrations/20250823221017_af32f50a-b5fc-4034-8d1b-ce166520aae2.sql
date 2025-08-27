-- Fix the managers policy for reward_redemptions
ALTER POLICY "Managers can manage all redemptions" ON public.reward_redemptions 
USING (is_manager())
WITH CHECK (is_manager());