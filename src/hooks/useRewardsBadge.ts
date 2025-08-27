import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useRewardsBadge() {
  const [rewardsBadgeCount, setRewardsBadgeCount] = useState(0);
  const { currentEmployee } = useAuth();

  useEffect(() => {
    if (currentEmployee?.id) {
      loadRewardsBadgeCount();
    }
  }, [currentEmployee?.id]);

  const loadRewardsBadgeCount = async () => {
    if (!currentEmployee?.id) return;

    try {
      const userPoints = currentEmployee.points_balance || 0;
      
      // Count available rewards (points_cost <= user_points)
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards_catalog')
        .select('points_cost')
        .eq('is_active', true)
        .lte('points_cost', userPoints);

      if (rewardsError) throw rewardsError;

      // Check if bonus is available (revenue >= target and no pending/approved request)
      let bonusAvailable = 0;
      if (currentEmployee.monthly_revenue_target && 
          currentEmployee.monthly_revenue_actual >= currentEmployee.monthly_revenue_target &&
          currentEmployee.bonus_revenue_value > 0) {
        
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const { data: bonusRequest, error: bonusError } = await supabase
          .from('bonus_requests')
          .select('id')
          .eq('employee_id', currentEmployee.id)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .in('status', ['pending', 'approved'])
          .single();

        if (bonusError && bonusError.code !== 'PGRST116') throw bonusError;
        
        if (!bonusRequest) {
          bonusAvailable = 1;
        }
      }

      const availableRewards = rewards?.length || 0;
      setRewardsBadgeCount(availableRewards + bonusAvailable);
      
    } catch (error) {
      console.error('Error loading rewards badge count:', error);
      setRewardsBadgeCount(0);
    }
  };

  return { rewardsBadgeCount, refreshRewardsBadge: loadRewardsBadgeCount };
}