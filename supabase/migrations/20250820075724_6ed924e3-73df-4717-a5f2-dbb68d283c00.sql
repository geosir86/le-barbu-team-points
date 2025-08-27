-- Fix the RLS policy for employee_events to properly check if user is manager
DROP POLICY IF EXISTS "Managers can manage all events" ON public.employee_events;

CREATE POLICY "Managers can manage all events" 
ON public.employee_events 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());