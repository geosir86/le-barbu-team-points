-- Update the trigger to not overwrite manually set monthly_revenue_actual values
-- We'll add a flag to track if the value was set manually

-- First, add a column to track manual revenue entries
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS manual_revenue_override boolean DEFAULT false;

-- Update the trigger function to respect manual overrides
CREATE OR REPLACE FUNCTION public.update_monthly_revenue_summary()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  emp_id UUID;
  target_year INTEGER;
  target_month INTEGER;
  weekly_total INTEGER := 0;
  daily_total INTEGER := 0;
  week_count INTEGER := 0;
  day_count INTEGER := 0;
  final_total INTEGER := 0;
  manual_override boolean := false;
BEGIN
  -- Determine which employee and date we're working with
  IF TG_TABLE_NAME = 'weekly_revenue' THEN
    emp_id := COALESCE(NEW.employee_id, OLD.employee_id);
    target_year := EXTRACT(YEAR FROM COALESCE(NEW.week_start_date, OLD.week_start_date));
    target_month := EXTRACT(MONTH FROM COALESCE(NEW.week_start_date, OLD.week_start_date));
  ELSIF TG_TABLE_NAME = 'daily_revenue' THEN
    emp_id := COALESCE(NEW.employee_id, OLD.employee_id);
    target_year := EXTRACT(YEAR FROM COALESCE(NEW.date, OLD.date));
    target_month := EXTRACT(MONTH FROM COALESCE(NEW.date, OLD.date));
  END IF;

  -- Calculate weekly revenue total for the month
  SELECT COALESCE(SUM(revenue_amount), 0), COUNT(*)
  INTO weekly_total, week_count
  FROM public.weekly_revenue
  WHERE employee_id = emp_id
    AND EXTRACT(YEAR FROM week_start_date) = target_year
    AND EXTRACT(MONTH FROM week_start_date) = target_month;

  -- Calculate daily revenue total for the month
  SELECT COALESCE(SUM(revenue_amount), 0), COUNT(*)
  INTO daily_total, day_count
  FROM public.daily_revenue
  WHERE employee_id = emp_id
    AND EXTRACT(YEAR FROM date) = target_year
    AND EXTRACT(MONTH FROM date) = target_month;

  -- Final total is weekly + daily revenue
  final_total := weekly_total + daily_total;

  -- Update or insert monthly summary
  INSERT INTO public.monthly_revenue_summary (
    employee_id, year, month, total_revenues, weeks_count, days_count
  )
  VALUES (emp_id, target_year, target_month, final_total, week_count, day_count)
  ON CONFLICT (employee_id, year, month)
  DO UPDATE SET
    total_revenues = final_total,
    weeks_count = week_count,
    days_count = day_count,
    updated_at = now();

  -- Check if employee has manual override for current month
  SELECT manual_revenue_override INTO manual_override
  FROM public.employees
  WHERE id = emp_id;

  -- Only update the employee's monthly_revenue_actual if not manually overridden
  IF NOT manual_override THEN
    UPDATE public.employees
    SET monthly_revenue_actual = final_total,
        updated_at = now()
    WHERE id = emp_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;