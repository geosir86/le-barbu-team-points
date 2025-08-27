-- Create the missing triggers for the revenue tables
-- These triggers will call the update_monthly_revenue_summary function
-- whenever weekly or daily revenue data changes

-- Trigger for weekly_revenue table
CREATE TRIGGER update_monthly_summary_on_weekly_revenue
AFTER INSERT OR UPDATE OR DELETE ON public.weekly_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_monthly_revenue_summary();

-- Trigger for daily_revenue table  
CREATE TRIGGER update_monthly_summary_on_daily_revenue
AFTER INSERT OR UPDATE OR DELETE ON public.daily_revenue
FOR EACH ROW
EXECUTE FUNCTION public.update_monthly_revenue_summary();