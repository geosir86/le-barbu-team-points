-- Create employees table for employee management
CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    points_balance INTEGER NOT NULL DEFAULT 0,
    total_earned_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Managers can see and manage all employees
CREATE POLICY "Managers can manage all employees"
ON public.employees 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Create events table for tracking employee activities
CREATE TABLE public.employee_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    notes TEXT,
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.employee_events ENABLE ROW LEVEL SECURITY;

-- Employees can only see their own events
CREATE POLICY "Employees can view own events"
ON public.employee_events 
FOR SELECT 
TO authenticated 
USING (employee_id::text = current_setting('app.current_employee_id', true));

-- Managers can see and create all events
CREATE POLICY "Managers can manage all events"
ON public.employee_events 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Create rewards redemptions table
CREATE TABLE public.reward_redemptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    reward_name TEXT NOT NULL,
    points_cost INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    notes TEXT
);

-- Enable RLS on redemptions
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Employees can view their own redemptions
CREATE POLICY "Employees can view own redemptions"
ON public.reward_redemptions 
FOR SELECT 
TO authenticated 
USING (employee_id::text = current_setting('app.current_employee_id', true));

-- Employees can create redemptions for themselves
CREATE POLICY "Employees can create own redemptions"
ON public.reward_redemptions 
FOR INSERT 
TO authenticated 
WITH CHECK (employee_id::text = current_setting('app.current_employee_id', true));

-- Managers can manage all redemptions
CREATE POLICY "Managers can manage all redemptions"
ON public.reward_redemptions 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Function to update employee points
CREATE OR REPLACE FUNCTION public.update_employee_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update employee's points balance and total earned
    UPDATE public.employees 
    SET 
        points_balance = points_balance + NEW.points,
        total_earned_points = CASE 
            WHEN NEW.points > 0 THEN total_earned_points + NEW.points 
            ELSE total_earned_points 
        END,
        updated_at = now()
    WHERE id = NEW.employee_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update points when events are added
CREATE TRIGGER update_employee_points_trigger
    AFTER INSERT ON public.employee_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_employee_points();

-- Function to handle reward redemptions
CREATE OR REPLACE FUNCTION public.process_reward_redemption()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct points from employee when redemption is created
    UPDATE public.employees 
    SET 
        points_balance = points_balance - NEW.points_cost,
        updated_at = now()
    WHERE id = NEW.employee_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for reward redemptions
CREATE TRIGGER process_reward_redemption_trigger
    AFTER INSERT ON public.reward_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION public.process_reward_redemption();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employees table
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();