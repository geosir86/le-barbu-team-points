-- Create daily revenue tracking table
CREATE TABLE public.daily_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  date DATE NOT NULL,
  revenue_amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create monthly revenue summary table
CREATE TABLE public.monthly_revenue_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_revenues INTEGER NOT NULL DEFAULT 0,
  weeks_count INTEGER NOT NULL DEFAULT 0,
  days_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, year, month)
);

-- Enable RLS on both tables
ALTER TABLE public.daily_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_revenue_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_revenue
CREATE POLICY "Managers can manage all daily revenue" 
ON public.daily_revenue 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

-- Create RLS policies for monthly_revenue_summary  
CREATE POLICY "Managers can manage all monthly summaries" 
ON public.monthly_revenue_summary 
FOR ALL
USING (is_manager())
WITH CHECK (is_manager());

CREATE POLICY "Employees can view own monthly summaries" 
ON public.monthly_revenue_summary 
FOR SELECT
USING ((employee_id)::text = current_setting('app.current_employee_id', true));

-- Create trigger for updating timestamps
CREATE TRIGGER update_daily_revenue_updated_at
BEFORE UPDATE ON public.daily_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_summary_updated_at
BEFORE UPDATE ON public.monthly_revenue_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update monthly summaries
CREATE OR REPLACE FUNCTION public.update_monthly_revenue_summary()
RETURNS TRIGGER AS $$
DECLARE
  emp_id UUID;
  target_year INTEGER;
  target_month INTEGER;
  weekly_total INTEGER := 0;
  daily_total INTEGER := 0;
  week_count INTEGER := 0;
  day_count INTEGER := 0;
  final_total INTEGER := 0;
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

  -- Also update the employee's monthly_revenue_actual
  UPDATE public.employees
  SET monthly_revenue_actual = final_total,
      updated_at = now()
  WHERE id = emp_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update monthly summaries
CREATE TRIGGER trigger_update_monthly_summary_weekly
AFTER INSERT OR UPDATE OR DELETE ON public.weekly_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_monthly_revenue_summary();

CREATE TRIGGER trigger_update_monthly_summary_daily
AFTER INSERT OR UPDATE OR DELETE ON public.daily_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_monthly_revenue_summary();