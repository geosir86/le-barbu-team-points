import { useState, useEffect } from "react";
import { BarChart3, Calendar, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  points: number;
  revenue: number;
  eventCount: number;
}

interface MonthlySummary {
  points: number;
  revenue: number;
  eventCount: number;
  target: number;
}

export function EmployeeReportsReal() {
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentEmployee } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReportsData();
  }, [currentEmployee?.id]);

  const loadReportsData = async () => {
    if (!currentEmployee?.id) return;

    try {
      setLoading(true);
      await Promise.all([
        loadWeeklyData(),
        loadMonthlyData()
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των αναφορών",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyData = async () => {
    if (!currentEmployee?.id) return;

    const weeklyData: WeeklySummary[] = [];
    
    // Get last 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() - 1) - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Get events for this week
      const { data: events } = await supabase
        .from('employee_events')
        .select('points')
        .eq('employee_id', currentEmployee.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      // Get revenue for this week
      const { data: revenue } = await supabase
        .from('weekly_revenue')
        .select('revenue_amount')
        .eq('employee_id', currentEmployee.id)
        .eq('week_start_date', weekStart.toISOString().split('T')[0]);

      // Get daily revenue for this week
      const { data: dailyRevenue } = await supabase
        .from('daily_revenue')
        .select('revenue_amount')
        .eq('employee_id', currentEmployee.id)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0]);

      const totalPoints = events?.reduce((sum, event) => sum + (event.points || 0), 0) || 0;
      const weeklyRev = revenue?.[0]?.revenue_amount || 0;
      const dailyRev = dailyRevenue?.reduce((sum, day) => sum + (day.revenue_amount || 0), 0) || 0;

      weeklyData.push({
        weekStart: weekStart.toLocaleDateString('el-GR'),
        weekEnd: weekEnd.toLocaleDateString('el-GR'),
        points: Math.max(0, totalPoints), // Only positive points for display
        revenue: weeklyRev + dailyRev,
        eventCount: events?.length || 0
      });
    }

    setWeeklySummaries(weeklyData.reverse());
  };

  const loadMonthlyData = async () => {
    if (!currentEmployee?.id) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);

    // Get events for this month
    const { data: events } = await supabase
      .from('employee_events')
      .select('points')
      .eq('employee_id', currentEmployee.id)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString());

    // Get monthly summary
    const { data: summary } = await supabase
      .from('monthly_revenue_summary')
      .select('total_revenues')
      .eq('employee_id', currentEmployee.id)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .single();

    const totalPoints = events?.reduce((sum, event) => sum + (event.points || 0), 0) || 0;
    const totalRevenue = summary?.total_revenues || currentEmployee.monthly_revenue_actual || 0;
    const target = currentEmployee.monthly_revenue_target || 0;

    setMonthlySummary({
      points: Math.max(0, totalPoints),
      revenue: totalRevenue,
      eventCount: events?.length || 0,
      target
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('el-GR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Αναφορές
          </h1>
          <p className="text-muted-foreground">Η απόδοσή σου αυτό το μήνα</p>
        </div>

        {/* Monthly Summary */}
        {monthlySummary && (
          <Card className="bg-card border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Μηνιαία Σύνοψη - {currentMonth}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{monthlySummary.points}</p>
                  <p className="text-sm text-muted-foreground">Πόντοι</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">€{(monthlySummary.revenue / 100).toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Τζίρος</p>
                </div>
              </div>

              {monthlySummary.target > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Στόχος Τζίρου</span>
                    <span>{Math.round((monthlySummary.revenue / monthlySummary.target) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(monthlySummary.revenue / monthlySummary.target) * 100} 
                    className="h-2" 
                  />
                </div>
              )}

              <div className="flex justify-center">
                <Badge variant="outline">
                  {monthlySummary.eventCount} συμβάντα αυτό το μήνα
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Reports */}
        <Card className="bg-card border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Εβδομαδιαίες Αναφορές
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklySummaries.map((week, index) => (
              <Card key={index} className="bg-muted/30 border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-sm">
                        Εβδομάδα {4 - index}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {week.weekStart} - {week.weekEnd}
                      </p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-lg font-bold text-primary">{week.points}</p>
                      <p className="text-xs text-muted-foreground">Πόντοι</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-accent">€{(week.revenue / 100).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Τζίρος</p>
                    </div>
                  </div>

                  {week.eventCount > 0 && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {week.eventCount} συμβάντα
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {weeklySummaries.every(week => week.points === 0 && week.revenue === 0) && (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Δεν υπάρχουν δεδομένα για τις τελευταίες εβδομάδες</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}