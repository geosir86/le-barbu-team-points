-- Add bonus revenue fields to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS bonus_revenue_value integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_revenue_type text DEFAULT 'EUR';

-- Create events_settings table to replace mock data
CREATE TABLE IF NOT EXISTS public.events_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  points integer NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('positive', 'negative')),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for events_settings
ALTER TABLE public.events_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for events_settings
CREATE POLICY "Managers can manage all event settings" 
ON public.events_settings 
FOR ALL 
USING (is_manager()) 
WITH CHECK (is_manager());

CREATE POLICY "Everyone can view active event settings" 
ON public.events_settings 
FOR SELECT 
USING (is_enabled = true);

-- Insert default event types
INSERT INTO public.events_settings (name, points, event_type, is_enabled) VALUES
('Άριστη εξυπηρέτηση πελάτη', 10, 'positive', true),
('Πώληση premium προϊόντος', 15, 'positive', true),
('Καθαριότητα χώρου', 5, 'positive', true),
('Βοήθεια σε συνάδελφο', 8, 'positive', true),
('Αργοπορία', -5, 'negative', true),
('Μη τήρηση πρωτοκόλλου', -10, 'negative', true),
('Παράπονο πελάτη', -15, 'negative', true)
ON CONFLICT DO NOTHING;

-- Create bonus_requests table for bonus revenue redemptions
CREATE TABLE IF NOT EXISTS public.bonus_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  bonus_value integer NOT NULL,
  bonus_type text NOT NULL CHECK (bonus_type IN ('EUR', 'POINTS')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text,
  approved_by text,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, year, month)
);

-- Enable RLS for bonus_requests
ALTER TABLE public.bonus_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for bonus_requests
CREATE POLICY "Employees can create own bonus requests" 
ON public.bonus_requests 
FOR INSERT 
WITH CHECK (employee_id::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Employees can view own bonus requests" 
ON public.bonus_requests 
FOR SELECT 
USING (employee_id::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can manage all bonus requests" 
ON public.bonus_requests 
FOR ALL 
USING (is_manager()) 
WITH CHECK (is_manager());

-- Update notifications table to support read status
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS action_url text;

-- Create trigger for updated_at on events_settings
CREATE TRIGGER update_events_settings_updated_at
  BEFORE UPDATE ON public.events_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on bonus_requests  
CREATE TRIGGER update_bonus_requests_updated_at
  BEFORE UPDATE ON public.bonus_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();