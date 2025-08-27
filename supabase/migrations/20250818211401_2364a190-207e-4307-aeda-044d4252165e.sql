-- First, create a function to set employee context for RLS
CREATE OR REPLACE FUNCTION public.set_current_employee_id(employee_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_employee_id', employee_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if current user is a manager (for future use with proper auth)
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
BEGIN
  -- For now, we'll check if the current_employee_id is not set (managers won't have this)
  -- In a full implementation, this would check against a proper managers table or role
  RETURN current_setting('app.current_employee_id', true) IS NULL OR current_setting('app.current_employee_id', true) = '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Managers can manage all employees" ON public.employees;

-- Create proper RLS policies for the employees table
CREATE POLICY "Employees can view own record" 
ON public.employees 
FOR SELECT 
USING ((id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can view all employees" 
ON public.employees 
FOR SELECT 
USING (public.is_manager());

CREATE POLICY "Managers can insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (public.is_manager());

CREATE POLICY "Managers can update employees" 
ON public.employees 
FOR UPDATE 
USING (public.is_manager())
WITH CHECK (public.is_manager());

CREATE POLICY "Managers can delete employees" 
ON public.employees 
FOR DELETE 
USING (public.is_manager());