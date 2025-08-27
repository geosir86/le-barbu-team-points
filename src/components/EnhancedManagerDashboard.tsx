import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Euro, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { KPIData, LeaderboardEntry, Alert } from '@/types/enhanced';

interface EnhancedManagerDashboardProps {
  onViewChange: (view: string) => void;
}

export function EnhancedManagerDashboard({ onViewChange }: EnhancedManagerDashboardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'positive' | 'negative' | 'sales'>('all');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Listen for revenue updates from other components
    const handleRevenueUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('revenueUpdated', handleRevenueUpdate);
    window.addEventListener('revenueTargetUpdated', handleRevenueUpdate);

    return () => {
      window.removeEventListener('revenueUpdated', handleRevenueUpdate);
      window.removeEventListener('revenueTargetUpdated', handleRevenueUpdate);
    };
  }, []);

  // Initialize expanded employees when leaderboard data loads
  useEffect(() => {
    if (leaderboard.length > 0 && expandedEmployees.size === 0) {
      setExpandedEmployees(new Set(leaderboard.map(entry => entry.user.id)));
    }
  }, [leaderboard, expandedEmployees.size]);

  const toggleEmployeeExpanded = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch real employees data
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      const employees = employeesData || [];

      // Calculate real KPI data
      const totalPoints = employees.reduce((sum, emp) => sum + emp.points_balance, 0);
      const avgPointsPerEmployee = employees.length > 0 ? Math.round(totalPoints / employees.length) : 0;
      
      const totalRevenueTarget = employees.reduce((sum, emp) => sum + emp.monthly_revenue_target, 0);
      const totalRevenueActual = employees.reduce((sum, emp) => sum + emp.monthly_revenue_actual, 0);
      const revenueProgress = totalRevenueTarget > 0 ? (totalRevenueActual / totalRevenueTarget) * 100 : 0;

      // Count pending approvals
      const { data: pendingRequests } = await supabase
        .from('employee_requests')
        .select('id')
        .eq('status', 'pending');

      const { data: pendingRedemptions } = await supabase
        .from('reward_redemptions')
        .select('id')
        .eq('status', 'pending');

      const pendingApprovals = (pendingRequests?.length || 0) + (pendingRedemptions?.length || 0);

      setKpiData({
        totalPoints,
        avgPointsPerEmployee,
        monthlyRevenue: {
          target: Math.round(totalRevenueTarget / 100), // Convert from cents to euros
          actual: Math.round(totalRevenueActual / 100), // Convert from cents to euros
          forecast: Math.round((totalRevenueActual * 1.15) / 100), // Simple forecast in euros
          variance: Math.round((totalRevenueActual - totalRevenueTarget) / 100), // Variance in euros
          progress: revenueProgress
        },
        pendingApprovals
      });

      // Create real leaderboard from employees
      const leaderboardEntries: LeaderboardEntry[] = employees
        .sort((a, b) => b.points_balance - a.points_balance)
        .slice(0, 10)
        .map((emp, index, array) => {
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (index < array.length - 1) {
            const nextEmp = array[index + 1];
            if (emp.points_balance > nextEmp.points_balance * 1.1) trend = 'up';
            else if (emp.points_balance < nextEmp.points_balance * 0.9) trend = 'down';
          }

          return {
            user: {
              id: emp.id,
              name: emp.full_name,
              email: emp.email || '',
              username: emp.username,
              role: 'Employee' as const,
              active: emp.is_active,
              monthly_points_target: 500, // Default target
              monthly_revenue_target: emp.monthly_revenue_target,
              monthly_revenue_actual: emp.monthly_revenue_actual,
              monthly_points_balance: emp.points_balance,
              created_at: emp.created_at,
              updated_at: emp.updated_at
            },
            points: emp.points_balance,
            revenue: Math.round(emp.monthly_revenue_actual / 100), // Convert from cents to euros
            trend
          };
        });

      setLeaderboard(leaderboardEntries);

      // Check for real alerts based on data
      const alertsList: Alert[] = [];
      
      // Check for employees with zero sales
      employees.forEach(emp => {
        if (emp.monthly_revenue_actual === 0 && emp.monthly_revenue_target > 0) {
          alertsList.push({
            id: `zero-sales-${emp.id}`,
            type: 'zero_sales',
            user_id: emp.id,
            message: `${emp.full_name}: Χωρίς πωλήσεις αυτό το μήνα`,
            severity: 'high',
            created_at: new Date().toISOString()
          });
        }

        // Check for goal achievement
        const progressPercent = emp.monthly_revenue_target > 0 
          ? (emp.monthly_revenue_actual / emp.monthly_revenue_target) * 100 
          : 0;
        
        if (progressPercent >= 80 && progressPercent < 100) {
          alertsList.push({
            id: `goal-80-${emp.id}`,
            type: 'goal_80',
            user_id: emp.id,
            message: `${emp.full_name}: Έφτασε στο 80% του στόχου`,
            severity: 'medium',
            created_at: new Date().toISOString()
          });
        }
      });

      setAlerts(alertsList);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των δεδομένων dashboard",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-30 p-4 border-b">
        <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
        <p className="text-muted-foreground">Manager Overview</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Zone 1: KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('totalPoints')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData?.totalPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {t('monthlyPoints')}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('avgPointsPerEmployee')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData?.avgPointsPerEmployee}</div>
              <p className="text-xs text-muted-foreground">
                <Users className="h-3 w-3 inline mr-1" />
                {leaderboard.length} {t('employees')}
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('monthlyRevenue')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('target')}: €{kpiData?.monthlyRevenue.target.toLocaleString()}</span>
                <span className="text-sm font-medium">
                  {kpiData?.monthlyRevenue.progress.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={kpiData?.monthlyRevenue.progress} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('actual')}: €{kpiData?.monthlyRevenue.actual.toLocaleString()}</span>
                <span>{t('forecast')}: €{kpiData?.monthlyRevenue.forecast.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone 2: Team Performance */}
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Απόδοση Ομάδας
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">{t('leaderboard')}</h4>
              {leaderboard.map((entry, index) => {
                const revenueProgress = (entry.revenue / (entry.user.monthly_revenue_target / 100)) * 100; // Convert target from cents to euros
                const pointsProgress = (entry.user.monthly_points_balance / entry.user.monthly_points_target) * 100;
                const isExpanded = expandedEmployees.has(entry.user.id);
                
                return (
                  <div key={entry.user.id} className="rounded-lg bg-muted/50">
                    {/* Employee Header */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{entry.user.name}</p>
                            <button
                              onClick={() => toggleEmployeeExpanded(entry.user.id)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{entry.points} Πόντοι</span>
                            <span>Τζίρος €{entry.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      {getTrendIcon(entry.trend)}
                    </div>
                    
                    {/* Expandable Progress Bars */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-muted pt-3">
                        {/* Points Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Πρόοδος Πόντων</span>
                            <span>{pointsProgress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${getProgressColor(pointsProgress)}`}
                              style={{ width: `${Math.min(pointsProgress, 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Revenue Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Πρόοδος Τζίρου</span>
                            <span>{revenueProgress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${getProgressColor(revenueProgress)}`}
                              style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Zone 3: Activity & Alerts */}
        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activityFilter} onValueChange={(v) => setActivityFilter(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">{t('allEvents')}</TabsTrigger>
                <TabsTrigger value="positive">{t('positive')}</TabsTrigger>
                <TabsTrigger value="negative">{t('negative')}</TabsTrigger>
                <TabsTrigger value="sales">{t('sales')}</TabsTrigger>
              </TabsList>
              <TabsContent value={activityFilter} className="mt-4">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Recent events will be displayed here
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="animate-fade-in border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <AlertTriangle className="h-5 w-5" />
                {t('alerts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                  <span className="text-sm">{alert.message}</span>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-16 flex flex-col gap-2"
            onClick={() => onViewChange('add-event')}
          >
            <Zap className="h-5 w-5" />
            <span className="text-xs">{t('recordEvent')}</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col gap-2"
            onClick={() => onViewChange('approvals')}
          >
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs">{t('bulkApproval')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}