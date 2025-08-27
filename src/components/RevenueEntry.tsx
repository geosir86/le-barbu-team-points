import { useState, useEffect } from "react";
import { Calendar, Euro, Save, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  full_name: string;
  monthly_revenue_target: number;
  monthly_revenue_actual: number;
}

interface WeeklyRevenueEntry {
  id: string;
  employee_id: string;
  week_start_date: string;
  revenue_amount: number;
}

interface DailyRevenueEntry {
  id: string;
  employee_id: string;
  date: string;
  revenue_amount: number;
}

export function RevenueEntry() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [revenueAmount, setRevenueAmount] = useState<string>("");
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyRevenueEntry[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyRevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("week");
  const { toast } = useToast();

  // Get current week start date (Monday)
  const getCurrentWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  // Get current date
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get last 4 weeks for selection
  const getWeekOptions = () => {
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      weeks.push({
        value: monday.toISOString().split('T')[0],
        label: `${monday.toLocaleDateString('el-GR')} - ${sunday.toLocaleDateString('el-GR')}`,
        isCurrent: i === 0
      });
    }
    return weeks;
  };

  // Get last 30 days for selection
  const getDayOptions = () => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('el-GR'),
        isCurrent: i === 0
      });
    }
    return days;
  };

  useEffect(() => {
    loadData();
    setSelectedWeek(getCurrentWeekStart());
    setSelectedDate(getCurrentDate());
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, monthly_revenue_target, monthly_revenue_actual')
        .eq('is_active', true)
        .order('full_name');

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Load existing weekly entries for current month
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_revenue')
        .select('*')
        .gte('week_start_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
        .order('week_start_date', { ascending: false });

      if (weeklyError) throw weeklyError;
      setWeeklyEntries(weeklyData || []);

      // Load existing daily entries for current month
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_revenue')
        .select('*')
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (dailyError) throw dailyError;
      setDailyEntries(dailyData || []);

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

  const handleSubmit = async () => {
    const amount = parseFloat(revenueAmount);
    const isWeekly = activeTab === "week";
    const isDaily = activeTab === "day";
    const period = isWeekly ? selectedWeek : selectedDate;

    if (!selectedEmployee || !period || !revenueAmount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
      });
      return;
    }

    try {
      const employee = employees.find(e => e.id === selectedEmployee);
      if (!employee) return;

      const revenueInCents = Math.round(amount * 100);

      if (isWeekly) {
        // Insert or update weekly revenue
        const { error } = await supabase
          .from('weekly_revenue')
          .upsert({
            employee_id: selectedEmployee,
            week_start_date: selectedWeek,
            revenue_amount: revenueInCents
          }, {
            onConflict: 'employee_id,week_start_date'
          });

        if (error) throw error;
      } else if (isDaily) {
        // Insert or update daily revenue
        const { error } = await supabase
          .from('daily_revenue')
          .upsert({
            employee_id: selectedEmployee,
            date: selectedDate,
            revenue_amount: revenueInCents
          }, {
            onConflict: 'employee_id,date'
          });

        if (error) throw error;
      }

      toast({
        title: "Επιτυχία!",
        description: `Καταχωρίστηκε τζίρος €${amount.toFixed(2)} για ${employee.full_name}`,
      });

      // Reset form and reload data
      setSelectedEmployee("");
      setRevenueAmount("");
      loadData();

    } catch (error) {
      console.error('Error saving revenue:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποθήκευση του τζίρου",
      });
    }
  };

  const getExistingWeeklyEntry = (employeeId: string, weekStart: string) => {
    return weeklyEntries.find(entry => 
      entry.employee_id === employeeId && entry.week_start_date === weekStart
    );
  };

  const getExistingDailyEntry = (employeeId: string, date: string) => {
    return dailyEntries.find(entry => 
      entry.employee_id === employeeId && entry.date === date
    );
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

  const weekOptions = getWeekOptions();
  const dayOptions = getDayOptions();
  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);
  const existingWeeklyEntry = selectedEmployee && selectedWeek ? 
    getExistingWeeklyEntry(selectedEmployee, selectedWeek) : null;
  const existingDailyEntry = selectedEmployee && selectedDate ? 
    getExistingDailyEntry(selectedEmployee, selectedDate) : null;

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Καταχώρηση Τζίρου
          </h1>
          <p className="text-muted-foreground">Καταχώρηση τζίρου ανά ημέρα, εβδομάδα ή μήνα</p>
        </div>

        {/* Main Form */}
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Euro className="h-5 w-5 text-primary" />
              Νέα Καταχώρηση
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Εργαζόμενος
              </Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="bg-muted border-urban-border">
                  <SelectValue placeholder="Επιλέξτε εργαζόμενο..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Selection Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="day">Ημέρα</TabsTrigger>
                <TabsTrigger value="week">Εβδομάδα</TabsTrigger>
              </TabsList>
              
              <TabsContent value="day" className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ημερομηνία
                </Label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="bg-muted border-urban-border">
                    <SelectValue placeholder="Επιλέξτε ημερομηνία..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label} {day.isCurrent && "(Σήμερα)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              
              <TabsContent value="week" className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Εβδομάδα
                </Label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="bg-muted border-urban-border">
                    <SelectValue placeholder="Επιλέξτε εβδομάδα..." />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map((week) => (
                      <SelectItem key={week.value} value={week.value}>
                        {week.label} {week.isCurrent && "(Τρέχουσα)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>

            {/* Revenue Amount */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ποσό Τζίρου (€)
              </Label>
              <Input
                type="number"
                value={revenueAmount}
                onChange={(e) => setRevenueAmount(e.target.value)}
                placeholder="Εισάγετε ποσό τζίρου..."
                className="bg-muted border-urban-border"
                min="0"
                step="0.01"
              />
            </div>

            {/* Show existing entry if found */}
            {((activeTab === "week" && existingWeeklyEntry) || (activeTab === "day" && existingDailyEntry)) && (
              <div className="p-3 bg-muted/50 rounded-lg border border-urban-border">
                <p className="text-sm text-muted-foreground">
                  Υπάρχει καταχώρηση: €{(
                    activeTab === "week" ? 
                    existingWeeklyEntry!.revenue_amount / 100 : 
                    existingDailyEntry!.revenue_amount / 100
                  ).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Η νέα καταχώρηση θα αντικαταστήσει την προηγούμενη
                </p>
              </div>
            )}

            {/* Employee Progress Preview */}
            {selectedEmployeeData && (
              <Card className="bg-muted/30 border-urban-border">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{selectedEmployeeData.full_name}</p>
                    <div className="flex justify-between text-xs">
                      <span>Στόχος μήνα:</span>
                      <span>€{(selectedEmployeeData.monthly_revenue_target / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Τρέχων τζίρος:</span>
                      <span>€{(selectedEmployeeData.monthly_revenue_actual / 100).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ 
                          width: `${Math.min((selectedEmployeeData.monthly_revenue_actual / selectedEmployeeData.monthly_revenue_target) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={!selectedEmployee || (!selectedWeek && !selectedDate) || !revenueAmount || parseFloat(revenueAmount) <= 0}
              className="w-full bg-gradient-gold hover:bg-gradient-gold/90 text-primary-foreground font-medium"
            >
              <Save className="h-4 w-4 mr-2" />
              {((activeTab === "week" && existingWeeklyEntry) || (activeTab === "day" && existingDailyEntry)) ? "Ενημέρωση" : "Καταχώρηση"} Τζίρου
            </Button>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card className="bg-card border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Πρόσφατες Καταχωρήσεις</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="weekly">Εβδομαδιαίες</TabsTrigger>
                <TabsTrigger value="daily">Ημερήσιες</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                {weeklyEntries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Δεν υπάρχουν εβδομαδιαίες καταχωρήσεις
                  </p>
                ) : (
                  <div className="space-y-3">
                    {weeklyEntries.slice(0, 5).map((entry) => {
                      const employee = employees.find(e => e.id === entry.employee_id);
                      return (
                        <div key={entry.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{employee?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.week_start_date).toLocaleDateString('el-GR')}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            €{(entry.revenue_amount / 100).toFixed(2)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="daily">
                {dailyEntries.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Δεν υπάρχουν ημερήσιες καταχωρήσεις
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dailyEntries.slice(0, 5).map((entry) => {
                      const employee = employees.find(e => e.id === entry.employee_id);
                      return (
                        <div key={entry.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{employee?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString('el-GR')}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            €{(entry.revenue_amount / 100).toFixed(2)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}