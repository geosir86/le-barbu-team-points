import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ReceivedKudos {
  id: string;
  title: string;
  message: string;
  category: string;
  created_at: string;
  from_employee_name: string;
  rating: number;
  status: string;
}

export function EmployeeReceivedKudos() {
  const [receivedKudos, setReceivedKudos] = useState<ReceivedKudos[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentEmployee } = useAuth();

  useEffect(() => {
    if (currentEmployee) {
      loadReceivedKudos();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('received-kudos-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employee_feedback',
            filter: `employee_id=eq.${currentEmployee.id}`
          },
          () => {
            loadReceivedKudos();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentEmployee?.id]);

  const loadReceivedKudos = async () => {
    if (!currentEmployee) return;
    
    setLoading(true);
    try {
      // Set RLS context
      await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      // Get kudos received by current employee
      const { data: kudosData, error } = await supabase
        .from('employee_feedback')
        .select(`
          id,
          title,
          message,
          category,
          created_at,
          rating,
          from_employee_id,
          status
        `)
        .eq('employee_id', currentEmployee.id)
        .eq('feedback_type', 'kudos')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get sender names for the kudos
      const kudosWithNames: ReceivedKudos[] = [];
      for (const kudos of kudosData || []) {
        const { data: fromEmployee } = await supabase
          .from('employees')
          .select('full_name')
          .eq('id', kudos.from_employee_id)
          .single();

        kudosWithNames.push({
          id: kudos.id,
          title: kudos.title,
          message: kudos.message,
          category: kudos.category || 'general',
          created_at: kudos.created_at,
          from_employee_name: fromEmployee?.full_name || 'Άγνωστος',
          rating: kudos.rating || 5,
          status: kudos.status || 'approved'
        });
      }

      setReceivedKudos(kudosWithNames);
    } catch (error) {
      console.error('Error loading received kudos:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των kudos που έλαβες",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentEmployee) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Παρακαλώ συνδεθείτε ως εργαζόμενος</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Kudos που Έλαβα
          </h1>
          <p className="text-muted-foreground">Αναγνώριση από συναδέλφους</p>
        </div>

        {/* Received Kudos List */}
        <Card className="bg-gradient-card border-urban-border shadow-urban">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Kudos που Έλαβες ({receivedKudos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Φόρτωση...</p>
              </div>
            ) : receivedKudos.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Δεν έχεις λάβει ακόμα kudos</p>
                <p className="text-xs text-muted-foreground mt-2">Συνέχισε την καλή δουλειά!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedKudos.map((kudos) => (
                  <div key={kudos.id} className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{kudos.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Από: {kudos.from_employee_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={kudos.status === 'approved' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {kudos.status === 'approved' ? 'Εγκρίθηκε' : 
                           kudos.status === 'pending' ? 'Εκκρεμεί' : 'Απορρίφθηκε'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs">
                        {kudos.category === 'teamwork' ? 'Συνεργασία' :
                         kudos.category === 'quality' ? 'Ποιότητα Εργασίας' :
                         kudos.category === 'customer_service' ? 'Εξυπηρέτηση Πελατών' :
                         kudos.category === 'innovation' ? 'Καινοτομία' :
                         kudos.category === 'leadership' ? 'Ηγεσία' : 'Γενικά'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{kudos.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array(kudos.rating).fill(0).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">({kudos.rating}/5)</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(kudos.created_at).toLocaleDateString('el-GR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        {receivedKudos.length > 0 && (
          <Card className="bg-gradient-card border-urban-border shadow-urban">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary mb-1">{receivedKudos.length}</p>
                <p className="text-sm text-muted-foreground mb-2">Συνολικά Kudos</p>
                <div className="flex justify-center">
                  <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < Math.round(receivedKudos.reduce((avg, k) => avg + k.rating, 0) / receivedKudos.length)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Μέσος Όρος Αξιολόγησης</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}