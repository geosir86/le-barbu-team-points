-- Fix user_preferences table constraints and data handling
DROP TABLE IF EXISTS user_preferences;

CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL, -- NULL for managers, employee UUID for employees
  user_type TEXT NOT NULL DEFAULT 'employee'::text CHECK (user_type IN ('manager', 'employee')),
  theme_mode TEXT NOT NULL DEFAULT 'system'::text CHECK (theme_mode IN ('light', 'dark', 'system')),
  custom_colors JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Unique constraint for user_type and user_id combination
  UNIQUE(user_type, user_id)
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