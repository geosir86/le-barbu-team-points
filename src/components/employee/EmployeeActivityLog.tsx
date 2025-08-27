import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ActivityData {
  id: string;
  event_type: string;
  points: number;
  type: 'positive' | 'negative';
  created_at: string;
  description: string | null;
}

interface EmployeeActivityLogProps {}

export function EmployeeActivityLog({}: EmployeeActivityLogProps) {
  const [filter, setFilter] = useState("all");
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentEmployee } = useAuth();

  useEffect(() => {
    if (currentEmployee) {
      loadActivities();

      // Set up real-time subscription for activities
      const channel = supabase
        .channel('employee-activity-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public', 
            table: 'employee_events',
            filter: `employee_id=eq.${currentEmployee.id}`
          },
          () => {
            loadActivities();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentEmployee?.id]);

  const loadActivities = async () => {
    if (!currentEmployee) return;

    try {
      // Set RLS context first
      await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      const { data, error } = await supabase
        .from('employee_events')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedActivities: ActivityData[] = (data || []).map(activity => ({
        id: activity.id,
        event_type: activity.event_type,
        points: activity.points,
        type: activity.points >= 0 ? 'positive' : 'negative',
        created_at: activity.created_at,
        description: activity.description
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των δραστηριοτήτων",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === "all") return true;
    if (filter === "positive") return activity.type === "positive";
    if (filter === "negative") return activity.type === "negative";
    return true;
  });

  const totalPositive = activities
    .filter(activity => activity.type === "positive")
    .reduce((sum, activity) => sum + activity.points, 0);

  const totalNegative = Math.abs(activities
    .filter(activity => activity.type === "negative")
    .reduce((sum, activity) => sum + activity.points, 0));

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Ιστορικό Συμβάντων
          </h1>
          <p className="text-muted-foreground">Όλες οι δραστηριότητές σου</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-primary mr-2" />
              </div>
              <p className="text-2xl font-bold text-primary">+{totalPositive}</p>
              <p className="text-sm text-muted-foreground">Θετικοί Πόντοι</p>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingDown className="h-6 w-6 text-destructive mr-2" />
              </div>
              <p className="text-2xl font-bold text-destructive">-{totalNegative}</p>
              <p className="text-sm text-muted-foreground">Αρνητικοί Πόντοι</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Όλα</TabsTrigger>
            <TabsTrigger value="positive">Θετικά</TabsTrigger>
            <TabsTrigger value="negative">Αρνητικά</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            <div className="grid gap-3">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Φόρτωση...</p>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filter === "all" 
                      ? "Δεν έχετε ακόμα καμία δραστηριότητα"
                      : `Δεν βρέθηκαν ${filter === "positive" ? "θετικές" : "αρνητικές"} δραστηριότητες`}
                  </p>
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <Card key={activity.id} className="bg-card border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm">{activity.event_type}</h3>
                        <Badge 
                          variant={activity.type === "positive" ? "default" : "destructive"}
                          className="ml-2"
                        >
                          {activity.type === "positive" ? "+" : ""}{activity.points}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mb-3">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(activity.created_at).toLocaleDateString('el-GR')}</span>
                        <span>{new Date(activity.created_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}