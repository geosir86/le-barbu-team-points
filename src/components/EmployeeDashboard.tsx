import { useState, useEffect } from "react";
import { Target, TrendingUp, Calendar, Award, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useContextManager } from "@/hooks/useContextManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmployeeNavigation } from "@/components/employee/EmployeeNavigation";
import { EmployeeNotifications } from "@/components/employee/EmployeeNotifications";
import { Rewards } from "@/components/Rewards";
import { EmployeeRevenueBonus } from "@/components/employee/EmployeeRevenueBonus";
import { EmployeeReportsReal } from "@/components/employee/EmployeeReportsReal";
import { useNotifications } from "@/hooks/useNotifications";
import { useRewardsBadge } from "@/hooks/useRewardsBadge";
import { FloatingActionButton } from "./employee/FloatingActionButton";
import { EmployeeProfile } from "./employee/EmployeeProfile";
import { EmployeeEventsScreen } from "./employee/EmployeeEventsScreen";

interface EmployeeEvent {
  id: string;
  event_type: string;
  points: number;
  created_at: string;
  description?: string;
}

interface LeaderboardEntry {
  id: string;
  full_name: string;
  points_balance: number;
}

export function EmployeeDashboard() {
  const { currentEmployee } = useAuth();
  const { setEmployeeContext, isManagerMode } = useContextManager();
  const { toast } = useToast();
  const { notifications, unreadCount } = useNotifications();
  const { rewardsBadgeCount, refreshRewardsBadge } = useRewardsBadge();
  const [recentEvents, setRecentEvents] = useState<EmployeeEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [storeName, setStoreName] = useState<string>('Urban Lines');
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('employee-dashboard');
  const [showFab, setShowFab] = useState(true);
  const [employeeData, setEmployeeData] = useState<any>(null);

  const pointsToEuro = 0.1; // 10 points = 1€

  const fetchEmployeeData = async () => {
    if (!currentEmployee?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Only set employee context if not in manager mode
      if (!isManagerMode() && currentEmployee?.id) {
        console.log('🎯 EmployeeDashboard: Setting employee context');
        await setEmployeeContext(currentEmployee.id);
      } else if (isManagerMode()) {
        console.log('🚫 EmployeeDashboard: Blocked - in manager mode');
        return;
      }

      // Fetch fresh employee data to get current points and revenue
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', currentEmployee.id)
        .single();

      if (employeeError) throw employeeError;

      // Store employee data in local state for real-time updates
      if (employeeData) {
        setEmployeeData(employeeData);

        // Fetch store name if employee has store_id
        if (employeeData.store_id) {
          const { data: storeData } = await supabase
            .from('stores')
            .select('name')
            .eq('id', employeeData.store_id)
            .single();
          
          if (storeData?.name) {
            setStoreName(storeData.name);
          }
        }
      }

      // Fetch recent events for this employee
      const { data: eventsData, error: eventsError } = await supabase
        .from('employee_events')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError && eventsError.code !== 'PGRST116') throw eventsError;
      setRecentEvents(eventsData || []);

      // Fetch leaderboard (top employees by points)
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('employees')
        .select('id, full_name, points_balance')
        .eq('is_active', true)
        .order('points_balance', { ascending: false })
        .limit(10);

      if (leaderboardError) throw leaderboardError;
      setLeaderboard(leaderboardData || []);

    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των δεδομένων",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();

    // Set up real-time subscriptions
    const channel = supabase
      .channel('employee-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'employees',
          filter: `id=eq.${currentEmployee?.id}`
        },
        () => {
          fetchEmployeeData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_events',
          filter: `employee_id=eq.${currentEmployee?.id}`
        },
        () => {
          fetchEmployeeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEmployee?.id]);

  if (!currentEmployee) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Παρακαλώ συνδεθείτε ως εργαζόμενος για να δείτε το dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-lg w-3/4 mx-auto"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Use employeeData if available, fallback to currentEmployee
  const currentEmployeeData = employeeData || currentEmployee;
  const currentPoints = currentEmployeeData?.points_balance || 0;
  const monthlyTarget = 350; // Updated target (3500/10)
  const salesTargetCents = currentEmployeeData?.monthly_revenue_target || 0;
  const currentSalesCents = currentEmployeeData?.monthly_revenue_actual || 0;
  const salesTarget = salesTargetCents / 100; // Convert cents to euros for display
  const currentSales = currentSalesCents / 100; // Convert cents to euros for display
  
  const progressPercentage = (currentPoints / monthlyTarget) * 100;
  const salesProgressPercentage = salesTargetCents > 0 ? (currentSalesCents / salesTargetCents) * 100 : 0;
  const pointsInEuros = (currentPoints * pointsToEuro).toFixed(2);

  // Find current employee's rank
  const currentEmployeeRank = leaderboard.findIndex(emp => emp.id === (currentEmployeeData?.id || currentEmployee?.id)) + 1 || 1;

  // Calculate daily points from recent events (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  const dailyPoints = last7Days.map((date) => {
    const dayEvents = recentEvents.filter(event => {
      const eventDate = new Date(event.created_at);
      return eventDate.toDateString() === date.toDateString();
    });
    const totalPoints = dayEvents.reduce((sum, event) => sum + event.points, 0);
    
    return {
      day: date.toLocaleDateString('el-GR', { weekday: 'short' }),
      points: Math.max(0, totalPoints) // Show only positive for chart
    };
  });

  const maxDailyPoints = Math.max(...dailyPoints.map(d => d.points), 1);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  // Render different views based on currentView
  if (currentView !== 'employee-dashboard') {
    let ViewComponent = null;
    
    switch (currentView) {
      case 'employee-notifications':
        ViewComponent = EmployeeNotifications;
        break;
      case 'employee-rewards':
        ViewComponent = Rewards;
        break;
      case 'events':
        ViewComponent = EmployeeEventsScreen;
        break;
      case 'employee-profile':
        ViewComponent = EmployeeProfile;
        break;
      default:
        ViewComponent = null;
    }

    if (ViewComponent) {
      return (
        <>
          <ViewComponent />
          {currentView !== 'employee-profile' && (
            <FloatingActionButton 
              onRewardRedeem={() => {
                setCurrentView("employee-rewards");
                refreshRewardsBadge();
              }}
              onRequestSubmit={() => {
                refreshRewardsBadge();
              }}
            />
          )}
        <EmployeeNavigation
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        </>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            {storeName}
          </h1>
          <p className="text-muted-foreground">Καλώς ήρθες, {(currentEmployeeData?.full_name || currentEmployee?.full_name || '').split(' ')[0]}!</p>
        </div>

        {/* Current Points Card */}
        <Card className="bg-card border shadow-card">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Badge className="bg-primary text-primary-foreground font-bold px-4 py-2 text-lg">
                #{currentEmployeeRank} από {leaderboard.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary mb-1">{currentPoints}</p>
                <p className="text-xs text-muted-foreground">Πόντοι Μήνα</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent mb-1">{pointsInEuros}€</p>
                <p className="text-xs text-muted-foreground">Ισοτιμία</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Points Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Στόχος Πόντων: {monthlyTarget}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              {/* Sales Progress */}
              {salesTarget > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span>Στόχος Τζίρου: {salesTarget.toFixed(0)}€</span>
                     <span>{Math.round(salesProgressPercentage)}%</span>
                   </div>
                   <Progress value={salesProgressPercentage} className="h-2" />
                   <p className="text-xs text-muted-foreground">
                     {salesTarget > currentSales 
                       ? `Απομένουν ${(salesTarget - currentSales).toFixed(0)}€ για τον στόχο!`
                       : `Συγχαρητήρια! Ξεπέρασες τον στόχο κατά ${(currentSales - salesTarget).toFixed(0)}€!`
                     }
                  </p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">Δεν έχει οριστεί στόχος τζίρου</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Bonus Card */}
        <EmployeeRevenueBonus />

        {/* Daily Trend Chart */}
        <Card className="bg-card border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Εβδομαδιαία Πορεία
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {dailyPoints.map((day, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-muted rounded-t-lg relative h-24 flex items-end">
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-primary/80 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(day.points / maxDailyPoints) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">{day.day}</p>
                  <p className="text-xs font-medium text-primary">{day.points}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <Card className="bg-card border shadow-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewChange('events')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" />
              Πρόσφατες Ενέργειες
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">Δεν υπάρχουν πρόσφατες ενέργειες</p>
              </div>
            ) : (
              recentEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.event_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString('el-GR')} - {new Date(event.created_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge 
                    variant={event.points >= 0 ? "default" : "destructive"}
                    className={event.points >= 0 ? "bg-primary text-primary-foreground" : ""}
                  >
                    {event.points >= 0 ? "+" : ""}{event.points} πόντοι
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Motivational Messages & Goals */}
        <div className="grid grid-cols-1 gap-4">
          {progressPercentage >= 80 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-primary text-center">🔥 Εξαιρετική πρόοδος! Συνέχισε έτσι!</p>
              </CardContent>
            </Card>
          )}
          
          {salesProgressPercentage >= 90 && (
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-accent text-center">💰 Σχεδόν στον στόχο τζίρου! +50% bonus περιμένει!</p>
              </CardContent>
            </Card>
          )}
          
          {progressPercentage < 50 && salesProgressPercentage < 50 && (
            <Card className="bg-orange-500/10 border-orange-500/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-orange-600 text-center">⚡ Ας δώσουμε τα πάντα αυτό το μήνα!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mini Leaderboard */}
        <Card className="bg-card border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Mini Κατάταξη
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((employee, index) => (
                <div 
                  key={employee.id} 
                  className={`flex items-center justify-between p-2 rounded ${
                    employee.id === (currentEmployeeData?.id || currentEmployee?.id) ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={index === 0 && employee.id === (currentEmployeeData?.id || currentEmployee?.id) ? "bg-primary text-primary-foreground" : ""}
                      variant={employee.id === (currentEmployeeData?.id || currentEmployee?.id) ? "default" : "outline"}
                    >
                      #{index + 1}
                    </Badge>
                    <span className={`${employee.id === currentEmployee.id ? 'font-medium' : ''}`}>
                      {employee.id === currentEmployee.id ? `Εσύ (${employee.full_name.split(' ')[0]})` : employee.full_name.split(' ')[0]}
                    </span>
                  </div>
                  <span className={`${employee.id === currentEmployee.id ? 'font-bold text-primary' : ''}`}>
                    {employee.points_balance} πόντοι
                  </span>
                </div>
              ))}
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  Δες όλη την κατάταξη
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Navigation and FAB for dashboard view */}
      <EmployeeNavigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
      />
      
      {/* Floating Action Button */}
      <FloatingActionButton 
        onRewardRedeem={() => {
          setCurrentView('employee-rewards');
          refreshRewardsBadge();
        }}
        onRequestSubmit={() => {
          refreshRewardsBadge();
        }}
      />
    </div>
  );
}