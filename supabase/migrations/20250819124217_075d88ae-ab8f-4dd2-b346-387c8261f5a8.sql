-- Create rewards catalog table
CREATE TABLE public.rewards_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'gift',
  points_cost integer NOT NULL,
  icon text DEFAULT 'gift',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;

-- Policies for rewards catalog
CREATE POLICY "Everyone can view active rewards" 
ON public.rewards_catalog 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Managers can manage rewards" 
ON public.rewards_catalog 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

-- Create badge definitions table
CREATE TABLE public.badge_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  criteria_type text NOT NULL, -- 'points', 'sales', 'streak', etc.
  criteria_value integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- Policies for badge definitions
CREATE POLICY "Everyone can view active badges" 
ON public.badge_definitions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Managers can manage badge definitions" 
ON public.badge_definitions 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

-- Create employee badges table
CREATE TABLE public.employee_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badge_definitions(id),
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(employee_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.employee_badges ENABLE ROW LEVEL SECURITY;

-- Policies for employee badges
CREATE POLICY "Employees can view own badges" 
ON public.employee_badges 
FOR SELECT 
USING (employee_id::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can view all badges" 
ON public.employee_badges 
FOR SELECT 
USING (is_manager());

CREATE POLICY "System can insert badges" 
ON public.employee_badges 
FOR INSERT 
WITH CHECK (true);

-- Create employee feedback table
CREATE TABLE public.employee_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  from_employee_id uuid,
  feedback_type text NOT NULL DEFAULT 'peer', -- 'manager', 'peer', 'kudos'
  title text NOT NULL,
  message text NOT NULL,
  rating integer, -- 1-5 for manager feedback
  category text, -- 'performance', 'teamwork', etc.
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for employee feedback
CREATE POLICY "Employees can view own feedback" 
ON public.employee_feedback 
FOR SELECT 
USING (employee_id::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can manage all feedback" 
ON public.employee_feedback 
FOR ALL 
USING (is_manager())
WITH CHECK (is_manager());

CREATE POLICY "Employees can create peer feedback" 
ON public.employee_feedback 
FOR INSERT 
WITH CHECK (from_employee_id::text = current_setting('app.current_employee_id', true) AND feedback_type = 'peer');

-- Create triggers for updated_at
CREATE TRIGGER update_rewards_catalog_updated_at
BEFORE UPDATE ON public.rewards_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default rewards
INSERT INTO public.rewards_catalog (name, description, category, points_cost, icon) VALUES
('Δώρο €10', 'Δωροεπιταγή αξίας €10', 'cash', 100, 'euro'),
('Δώρο €25', 'Δωροεπιταγή αξίας €25', 'cash', 250, 'euro'),
('Δώρο €50', 'Δωροεπιταγή αξίας €50', 'cash', 500, 'euro'),
('Ημέρα Άδειας', 'Μια επιπλέον ημέρα άδειας', 'dayoff', 300, 'calendar'),
('Team Lunch', 'Γεύμα για όλη την ομάδα', 'team', 800, 'users'),
('Δώρο Έκπληξη', 'Δώρο έκπληξη από το κατάστημα', 'gift', 150, 'gift');

-- Insert some default badge definitions
INSERT INTO public.badge_definitions (name, description, icon, rarity, criteria_type, criteria_value) VALUES
('Πρώτα Βήματα', 'Κέρδισε τους πρώτους 100 πόντους', '🌟', 'common', 'points', 100),
('Συλλέκτης Πόντων', 'Κέρδισε 1000 πόντους συνολικά', '💎', 'rare', 'points', 1000),
('Θρύλος Πόντων', 'Κέρδισε 5000 πόντους συνολικά', '👑', 'legendary', 'points', 5000),
('Πρώτη Πώληση', 'Πραγματοποίησε την πρώτη σου πώληση', '🎯', 'common', 'sales', 1),
('Πωλητής του Μήνα', 'Πραγματοποίησε 50 πωλήσεις σε έναν μήνα', '🏆', 'epic', 'sales', 50),
('Συνεχής Βελτίωση', 'Κέρδισε πόντους για 7 συνεχόμενες ημέρες', '🔥', 'rare', 'streak', 7),
('Ομαδικό Πνεύμα', 'Λάβε 10 kudos από συναδέλφους', '🤝', 'rare', 'kudos', 10);