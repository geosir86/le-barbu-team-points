-- Create stores table
CREATE TABLE public.stores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    monthly_goal INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create policies for stores
CREATE POLICY "Managers can manage all stores" 
ON public.stores 
FOR ALL 
USING (public.is_manager())
WITH CHECK (public.is_manager());

CREATE POLICY "Employees can view all stores" 
ON public.stores 
FOR SELECT 
USING (true);

-- Add store_id column to employees table
ALTER TABLE public.employees ADD COLUMN store_id UUID REFERENCES public.stores(id);

-- Create notifications table for manager notifications
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by TEXT DEFAULT 'manager'
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Employees can view own notifications" 
ON public.notifications 
FOR SELECT 
USING ((employee_id)::text = current_setting('app.current_employee_id', true));

CREATE POLICY "Managers can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- Create trigger for stores updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample stores
INSERT INTO public.stores (name, location, monthly_goal) VALUES 
('Κεντρικό Κατάστημα', 'Αθήνα', 10000),
('Κατάστημα Θεσσαλονίκης', 'Θεσσαλονίκη', 8000),
('Κατάστημα Πάτρας', 'Πάτρα', 6000);