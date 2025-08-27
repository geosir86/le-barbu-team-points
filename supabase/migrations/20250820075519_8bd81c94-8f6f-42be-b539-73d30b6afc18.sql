-- Fix the is_manager function to properly handle empty strings and null values
CREATE OR REPLACE FUNCTION public.is_manager()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- For managers, current_employee_id should be null, empty, or not set
  -- This handles cases where empty string is passed
  RETURN current_setting('app.current_employee_id', true) IS NULL 
    OR current_setting('app.current_employee_id', true) = '' 
    OR trim(current_setting('app.current_employee_id', true)) = '';
END;
$function$