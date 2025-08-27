-- Fix RLS policies for employee_events to allow managers to create events properly
DROP POLICY IF EXISTS "Managers can manage all events" ON public.employee_events;

CREATE POLICY "Managers can manage all events" 
ON public.employee_events 
FOR ALL 
USING (
  -- Allow if it's a manager (no current employee id set)
  current_setting('app.current_employee_id', true) IS NULL 
  OR current_setting('app.current_employee_id', true) = '' 
  OR trim(current_setting('app.current_employee_id', true)) = ''
)
WITH CHECK (
  -- Allow if it's a manager (no current employee id set)
  current_setting('app.current_employee_id', true) IS NULL 
  OR current_setting('app.current_employee_id', true) = '' 
  OR trim(current_setting('app.current_employee_id', true)) = ''
);

-- Add kudos feedback type to employee_feedback table
ALTER TABLE public.employee_feedback 
DROP CONSTRAINT IF EXISTS employee_feedback_feedback_type_check;

ALTER TABLE public.employee_feedback 
ADD CONSTRAINT employee_feedback_feedback_type_check 
CHECK (feedback_type IN ('peer', 'manager', 'kudos'));

-- Update RLS policies for employee_feedback to allow kudos
DROP POLICY IF EXISTS "Employees can create peer feedback" ON public.employee_feedback;

CREATE POLICY "Employees can create feedback" 
ON public.employee_feedback 
FOR INSERT 
WITH CHECK (
  (((from_employee_id)::text = current_setting('app.current_employee_id'::text, true)) AND (feedback_type IN ('peer', 'kudos')))
  OR 
  (current_setting('app.current_employee_id', true) IS NULL OR current_setting('app.current_employee_id', true) = '' OR trim(current_setting('app.current_employee_id', true)) = '')
);