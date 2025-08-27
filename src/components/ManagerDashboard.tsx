import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  full_name: string;
  points_balance: number;
  rank: number;
}

interface RecentActivity {
  id: string;
  employee_name: string;
  event_type: string;
  points: number;
  created_at: string;
}

interface ManagerDashboardProps {
  onViewChange: (view: string) => void;
}

export function ManagerDashboard({ onViewChange }: ManagerDashboardProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPoints = employees.reduce((sum, emp) => sum + emp.points_balance, 0);
  const avgPoints = employees.length > 0 ? Math.round(totalPoints / employees.length) : 0;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, points_balance')
        .eq('is_active', true)
        .order('points_balance', { ascending: false });

      if (employeesError) throw employeesError;

      // Add rank to employees
      const rankedEmployees = employeesData?.map((emp, index) => ({
        ...emp,
        rank: index + 1
      })) || [];

      setEmployees(rankedEmployees);

      // Load recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('employee_events')
        .select(`
          id,
          event_type,
          points,
          created_at,
          employees!employee_events_employee_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (activityError) throw activityError;

      const formattedActivity = activityData?.map(activity => ({
        id: activity.id,
        employee_name: activity.employees?.full_name || 'Άγνωστος',
        event_type: activity.event_type,
        points: activity.points,
        created_at: activity.created_at
      })) || [];

      setRecentActivity(formattedActivity);

      // Count pending approvals
      const [employeeRequestsResult, rewardRedemptionsResult] = await Promise.all([
        supabase.from('employee_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('reward_redemptions').select('id', { count: 'exact' }).eq('status', 'pending')
      ]);

      const totalPending = (employeeRequestsResult.count || 0) + (rewardRedemptionsResult.count || 0);
      setPendingApprovals(totalPending);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto text-center">
          <div className="text-muted-foreground">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            LE BARBU
          </h1>
          <p className="text-muted-foreground">Dashboard Ιδιοκτήτη</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-primary mr-2" />
              </div>
              <p className="text-2xl font-bold text-primary">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Συνολικοί Πόντοι</p>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-6 w-6 text-secondary mr-2" />
              </div>
              <p className="text-2xl font-bold text-secondary">{avgPoints}</p>
              <p className="text-sm text-muted-foreground">Μέσος Όρος</p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Κατάταξη Μήνα
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employees.map((employee, index) => (
              <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={index === 0 ? "default" : "secondary"}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-gradient-gold text-primary-foreground animate-gold-glow" : ""
                    }`}
                  >
                    {employee.rank}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{employee.full_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{employee.points_balance}</p>
                  <p className="text-xs text-muted-foreground">πόντοι</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Γρήγορες Ενέργειες</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => onViewChange('add-event')}
              className="w-full bg-gradient-gold hover:bg-gradient-gold/90 text-primary-foreground font-medium"
            >
              Καταγραφή Συμβάντος
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => onViewChange('approvals')}
                variant="outline" 
                size="sm" 
                className="border-urban-border hover:bg-muted"
              >
                Εγκρίσεις
                {pendingApprovals > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {pendingApprovals}
                  </Badge>
                )}
              </Button>
              <Button 
                onClick={() => onViewChange('settings')}
                variant="outline" 
                size="sm" 
                className="border-urban-border hover:bg-muted"
              >
                Ρυθμίσεις
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Πρόσφατη Δραστηριότητα
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Δεν υπάρχει πρόσφατη δραστηριότητα
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span className="text-foreground">
                      {activity.employee_name} - {activity.event_type}
                    </span>
                    <span className={`font-medium ${
                      activity.points > 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      {activity.points > 0 ? '+' : ''}{activity.points} πόντοι
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}