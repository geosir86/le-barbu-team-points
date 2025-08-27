import { useState, useEffect } from "react";
import { Settings, Edit, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EventType {
  id: string;
  name: string;
  points: number;
  event_type: "positive" | "negative";
  is_enabled: boolean;
  sort_order: number;
}

export function EventsSettings() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({ name: "", points: 0, type: "positive" as "positive" | "negative" });
  const [penaltySettings, setPenaltySettings] = useState({ enabled: true, limit: 3, penalty: 50 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events_settings')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setEventTypes((data || []).map(item => ({
        id: item.id,
        name: item.name,
        points: item.points,
        event_type: item.event_type as "positive" | "negative",
        is_enabled: item.is_enabled,
        sort_order: item.sort_order || 0
      })));
    } catch (error) {
      console.error('Error loading event types:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των συμβάντων",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || formData.points <= 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events_settings')
          .update({
            name: formData.name,
            points: Math.abs(formData.points), // Always store as positive
            event_type: formData.type,
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
        
        toast({
          title: "Επιτυχής ενημέρωση!",
          description: "Το συμβάν ενημερώθηκε επιτυχώς",
        });
      } else {
        // Calculate sort_order for new events
        const maxSortOrder = eventTypes
          .filter(e => e.event_type === formData.type)
          .reduce((max, e) => Math.max(max, e.sort_order || 0), 0);
        
        const newSortOrder = formData.type === 'positive' 
          ? maxSortOrder + 1 
          : Math.max(100, maxSortOrder + 1);

        const { error } = await supabase
          .from('events_settings')
          .insert({
            name: formData.name,
            points: Math.abs(formData.points), // Always store as positive
            event_type: formData.type,
            is_enabled: true,
            sort_order: newSortOrder,
          });

        if (error) throw error;
        
        toast({
          title: "Επιτυχής προσθήκη!",
          description: "Το νέο συμβάν προστέθηκε επιτυχώς",
        });
      }

      setEditingEvent(null);
      setIsAddingNew(false);
      setFormData({ name: "", points: 0, type: "positive" });
      loadEventTypes();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποθήκευση του συμβάντος",
      });
    }
  };

  const handleEdit = (event: EventType) => {
    setEditingEvent(event);
    setFormData({ name: event.name, points: Math.abs(event.points), type: event.event_type });
    setIsAddingNew(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Επιτυχής διαγραφή!",
        description: "Το συμβάν διαγράφηκε επιτυχώς",
      });
      
      loadEventTypes();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η διαγραφή του συμβάντος",
      });
    }
  };

  const handleToggleEnabled = async (id: string) => {
    try {
      const event = eventTypes.find(e => e.id === id);
      if (!event) return;

      const { error } = await supabase
        .from('events_settings')
        .update({ is_enabled: !event.is_enabled })
        .eq('id', id);

      if (error) throw error;

      loadEventTypes();
    } catch (error) {
      console.error('Error toggling event:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η ενημέρωση του συμβάντος",
      });
    }
  };

  const positiveEvents = eventTypes.filter(e => e.event_type === "positive");
  const negativeEvents = eventTypes.filter(e => e.event_type === "negative");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Button */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogTrigger asChild>
          <Button className="w-full bg-gradient-gold hover:bg-gradient-gold/90 text-primary-foreground font-medium">
            <Plus className="h-4 w-4 mr-2" />
            Προσθήκη Νέου Συμβάντος
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-urban-border">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Επεξεργασία Συμβάντος" : "Νέο Συμβάν"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Όνομα Συμβάντος</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="π.χ. Πώληση προϊόντος"
                className="bg-muted border-urban-border"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Πόντοι</Label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: Number(e.target.value) }))}
                placeholder="10"
                className="bg-muted border-urban-border"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Τύπος</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={formData.type === "positive" ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, type: "positive" }))}
                  className={formData.type === "positive" ? "bg-primary" : ""}
                >
                  ✅ Θετικό
                </Button>
                <Button
                  variant={formData.type === "negative" ? "destructive" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, type: "negative" }))}
                >
                  ❌ Αρνητικό
                </Button>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full bg-gradient-gold">
              {editingEvent ? "Ενημέρωση" : "Προσθήκη"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Positive Events */}
      <Card className="bg-card border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <Settings className="h-5 w-5" />
            ✅ Θετικά Συμβάντα
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {positiveEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
              <div className="flex-1">
                <p className={`font-medium text-sm ${!event.is_enabled ? 'opacity-50' : ''}`}>{event.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`bg-primary text-primary-foreground ${!event.is_enabled ? 'opacity-50' : ''}`}>
                  +{Math.abs(event.points)}
                </Badge>
                <Switch
                  checked={event.is_enabled}
                  onCheckedChange={() => handleToggleEnabled(event.id)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(event)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(event.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Negative Events */}
      <Card className="bg-card border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Settings className="h-5 w-5" />
            ❌ Αρνητικά Συμβάντα
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {negativeEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
              <div className="flex-1">
                <p className={`font-medium text-sm ${!event.is_enabled ? 'opacity-50' : ''}`}>{event.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className={!event.is_enabled ? 'opacity-50' : ''}>
                  -{Math.abs(event.points)}
                </Badge>
                <Switch
                  checked={event.is_enabled}
                  onCheckedChange={() => handleToggleEnabled(event.id)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(event)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(event.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Extra Penalty Settings */}
      <Card className="bg-card border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Settings className="h-5 w-5" />
            ⚠️ Extra Penalty - Επιπλέον Ποινή
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ενεργοποίηση Extra Penalty</p>
              <p className="text-sm text-muted-foreground">Αυτόματη αφαίρεση χρημάτων μετά από πολλά αρνητικά συμβάντα</p>
            </div>
            <Switch
              checked={penaltySettings.enabled}
              onCheckedChange={(checked) => setPenaltySettings(prev => ({...prev, enabled: checked}))}
            />
          </div>
          
          {penaltySettings.enabled && (
            <div className="space-y-4 border-t border-urban-border pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Όριο Αρνητικών Συμβάντων</Label>
                  <Input
                    type="number"
                    value={penaltySettings.limit}
                    onChange={(e) => setPenaltySettings(prev => ({...prev, limit: Number(e.target.value)}))}
                    className="bg-muted border-urban-border"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Ποινή (€)</Label>
                  <Input
                    type="number"
                    value={penaltySettings.penalty}
                    onChange={(e) => setPenaltySettings(prev => ({...prev, penalty: Number(e.target.value)}))}
                    className="bg-muted border-urban-border"
                  />
                </div>
              </div>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm">
                  <strong>Παράδειγμα:</strong> Αν ένας εργαζόμενος κάνει {penaltySettings.limit} αρνητικά συμβάντα, 
                  θα αφαιρεθούν επιπλέον {penaltySettings.penalty}€ από τον μισθό του.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}