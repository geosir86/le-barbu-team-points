-- Fix reward redemption flow: points should only be deducted on approval, not on request creation

-- Drop the trigger that automatically deducts points on redemption creation
DROP TRIGGER IF EXISTS on_reward_redemption_created ON public.reward_redemptions;

-- Drop the function that processes reward redemptions automatically
DROP FUNCTION IF EXISTS public.process_reward_redemption();

-- Re-enable RLS on reward_redemptions table
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;