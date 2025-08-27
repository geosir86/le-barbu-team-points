-- Create user_pins table for temporary PIN-based password resets
CREATE TABLE public.user_pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  pin_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT 'manager'
);

-- Enable RLS
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- Create policies for user_pins
CREATE POLICY "Managers can manage all PINs" 
ON public.user_pins 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

CREATE POLICY "System can read PINs for login" 
ON public.user_pins 
FOR SELECT 
USING (true);

CREATE POLICY "System can update PIN usage" 
ON public.user_pins 
FOR UPDATE 
USING (true);