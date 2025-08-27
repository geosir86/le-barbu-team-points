-- Add revenue target fields to employees table
ALTER TABLE public.employees 
ADD COLUMN monthly_revenue_target integer DEFAULT 0,
ADD COLUMN monthly_revenue_actual integer DEFAULT 0;