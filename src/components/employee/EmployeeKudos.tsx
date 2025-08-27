import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Send, Clock, CheckCircle, XCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { EmployeeReceivedKudos } from "./EmployeeReceivedKudos";

interface Employee {
  id: string;
  full_name: string;
  position: string;
}

interface KudosItem {
  id: string;
  title: string;
  message: string;
  category: string;
  created_at: string;
  from_employee_name: string;
  to_employee_name: string;
  rating: number;
}

export function EmployeeKudos() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState(5);
  const [kudosList, setKudosList] = useState<KudosItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingKudos, setLoadingKudos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentEmployee } = useAuth();

  useEffect(() => {
    if (currentEmployee) {
      loadEmployees();
      loadKudos();
    }
  }, [currentEmployee]);

  const loadEmployees = async () => {
    if (!currentEmployee) return;

    try {
      // Set RLS context
      await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true)
        .neq('id', currentEmployee.id);

      if (error) {
        console.error('Error loading employees:', error);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η φόρτωση των συναδέλφων",
        });
        return;
      }
      
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των συναδέλφων",
      });
    }
  };

  const loadKudos = async () => {
    if (!currentEmployee) return;
    
    setLoadingKudos(true);
    try {
      // Set RLS context
      await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      // Get kudos sent by current employee
      const { data: sentKudos, error: sentError } = await supabase
        .from('employee_feedback')
        .select(`
          id,
          title,
          message,
          category,
          created_at,
          rating,
          employee_id,
          from_employee_id
        `)
        .eq('from_employee_id', currentEmployee.id)
        .eq('feedback_type', 'kudos')
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Get employee names for the kudos
      const kudosWithNames: KudosItem[] = [];
      for (const kudos of sentKudos || []) {
        const { data: toEmployee } = await supabase
          .from('employees')
          .select('full_name')
          .eq('id', kudos.employee_id)
          .single();

        kudosWithNames.push({
          id: kudos.id,
          title: kudos.title,
          message: kudos.message,
          category: kudos.category || 'general',
          created_at: kudos.created_at,
          from_employee_name: currentEmployee.full_name,
          to_employee_name: toEmployee?.full_name || 'Άγνωστος',
          rating: kudos.rating || 5
        });
      }

      setKudosList(kudosWithNames);
    } catch (error) {
      console.error('Error loading kudos:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των kudos",
      });
    } finally {
      setLoadingKudos(false);
    }
  };

  const handleSubmitKudos = async () => {
    if (!selectedEmployee || !message.trim() || !title.trim()) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Set RLS context
      await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee!.id 
      });

      const { error } = await supabase
        .from('employee_feedback')
        .insert([{
          employee_id: selectedEmployee,
          from_employee_id: currentEmployee!.id,
          title: title,
          message: message,
          category: category || 'teamwork',
          rating: rating,
          feedback_type: 'kudos'
        }]);

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: "Το kudos στάλθηκε για έγκριση από τον manager",
      });

      // Reset form
      setSelectedEmployee("");
      setMessage("");
      setTitle("");
      setCategory("");
      setRating(5);

      // Reload kudos list
      loadKudos();
    } catch (error) {
      console.error('Error submitting kudos:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποστολή του kudos",
      });
    } finally {
      setIsSubmitting(false);
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
            Kudos
          </h1>
          <p className="text-muted-foreground">Στείλε και δες kudos</p>
        </div>

        <Tabs defaultValue="send" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Αποστολή</TabsTrigger>
            <TabsTrigger value="received">Που έλαβα</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            {/* Send Kudos Form */}
            <Card className="bg-gradient-card border-urban-border shadow-urban">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Στείλε Kudos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="colleague-select">Επιλογή Συναδέλφου</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Διάλεξε συνάδελφο..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kudos-title">Τίτλος</Label>
                  <Input
                    id="kudos-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="π.χ. Εξαιρετική συνεργασία σήμερα!"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kudos-category">Κατηγορία</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Διάλεξε κατηγορία..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teamwork">Συνεργασία</SelectItem>
                      <SelectItem value="quality">Ποιότητα Εργασίας</SelectItem>
                      <SelectItem value="customer_service">Εξυπηρέτηση Πελατών</SelectItem>
                      <SelectItem value="innovation">Καινοτομία</SelectItem>
                      <SelectItem value="leadership">Ηγεσία</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Αξιολόγηση</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={() => setRating(star)}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kudos-message">Μήνυμα</Label>
                  <Textarea
                    id="kudos-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Γράψε το μήνυμά σου εδώ..."
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length}/500 χαρακτήρες
                  </p>
                </div>

                <Button
                  onClick={handleSubmitKudos}
                  className="w-full bg-gradient-gold hover:bg-gradient-gold/90"
                  disabled={!selectedEmployee || !title.trim() || !message.trim() || !category || rating === 0 || isSubmitting}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Αποστολή..." : "Στείλε Kudos"}
                </Button>
              </CardContent>
            </Card>

            {/* Sent Kudos History */}
            <Card className="bg-gradient-card border-urban-border shadow-urban">
              <CardHeader>
                <CardTitle>Kudos που έστειλα</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingKudos ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Φόρτωση...</p>
                  </div>
                ) : kudosList.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Δεν έχεις στείλει kudos ακόμα</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kudosList.map((kudos) => (
                      <div key={kudos.id} className="p-3 border rounded-lg border-urban-border bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{kudos.title}</h4>
                          <div className="flex items-center">
                            {Array(kudos.rating).fill(0).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Προς: {kudos.to_employee_name}
                        </p>
                        <p className="text-sm mb-2">{kudos.message}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {kudos.category === 'teamwork' ? 'Συνεργασία' :
                             kudos.category === 'quality' ? 'Ποιότητα Εργασίας' :
                             kudos.category === 'customer_service' ? 'Εξυπηρέτηση Πελατών' :
                             kudos.category === 'innovation' ? 'Καινοτομία' :
                             kudos.category === 'leadership' ? 'Ηγεσία' : 'Γενικά'}
                          </Badge>
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
          </TabsContent>

          <TabsContent value="received">
            <EmployeeReceivedKudos />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}