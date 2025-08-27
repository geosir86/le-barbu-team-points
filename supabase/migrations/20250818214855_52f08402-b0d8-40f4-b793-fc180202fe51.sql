-- Create employee_requests table for employee-submitted requests
CREATE TABLE public.employee_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('positive', 'negative')),
  event_type TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_requests
CREATE POLICY "Employees can view own requests" 
ON public.employee_requests 
FOR SELECT 
USING ((employee_id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Employees can create own requests" 
ON public.employee_requests 
FOR INSERT 
WITH CHECK ((employee_id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can manage all requests" 
ON public.employee_requests 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_requests_updated_at
BEFORE UPDATE ON public.employee_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();