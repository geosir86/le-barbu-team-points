-- Allow employees to cancel (update to cancelled status) their own pending requests
CREATE POLICY "Employees can cancel own pending requests" 
ON public.reward_redemptions 
FOR UPDATE 
USING (
  (employee_id)::text = current_setting('app.current_employee_id'::text, true) 
  AND status = 'pending'
) 
WITH CHECK (
  (employee_id)::text = current_setting('app.current_employee_id'::text, true) 
  AND status = 'cancelled'
  AND OLD.status = 'pending'
);