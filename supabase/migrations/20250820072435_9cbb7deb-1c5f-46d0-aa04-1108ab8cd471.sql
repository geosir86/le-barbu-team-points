-- Create trigger to automatically update employee points when events are inserted
CREATE TRIGGER update_employee_points_trigger
    AFTER INSERT ON public.employee_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_employee_points();