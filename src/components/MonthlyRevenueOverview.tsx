import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Users, Target, BarChart3, Edit2, Save, X } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  monthly_revenue_target: number;
  monthly_revenue_actual: number;
  position?: string;
  bonus_revenue_value?: number;
  bonus_revenue_type?: string;
}

interface MonthlyRevenueSummary {
  id: string;
  employee_id: string;
  year: number;
  month: number;
  total_revenues: number;
  weeks_count: number;
  days_count: number;
}

export function MonthlyRevenueOverview() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlyRevenueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  const monthNames = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ];

  // Generate year options (current year and previous 2 years)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 3 }, (_, i) => currentYear - i);
  };

  useEffect(() => {
    loadData();

    // Listen for revenue updates from other components
    const handleRevenueUpdate = () => {
      loadData();
    };

    window.addEventListener('revenueUpdated', handleRevenueUpdate);
    window.addEventListener('revenueTargetUpdated', handleRevenueUpdate);

    return () => {
      window.removeEventListener('revenueUpdated', handleRevenueUpdate);
      window.removeEventListener('revenueTargetUpdated', handleRevenueUpdate);
    };
  }, [selectedYear, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, monthly_revenue_target, monthly_revenue_actual, position, bonus_revenue_value, bonus_revenue_type')
        .eq('is_active', true)
        .order('full_name');

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Load monthly summaries for selected period
      const { data: summariesData, error: summariesError } = await supabase
        .from('monthly_revenue_summary')
        .select('*')
        .eq('year', parseInt(selectedYear))
        .eq('month', parseInt(selectedMonth))
        .order('total_revenues', { ascending: false });

      if (summariesError) throw summariesError;
      setMonthlySummaries(summariesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των δεδομένων",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressBadgeColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const handleEditRevenue = (employeeId: string, currentRevenue: number) => {
    setEditingEmployee(employeeId);
    setEditValue((currentRevenue / 100).toString()); // Convert from cents to euros
  };

  const handleSaveRevenue = async (employeeId: string) => {
    try {
      const actualAmount = parseFloat(editValue);
      if (isNaN(actualAmount) || actualAmount < 0) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Παρακαλώ εισάγετε έγκυρο ποσό",
        });
        return;
      }

      const actualInCents = Math.round(actualAmount * 100); // Convert euros to cents
      const { error } = await supabase
        .from('employees')
        .update({ 
          monthly_revenue_actual: actualInCents,
          manual_revenue_override: true
        })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: "Ο πραγματικός τζίρος ενημερώθηκε επιτυχώς.",
      });

      setEditingEmployee(null);
      setEditValue("");
      loadData();
      
      // Trigger refresh of other components
      window.dispatchEvent(new CustomEvent('revenueUpdated'));
    } catch (error) {
      console.error('Error updating revenue:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η ενημέρωση του τζίρου",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditValue("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  const yearOptions = getYearOptions();
  // Use employees table as source of truth for revenue calculations
  const totalRevenue = employees.reduce((sum, emp) => sum + emp.monthly_revenue_actual, 0);
  const totalTarget = employees.reduce((sum, emp) => sum + emp.monthly_revenue_target, 0);
  const overallProgress = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Μηνιαία Επισκόπηση Τζίρου
          </h1>
          <p className="text-muted-foreground">Παρακολούθηση μηνιαίων επιδόσεων τζίρου ανά εργαζόμενο</p>
        </div>

        {/* Period Selection */}
        <Card className="bg-card border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Επιλογή Περιόδου
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Έτος</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-muted border-urban-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Μήνας</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="bg-muted border-urban-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Summary */}
        <Card className="bg-card border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Συνολική Επίδοση - {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Συνολικός Στόχος</p>
                <p className="text-2xl font-bold">€{(totalTarget / 100).toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Συνολικός Τζίρος</p>
                <p className="text-2xl font-bold">€{(totalRevenue / 100).toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Συνολική Πρόοδος</p>
                <p className={`text-2xl font-bold ${getProgressColor(overallProgress)}`}>
                  {overallProgress.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mt-4">
              <div 
                className={`h-3 rounded-full transition-all ${
                  overallProgress >= 100 ? 'bg-green-500' :
                  overallProgress >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card className="bg-card border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Επίδοση ανά Εργαζόμενο
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Δεν βρέθηκαν εργαζόμενοι</p>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => {
                  const summary = monthlySummaries.find(s => s.employee_id === employee.id);
                  // Use employees table as source of truth for actual revenue
                  const actualRevenue = employee.monthly_revenue_actual;
                  const progress = getProgressPercentage(actualRevenue, employee.monthly_revenue_target);

                  return (
                    <Card key={employee.id} className="bg-muted/30 border-urban-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{employee.full_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {employee.position || "Εργαζόμενος"}
                              </p>
                            </div>
                          </div>
                          
                          <Badge className={getProgressBadgeColor(progress)}>
                            {progress.toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Στόχος Μήνα</p>
                            <p className="font-medium">€{(employee.monthly_revenue_target / 100).toFixed(2)}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground">Πραγματικός Τζίρος</p>
                            {editingEmployee === employee.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-8 text-sm flex-1"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleSaveRevenue(employee.id)}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="font-medium">€{(actualRevenue / 100).toFixed(2)}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditRevenue(employee.id, actualRevenue)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground">Bonus Τζίρου</p>
                            <p className="font-medium text-xs">
                              {employee.bonus_revenue_type === 'EUR' 
                                ? `€${employee.bonus_revenue_value || 0}`
                                : `${employee.bonus_revenue_value || 0} pts`
                              }
                            </p>
                          </div>
                        </div>

                        {summary && (
                          <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-muted-foreground">
                            <div>
                              <p>Εβδομαδιαίες καταχωρήσεις: {summary.weeks_count}</p>
                            </div>
                            <div>
                              <p>Ημερήσιες καταχωρήσεις: {summary.days_count}</p>
                            </div>
                          </div>
                        )}

                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              progress >= 100 ? 'bg-green-500' :
                              progress >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>

                        {!summary && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Δεν υπάρχουν καταχωρήσεις για αυτόν τον μήνα
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}