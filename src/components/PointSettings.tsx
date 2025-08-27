import { useState } from "react";
import { Settings, Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EventType {
  id: string;
  name: string;
  points: number;
  type: "positive" | "negative";
}

const initialEventTypes: EventType[] = [
  { id: "1", name: "Πώληση προϊόντος", points: 10, type: "positive" },
  { id: "2", name: "Ραντεβού επιτυχημένο", points: 12, type: "positive" },
  { id: "3", name: "Review 5 αστέρων", points: 15, type: "positive" },
  { id: "4", name: "Επιπλέον ώρες", points: 8, type: "positive" },
  { id: "5", name: "Upselling υπηρεσίας", points: 20, type: "positive" },
  { id: "6", name: "Καθυστέρηση", points: 5, type: "negative" },
  { id: "7", name: "Απουσία χωρίς ειδοποίηση", points: 15, type: "negative" },
  { id: "8", name: "Παράπονο πελάτη", points: 10, type: "negative" },
  { id: "9", name: "Μη τήρηση κανόνων καθαριότητας ή υγιεινής", points: 8, type: "negative" },
  { id: "10", name: "Μηδενικές ή ελάχιστες πωλήσεις", points: 12, type: "negative" },
];

export function PointSettings() {
  const [eventTypes, setEventTypes] = useState<EventType[]>(initialEventTypes);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({ name: "", points: 0, type: "positive" as "positive" | "negative" });
  const { toast } = useToast();

  const handleSave = () => {
    if (!formData.name || formData.points <= 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
        variant: "destructive",
      });
      return;
    }

    if (editingEvent) {
      // Update existing
      setEventTypes(prev => prev.map(event => 
        event.id === editingEvent.id 
          ? { ...event, name: formData.name, points: formData.points, type: formData.type }
          : event
      ));
      toast({
        title: "Επιτυχής ενημέρωση!",
        description: "Το συμβάν ενημερώθηκε επιτυχώς",
      });
    } else {
      // Add new
      const newEvent: EventType = {
        id: Date.now().toString(),
        name: formData.name,
        points: formData.points,
        type: formData.type,
      };
      setEventTypes(prev => [...prev, newEvent]);
      toast({
        title: "Επιτυχής προσθήκη!",
        description: "Το νέο συμβάν προστέθηκε επιτυχώς",
      });
    }

    setEditingEvent(null);
    setIsAddingNew(false);
    setFormData({ name: "", points: 0, type: "positive" });
  };

  const handleEdit = (event: EventType) => {
    setEditingEvent(event);
    setFormData({ name: event.name, points: event.points, type: event.type });
    setIsAddingNew(true);
  };

  const handleDelete = (id: string) => {
    setEventTypes(prev => prev.filter(event => event.id !== id));
    toast({
      title: "Επιτυχής διαγραφή!",
      description: "Το συμβάν διαγράφηκε επιτυχώς",
    });
  };

  const positiveEvents = eventTypes.filter(e => e.type === "positive");
  const negativeEvents = eventTypes.filter(e => e.type === "negative");

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Ρυθμίσεις Πόντων
          </h1>
          <p className="text-muted-foreground">Διαχείριση συμβάντων & αξιών</p>
        </div>

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
                <label className="text-sm font-medium">Όνομα Συμβάντος</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="π.χ. Πώληση προϊόντος"
                  className="bg-muted border-urban-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Πόντοι</label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: Number(e.target.value) }))}
                  placeholder="10"
                  className="bg-muted border-urban-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Τύπος</label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={formData.type === "positive" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, type: "positive" }))}
                    className={formData.type === "positive" ? "bg-primary" : ""}
                  >
                    Θετικό
                  </Button>
                  <Button
                    variant={formData.type === "negative" ? "destructive" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, type: "negative" }))}
                  >
                    Αρνητικό
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
        <Card className="bg-gradient-card border-urban-border shadow-urban">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <Settings className="h-5 w-5" />
              Θετικά Συμβάντα
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {positiveEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{event.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">
                    +{event.points}
                  </Badge>
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
        <Card className="bg-gradient-card border-urban-border shadow-urban">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <Settings className="h-5 w-5" />
              Αρνητικά Συμβάντα
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {negativeEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{event.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    -{event.points}
                  </Badge>
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
      </div>
    </div>
  );
}