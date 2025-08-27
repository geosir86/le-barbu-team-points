import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Calendar, TrendingUp, DollarSign, Target, Award, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WeeklyData {
  currentWeek: {
    totalPoints: number;
    positiveEvents: number;
    negativeEvents: number;
    netPoints: number;
    salesAmount: number;
    customerReviews: number;
    averageRating: number;
  };
  previousWeek: {
    totalPoints: number;
    positiveEvents: number;
    negativeEvents: number;
    netPoints: number;
    salesAmount: number;
    customerReviews: number;
    averageRating: number;
  };
}

interface MonthlyData {
  currentMonth: {
    totalPoints: number;
    positiveEvents: number;
    negativeEvents: number;
    netPoints: number;
    salesAmount: number;
    customerReviews: number;
    averageRating: number;
    rewards: number;
    badges: number;
  };
  targetProgress: {
    pointsTarget: number;
    salesTarget: number;
    reviewsTarget: number;
  };
}

export function EmployeeReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [performanceBreakdown, setPerformanceBreakdown] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const employeeId = localStorage.getItem('currentEmployeeId');
      if (!employeeId) return;

      // Set RLS context
      await supabase.rpc('set_current_employee_id', { 
        employee_id: employeeId 
      });

      // Get current and previous week dates
      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Sunday

      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(currentWeekStart.getDate() - 7);
      const previousWeekEnd = new Date(previousWeekStart);
      previousWeekEnd.setDate(previousWeekStart.getDate() + 6);

      // Get current month dates
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Load current week events
      const { data: currentWeekEvents } = await supabase
        .from('employee_events')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('created_at', currentWeekStart.toISOString())
        .lte('created_at', currentWeekEnd.toISOString());

      // Load previous week events
      const { data: previousWeekEvents } = await supabase
        .from('employee_events')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('created_at', previousWeekStart.toISOString())
        .lte('created_at', previousWeekEnd.toISOString());

      // Load current month events
      const { data: currentMonthEvents } = await supabase
        .from('employee_events')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('created_at', currentMonthStart.toISOString())
        .lte('created_at', currentMonthEnd.toISOString());

      // Load weekly revenue
      const { data: weeklyRevenue } = await supabase
        .from('weekly_revenue')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('week_start_date', currentWeekStart.toISOString().split('T')[0]);

      // Load employee data for targets
      const { data: employee } = await supabase
        .from('employees')
        .select('monthly_revenue_target, monthly_revenue_actual')
        .eq('id', employeeId)
        .single();

      // Process current week data
      const currentWeekPositive = currentWeekEvents?.filter(e => e.points > 0) || [];
      const currentWeekNegative = currentWeekEvents?.filter(e => e.points < 0) || [];
      const currentWeekPoints = currentWeekEvents?.reduce((sum, e) => sum + e.points, 0) || 0;
      const currentWeekSales = weeklyRevenue?.[0]?.revenue_amount || 0;

      // Process previous week data
      const previousWeekPositive = previousWeekEvents?.filter(e => e.points > 0) || [];
      const previousWeekNegative = previousWeekEvents?.filter(e => e.points < 0) || [];
      const previousWeekPoints = previousWeekEvents?.reduce((sum, e) => sum + e.points, 0) || 0;

      // Process monthly data
      const monthlyPositive = currentMonthEvents?.filter(e => e.points > 0) || [];
      const monthlyNegative = currentMonthEvents?.filter(e => e.points < 0) || [];
      const monthlyPoints = currentMonthEvents?.reduce((sum, e) => sum + e.points, 0) || 0;

      // Calculate performance breakdown
      const performanceBreakdown = [
        { 
          category: "Πωλήσεις", 
          points: currentMonthEvents?.filter(e => e.event_type.includes('πώλησ') || e.event_type.includes('Πώλησ')).reduce((sum, e) => sum + e.points, 0) || 0,
          percentage: 0
        },
        { 
          category: "Customer Service", 
          points: currentMonthEvents?.filter(e => e.event_type.includes('Review') || e.event_type.includes('service')).reduce((sum, e) => sum + e.points, 0) || 0,
          percentage: 0
        },
        { 
          category: "Teamwork", 
          points: currentMonthEvents?.filter(e => e.event_type.includes('team') || e.event_type.includes('συνεργασία')).reduce((sum, e) => sum + e.points, 0) || 0,
          percentage: 0
        },
        { 
          category: "Προσέλευση", 
          points: currentMonthEvents?.filter(e => e.event_type.includes('προσέλευση') || e.event_type.includes('παρουσία')).reduce((sum, e) => sum + e.points, 0) || 0,
          percentage: 0
        }
      ];

      // Calculate percentages for breakdown
      const totalBreakdownPoints = performanceBreakdown.reduce((sum, item) => sum + item.points, 0);
      performanceBreakdown.forEach(item => {
        item.percentage = totalBreakdownPoints > 0 ? Math.round((item.points / totalBreakdownPoints) * 100) : 0;
      });

      // Monthly trend (for now using static data - would need historical data)
      const monthlyTrend = [
        { month: "Οκτ", points: 180 },
        { month: "Νοε", points: 220 },
        { month: "Δεκ", points: 195 },
        { month: "Ιαν", points: monthlyPoints }
      ];

      setWeeklyData({
        currentWeek: {
          totalPoints: Math.abs(currentWeekPoints),
          positiveEvents: currentWeekPositive.length,
          negativeEvents: currentWeekNegative.length,
          netPoints: currentWeekPoints,
          salesAmount: currentWeekSales / 100, // Convert cents to euros
          customerReviews: currentWeekPositive.filter(e => e.event_type.includes('Review')).length,
          averageRating: 4.5 // This would need to be calculated from actual review data
        },
        previousWeek: {
          totalPoints: Math.abs(previousWeekPoints),
          positiveEvents: previousWeekPositive.length,
          negativeEvents: previousWeekNegative.length,
          netPoints: previousWeekPoints,
          salesAmount: 0, // Would need previous week revenue data
          customerReviews: previousWeekPositive.filter(e => e.event_type.includes('Review')).length,
          averageRating: 4.3
        }
      });

      setMonthlyData({
        currentMonth: {
          totalPoints: Math.abs(monthlyPoints),
          positiveEvents: monthlyPositive.length,
          negativeEvents: monthlyNegative.length,
          netPoints: monthlyPoints,
          salesAmount: (employee?.monthly_revenue_actual || 0) / 100,
          customerReviews: monthlyPositive.filter(e => e.event_type.includes('Review')).length,
          averageRating: 4.6,
          rewards: 0, // Would need to count redemptions
          badges: 0 // Would need to count badges earned this month
        },
        targetProgress: {
          pointsTarget: 300,
          salesTarget: (employee?.monthly_revenue_target || 0) / 100,
          reviewsTarget: 10
        }
      });

      // Set the breakdown and trend data
      setPerformanceBreakdown(performanceBreakdown);
      setMonthlyTrend(monthlyTrend);

    } catch (error) {
      console.error('Error loading employee reports:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των αναφορών",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: "0", isPositive: true, icon: "—" };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
      icon: change >= 0 ? "↗️" : "↘️"
    };
  };

  if (loading || !weeklyData || !monthlyData) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Φόρτωση αναφορών...</p>
          </div>
        </div>
      </div>
    );
  }

  const weeklyChange = calculateChange(weeklyData.currentWeek.netPoints, weeklyData.previousWeek.netPoints);
  const salesChange = calculateChange(weeklyData.currentWeek.salesAmount, weeklyData.previousWeek.salesAmount);

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Αναφορές</h1>
            <p className="text-muted-foreground">Ανάλυση απόδοσης</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Period Tabs */}
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Εβδομαδιαία</TabsTrigger>
            <TabsTrigger value="monthly">Μηνιαία</TabsTrigger>
          </TabsList>

          {/* Weekly Report */}
          <TabsContent value="weekly" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">📊 Εβδομαδιαία Σύνοψη</h2>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-card border-urban-border">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-500">{weeklyData.currentWeek.netPoints}</p>
                  <p className="text-xs text-muted-foreground">Καθαροί Πόντοι</p>
                  <Badge className={`mt-1 ${weeklyChange.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {weeklyChange.icon} {weeklyChange.value}%
                  </Badge>
                </CardContent>
              </Card>
              <Card className="bg-gradient-card border-urban-border">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-500">€{weeklyData.currentWeek.salesAmount}</p>
                  <p className="text-xs text-muted-foreground">Πωλήσεις</p>
                  <Badge className={`mt-1 ${salesChange.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {salesChange.icon} {salesChange.value}%
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Events Summary */}
            <Card className="bg-gradient-card border-urban-border">
              <CardHeader>
                <CardTitle className="text-lg">📈 Συμβάντα Εβδομάδας</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Θετικά Συμβάντα</span>
                    <Badge className="bg-green-500/20 text-green-400">{weeklyData.currentWeek.positiveEvents}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Αρνητικά Συμβάντα</span>
                    <Badge className="bg-red-500/20 text-red-400">{weeklyData.currentWeek.negativeEvents}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Reviews</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{weeklyData.currentWeek.customerReviews}</Badge>
                      <span className="text-xs text-yellow-500">{weeklyData.currentWeek.averageRating}⭐</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Week Comparison */}
            <Card className="bg-gradient-card border-urban-border">
              <CardHeader>
                <CardTitle className="text-lg">📊 Σύγκριση με Προηγούμενη</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Αυτή η εβδομάδα</span>
                    <span className="font-bold text-primary">{weeklyData.currentWeek.netPoints} πόντοι</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Προηγούμενη εβδομάδα</span>
                    <span>{weeklyData.previousWeek.netPoints} πόντοι</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>Βελτίωση</span>
                      <span className={weeklyChange.isPositive ? 'text-green-500' : 'text-red-500'}>
                        {weeklyChange.icon} {weeklyChange.value}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Report */}
          <TabsContent value="monthly" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">📈 Μηνιαία Σύνοψη</h2>
            </div>

            {/* Monthly Overview */}
            <Card className="bg-gradient-card border-urban-border">
              <CardHeader>
                <CardTitle className="text-lg">🎯 Πρόοδος Στόχων</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Πόντοι Μήνα</span>
                    <span className="text-sm font-bold">{monthlyData.currentMonth.totalPoints}/{monthlyData.targetProgress.pointsTarget}</span>
                  </div>
                  <Progress value={(monthlyData.currentMonth.totalPoints / monthlyData.targetProgress.pointsTarget) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((monthlyData.currentMonth.totalPoints / monthlyData.targetProgress.pointsTarget) * 100).toFixed(0)}% ολοκληρώθηκε
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Στόχος Τζίρου</span>
                    <span className="text-sm font-bold">€{monthlyData.currentMonth.salesAmount}/€{monthlyData.targetProgress.salesTarget}</span>
                  </div>
                  <Progress value={(monthlyData.currentMonth.salesAmount / monthlyData.targetProgress.salesTarget) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((monthlyData.currentMonth.salesAmount / monthlyData.targetProgress.salesTarget) * 100).toFixed(0)}% ολοκληρώθηκε
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Customer Reviews</span>
                    <span className="text-sm font-bold">{monthlyData.currentMonth.customerReviews}/{monthlyData.targetProgress.reviewsTarget}</span>
                  </div>
                  <Progress value={(monthlyData.currentMonth.customerReviews / monthlyData.targetProgress.reviewsTarget) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((monthlyData.currentMonth.customerReviews / monthlyData.targetProgress.reviewsTarget) * 100).toFixed(0)}% ολοκληρώθηκε
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Breakdown */}
            <Card className="bg-gradient-card border-urban-border">
              <CardHeader>
                <CardTitle className="text-lg">🔍 Ανάλυση Απόδοσης</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {performanceBreakdown.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>{item.category}</span>
                      <span className="font-bold">{item.points} πόντοι ({item.percentage}%)</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="bg-gradient-card border-urban-border">
              <CardHeader>
                <CardTitle className="text-lg">📊 Τάση 4 Μηνών</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2 h-32">
                  {monthlyTrend.map((month, index) => {
                    const maxPoints = Math.max(...monthlyTrend.map(m => m.points));
                    const height = (month.points / maxPoints) * 100;
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-muted rounded-t-lg relative h-24 flex items-end">
                          <div 
                            className="w-full bg-gradient-gold rounded-t-lg transition-all duration-500"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <p className="text-xs mt-2 text-muted-foreground">{month.month}</p>
                        <p className="text-xs font-medium text-primary">{month.points}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Achievements This Month */}
            <Card className="bg-gradient-card border-urban-border">
              <CardHeader>
                <CardTitle className="text-lg">🏆 Επιτεύγματα Μήνα</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-xl font-bold text-yellow-500">{monthlyData.currentMonth.rewards}</p>
                    <p className="text-xs text-muted-foreground">Ανταμοιβές</p>
                  </div>
                  <div>
                    <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-xl font-bold text-blue-500">{monthlyData.currentMonth.badges}</p>
                    <p className="text-xs text-muted-foreground">Νέα Badges</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}