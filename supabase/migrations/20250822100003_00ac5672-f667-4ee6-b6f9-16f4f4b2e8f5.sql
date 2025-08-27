-- Create user_preferences table for storing custom theme and color settings
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL, -- NULL for manager, employee_id for employees
  user_type TEXT NOT NULL DEFAULT 'employee', -- 'manager' or 'employee'
  theme_mode TEXT NOT NULL DEFAULT 'system', -- 'light', 'dark', or 'system'
  custom_colors JSONB NULL, -- JSON object with custom CSS variables
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (
  (user_type = 'manager' AND is_manager()) OR
  (user_type = 'employee' AND user_id::text = current_setting('app.current_employee_id', true))
);

CREATE POLICY "Users can insert own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (
  (user_type = 'manager' AND is_manager()) OR
  (user_type = 'employee' AND user_id::text = current_setting('app.current_employee_id', true))
);

CREATE POLICY "Users can update own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (
  (user_type = 'manager' AND is_manager()) OR
  (user_type = 'employee' AND user_id::text = current_setting('app.current_employee_id', true))
)
WITH CHECK (
  (user_type = 'manager' AND is_manager()) OR
  (user_type = 'employee' AND user_id::text = current_setting('app.current_employee_id', true))
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to ensure one preference per user
CREATE UNIQUE INDEX idx_user_preferences_unique 
ON public.user_preferences (COALESCE(user_id::text, 'manager'), user_type);