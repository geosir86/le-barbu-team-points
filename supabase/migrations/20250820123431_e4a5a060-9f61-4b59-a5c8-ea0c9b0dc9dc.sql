-- Add weekly revenue tracking table
CREATE TABLE public.weekly_revenue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  revenue_amount integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, week_start_date)
);

-- Enable RLS for weekly_revenue
ALTER TABLE public.weekly_revenue ENABLE ROW LEVEL SECURITY;

-- Create policies for weekly revenue
CREATE POLICY "Managers can manage all weekly revenue" 
ON public.weekly_revenue 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

-- Add amount field to employee_requests for sale amounts
ALTER TABLE public.employee_requests 
ADD COLUMN amount integer DEFAULT 0;

-- Add trigger for updated_at on weekly_revenue
CREATE TRIGGER update_weekly_revenue_updated_at
BEFORE UPDATE ON public.weekly_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get current week's start date
CREATE OR REPLACE FUNCTION public.get_week_start_date(input_date date DEFAULT CURRENT_DATE)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (input_date - INTERVAL '1 day' * EXTRACT(DOW FROM input_date))::date;
$$;