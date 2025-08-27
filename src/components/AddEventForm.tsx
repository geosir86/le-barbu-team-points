import { useState, useEffect } from "react";
import { Plus, Check, User, MessageSquare, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  full_name: string;
  username: string;
}

interface EventType {
  id: string;
  name: string;
  points: number;
  event_type: string;
  is_enabled: boolean;
  sort_order: number;
}

export function AddEventForm() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [saleAmount, setSaleAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, username')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των εργαζομένων",
      });
    }
  };

  const fetchEventTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('events_settings')
        .select('id, name, event_type, points, is_enabled, sort_order')
        .eq('is_enabled', true)
        .order('sort_order');

      if (error) throw error;
      setEventTypes(data || []);
    } catch (error) {
      console.error('Error fetching event types:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των τύπων συμβάντων",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const calculateTotalPoints = () => {
    return selectedEvents.reduce((total, eventId) => {
      const event = eventTypes.find(e => e.id === eventId);
      if (!event) return total;
      // Apply correct sign based on event type
      const points = event.event_type === 'negative' ? -Math.abs(event.points) : Math.abs(event.points);
      return total + points;
    }, 0);
  };

  const getSelectedEventsData = () => {
    return selectedEvents.map(eventId => eventTypes.find(e => e.id === eventId)).filter(Boolean);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || selectedEvents.length === 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε εργαζόμενο και τουλάχιστον ένα συμβάν",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployee);
    const selectedEventsData = getSelectedEventsData();
    
    if (!employee || selectedEventsData.length === 0) return;

    try {
      const eventsToInsert = selectedEventsData.map(event => {
        // Apply correct sign: negative events get negative points, positive get positive
        const points = event.event_type === 'negative' ? -Math.abs(event.points) : Math.abs(event.points);
        
        return {
          employee_id: selectedEmployee,
          event_type_id: event.id,
          event_type: event.name,
          points: points,
          description: comment || `Καταγραφή συμβάντος: ${event.name}`,
          created_by: 'manager',
          notes: comment || null
        };
      });

      // Also create employee request if it's a sale event with amount
      const hasSaleEvent = selectedEventsData.some(event => event.name.includes('Πώληση') || event.event_type === 'sale');
      if (hasSaleEvent && saleAmount > 0) {
        const saleEvent = selectedEventsData.find(event => event.name.includes('Πώληση') || event.event_type === 'sale');
        const requestData = {
          employee_id: selectedEmployee,
          request_type: 'positive' as const,
          event_type: saleEvent?.name || 'Πώληση προϊόντος',
          description: `Πώληση με ποσό: €${saleAmount}`,
          points: saleEvent?.points || 10,
          amount: saleAmount * 100, // Convert to cents
          status: 'approved'
        };

        await supabase
          .from('employee_requests')
          .insert(requestData);
      }

      console.log('Attempting to insert multiple events:', eventsToInsert);

      // Insert all events into database
      const { data, error } = await supabase
        .from('employee_events')
        .insert(eventsToInsert)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Events inserted successfully:', data);

      const totalPoints = calculateTotalPoints();
      const totalPointsText = totalPoints >= 0 ? `+${totalPoints}` : `${totalPoints}`;

      toast({
        title: "Επιτυχής καταγραφή!",
        description: `${totalPointsText} πόντοι για ${employee.full_name} (${selectedEvents.length} συμβάντα)`,
      });

      // Reset form
      setSelectedEmployee("");
      setSelectedEvents([]);
      setComment("");
      setSaleAmount(0);
    } catch (error) {
      console.error('Error creating events:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: `Παρουσιάστηκε σφάλμα κατά την καταγραφή: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`,
      });
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchEventTypes();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-lg w-3/4 mx-auto mb-8"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
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
            Καταγραφή Συμβάντος
          </h1>
          <p className="text-muted-foreground">Προσθήκη πόντων/ποινών</p>
        </div>

        {/* Form */}
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-primary" />
              Νέο Συμβάν
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Εργαζόμενος
              </label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="bg-muted border-urban-border">
                  <SelectValue placeholder="Επιλέξτε εργαζόμενο..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} (@{employee.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {employees.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  Δεν υπάρχουν ενεργοί εργαζόμενοι
                </p>
              </div>
            )}

            {/* Event Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Επιλογή Συμβάντων (Πολλαπλή)</label>
              <div className="grid gap-2">
                <div className="text-xs font-medium text-primary mb-1">Θετικά Συμβάντα</div>
                {eventTypes.filter(event => event.event_type === 'positive').map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      selectedEvents.includes(event.id)
                        ? "bg-primary/20 border-primary"
                        : "bg-muted/50 border-urban-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => handleEventToggle(event.id)}
                      />
                      <span className="text-sm font-medium">{event.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      +{Math.abs(event.points)}
                    </Badge>
                  </div>
                ))}
                
                <div className="text-xs font-medium text-destructive mb-1 mt-4">Αρνητικά Συμβάντα</div>
                {eventTypes.filter(event => event.event_type === 'negative').map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      selectedEvents.includes(event.id)
                        ? "bg-destructive/20 border-destructive"
                        : "bg-muted/50 border-urban-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => handleEventToggle(event.id)}
                      />
                      <span className="text-sm font-medium">{event.name}</span>
                    </div>
                    <Badge variant="destructive">
                      -{Math.abs(event.points)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Sale Amount Field (only show if sale event is selected) */}
            {selectedEvents.some(id => {
              const event = eventTypes.find(e => e.id === id);
              return event && (event.name.includes('Πώληση') || event.event_type === 'sale');
            }) && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Ποσό Πώλησης (€)
                </label>
                <Input
                  type="number"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(Number(e.target.value))}
                  placeholder="Εισάγετε το ποσό της πώλησης..."
                  className="bg-muted border-urban-border"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {/* Comment Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Σχόλιο (προαιρετικό)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Προσθέστε σχόλιο για την καταχώριση..."
                className="bg-muted border-urban-border"
                rows={3}
              />
            </div>

            {/* Preview */}
            {selectedEmployee && selectedEvents.length > 0 && (
              <Card className="bg-muted/30 border-urban-border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">Προεπισκόπηση</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="font-medium">
                          {employees.find(e => e.id === selectedEmployee)?.full_name}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <Badge 
                          variant={calculateTotalPoints() >= 0 ? "default" : "destructive"}
                          className={calculateTotalPoints() >= 0 ? "bg-primary text-primary-foreground" : ""}
                        >
                          {calculateTotalPoints() >= 0 ? "+" : ""}{calculateTotalPoints()} πόντοι συνολικά
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium mb-1">Επιλεγμένα συμβάντα:</div>
                        {getSelectedEventsData().map((event, index) => (
                          <div key={event.id} className="flex justify-between py-1">
                            <span>• {event.name}</span>
                            <span className={event.event_type === 'positive' ? "text-primary" : "text-destructive"}>
                              {event.event_type === 'positive' ? "+" : "-"}{Math.abs(event.points)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={!selectedEmployee || selectedEvents.length === 0 || employees.length === 0}
              className="w-full bg-gradient-gold hover:bg-gradient-gold/90 text-primary-foreground font-medium"
            >
              <Check className="h-4 w-4 mr-2" />
              Καταγραφή Συμβάντων
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}