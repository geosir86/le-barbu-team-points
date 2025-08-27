-- Fix RLS policies for employee_events to allow employees to view other employees for kudos
-- Update RLS policies for employee_feedback to properly support kudos system

-- First, let's fix employee_events RLS to allow better access
DROP POLICY IF EXISTS "Employees can view own events" ON public.employee_events;
DROP POLICY IF EXISTS "Managers can manage all events" ON public.employee_events;

-- New policies for employee_events
CREATE POLICY "Employees can view own events" 
ON public.employee_events 
FOR SELECT 
USING ((employee_id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can manage all employee events" 
ON public.employee_events 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

-- Allow system to insert events (for approved requests)
CREATE POLICY "System can insert employee events" 
ON public.employee_events 
FOR INSERT 
WITH CHECK (true);

-- Update employee_feedback policies for better kudos support
DROP POLICY IF EXISTS "Employees can create feedback" ON public.employee_feedback;
DROP POLICY IF EXISTS "Employees can view own feedback" ON public.employee_feedback;
DROP POLICY IF EXISTS "Managers can manage all feedback" ON public.employee_feedback;

-- New policies for employee_feedback (kudos system)
CREATE POLICY "Employees can create kudos feedback" 
ON public.employee_feedback 
FOR INSERT 
WITH CHECK (
  (from_employee_id)::text = current_setting('app.current_employee_id', true)
  AND feedback_type IN ('kudos', 'peer')
);

CREATE POLICY "Employees can view feedback about them" 
ON public.employee_feedback 
FOR SELECT 
USING ((employee_id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Employees can view kudos they sent" 
ON public.employee_feedback 
FOR SELECT 
USING ((from_employee_id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can manage all feedback and kudos" 
ON public.employee_feedback 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

-- Update employees table policy to allow employees to see other employees for kudos
CREATE POLICY "Employees can view colleague list for kudos" 
ON public.employees 
FOR SELECT 
USING (
  is_active = true 
  AND (
    is_manager() 
    OR current_setting('app.current_employee_id', true) IS NOT NULL
  )
);

-- Add kudos status field to employee_feedback for approval workflow
ALTER TABLE public.employee_feedback 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.employee_feedback 
ADD COLUMN IF NOT EXISTS approved_by text;

ALTER TABLE public.employee_feedback 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;