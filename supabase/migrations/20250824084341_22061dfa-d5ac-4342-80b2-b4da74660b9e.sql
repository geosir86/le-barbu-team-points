-- Fix reward redemption flow: points should only be deducted on approval, not on request creation

-- First drop the trigger
DROP TRIGGER IF EXISTS process_reward_redemption_trigger ON public.reward_redemptions;

-- Then drop the function
DROP FUNCTION IF EXISTS public.process_reward_redemption();

-- Re-enable RLS on reward_redemptions table  
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;