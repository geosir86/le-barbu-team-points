import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useContextManager() {
  const setManagerContext = useCallback(async () => {
    try {
      console.log('🔧 Setting MANAGER context (clearing employee ID)');
      await supabase.rpc('set_current_employee_id', { employee_id: '' });
      
      // Store manager mode in sessionStorage to prevent other components from overriding
      sessionStorage.setItem('current_mode', 'manager');
      
      return true;
    } catch (error) {
      console.error('Failed to set manager context:', error);
      return false;
    }
  }, []);

  const setEmployeeContext = useCallback(async (employeeId: string) => {
    try {
      // Only set employee context if we're not in manager mode
      const currentMode = sessionStorage.getItem('current_mode');
      if (currentMode === 'manager') {
        console.log('🛑 Blocked employee context setting - in manager mode');
        return false;
      }

      console.log('👤 Setting EMPLOYEE context:', employeeId);
      await supabase.rpc('set_current_employee_id', { employee_id: employeeId });
      sessionStorage.setItem('current_mode', 'employee');
      
      return true;
    } catch (error) {
      console.error('Failed to set employee context:', error);
      return false;
    }
  }, []);

  const isManagerMode = useCallback(() => {
    return sessionStorage.getItem('current_mode') === 'manager';
  }, []);

  const isEmployeeMode = useCallback(() => {
    return sessionStorage.getItem('current_mode') === 'employee';
  }, []);

  const clearContext = useCallback(() => {
    sessionStorage.removeItem('current_mode');
  }, []);

  return {
    setManagerContext,
    setEmployeeContext,
    isManagerMode,
    isEmployeeMode,
    clearContext
  };
}