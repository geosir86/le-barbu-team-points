import bcrypt from 'bcryptjs';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useContextManager } from '@/hooks/useContextManager';

interface Employee {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date: string;
  is_active: boolean;
  points_balance: number;
  total_earned_points: number;
  monthly_revenue_target: number;
  monthly_revenue_actual: number;
  bonus_revenue_value?: number;
  bonus_revenue_type?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  userRole: 'manager' | 'employee' | null;
  currentEmployee: Employee | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkSession: () => boolean;
}

export function useAuth(): AuthState {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'manager' | 'employee' | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const { setManagerContext, setEmployeeContext, isManagerMode, clearContext } = useContextManager();

  // Helper function to set employee context for RLS with proper mode checking
  const setEmployeeContextSafe = async (employeeId: string | null) => {
    if (!employeeId) {
      console.log('🧹 Clearing context - no employee ID provided');
      clearContext();
      return;
    }

    // Only set employee context if we're not in manager mode
    if (isManagerMode()) {
      console.log('🛑 Blocked employee context - currently in manager mode');
      return;
    }

    console.log('👤 Setting employee context for:', employeeId);
    await setEmployeeContext(employeeId);
  };

  // Session timeout (4 hours)
  const SESSION_TIMEOUT = 4 * 60 * 60 * 1000;

  const checkSession = (): boolean => {
    const storedRole = localStorage.getItem('user-role');
    const storedEmployee = localStorage.getItem('current-employee');
    const loginTime = localStorage.getItem('login-time');
    
    if (storedRole && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      if (elapsed < SESSION_TIMEOUT) {
        setUserRole(storedRole as 'manager' | 'employee');
        if (storedEmployee && storedRole === 'employee') {
          setCurrentEmployee(JSON.parse(storedEmployee));
        } else {
          setCurrentEmployee(null);
        }
        setIsLoggedIn(true);
        
        // CRITICAL: Set proper context based on role (non-blocking)
        if (storedRole === 'employee' && storedEmployee) {
          const employee = JSON.parse(storedEmployee);
          setEmployeeContextSafe(employee.id);
        } else if (storedRole === 'manager') {
          // ALWAYS clear context for managers (non-blocking)
          setManagerContext();
        }
        
        return true;
      } else {
        logout();
        toast({
          title: "Η συνεδρία έληξε",
          description: "Παρακαλώ συνδεθείτε ξανά",
        });
      }
    }
    return false;
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Manager login
      if (username === 'admin' || username === 'manager') {
        const managerPassword = localStorage.getItem('manager-password') || 'manager123';
        if (password === managerPassword) {
          setUserRole('manager');
          setIsLoggedIn(true);
          setCurrentEmployee(null);
          localStorage.setItem('user-role', 'manager');
          localStorage.setItem('login-time', Date.now().toString());
          localStorage.removeItem('current-employee');
          
          // CRITICAL: Immediately clear employee context for manager
          await setManagerContext();
          
          toast({
            title: "Επιτυχής σύνδεση",
            description: "Καλώς ήρθατε Διαχειριστή!",
          });
          return { success: true };
        } else {
          return { success: false, error: 'Λάθος κωδικός διαχειριστή' };
        }
      }

      // Employee login
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return { success: false, error: 'Σφάλμα σύνδεσης με τη βάση δεδομένων' };
      }

      if (!employee) {
        return { success: false, error: 'Δεν βρέθηκε εργαζόμενος με αυτό το username' };
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, employee.password_hash);
      if (!passwordMatch) {
        return { success: false, error: 'Λάθος κωδικός πρόσβασης' };
      }

      // Successful login
      setUserRole('employee');
      setCurrentEmployee(employee);
      setIsLoggedIn(true);
      
      localStorage.setItem('user-role', 'employee');
      localStorage.setItem('current-employee', JSON.stringify(employee));
      localStorage.setItem('login-time', Date.now().toString());
      
      // Set employee context for RLS
      await setEmployeeContextSafe(employee.id);

      toast({
        title: "Επιτυχής σύνδεση",
        description: `Καλώς ήρθες ${employee.full_name}!`,
      });
      
      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Σφάλμα κατά τη σύνδεση' };
    }
  };

  const logout = () => {
    setUserRole(null);
    setCurrentEmployee(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user-role');
    localStorage.removeItem('current-employee');
    localStorage.removeItem('login-time');
    clearContext(); // Clear session mode tracking
    
    toast({
      title: "Αποσυνδέθηκατε επιτυχώς",
      description: "Ευχαριστούμε για τη χρήση του συστήματος",
    });
    
    // Force page refresh to ensure clean state and redirect to login
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Check session on mount and set up periodic checks
  useEffect(() => {
    checkSession();
    
    const interval = setInterval(() => {
      if (!checkSession() && isLoggedIn) {
        logout();
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  return {
    isLoggedIn,
    userRole,
    currentEmployee,
    login,
    logout,
    checkSession,
  };
}