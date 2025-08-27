import { useState } from "react";
import { Plus, FileText, Gift, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FloatingActionButtonProps {
  onRewardRedeem?: () => void;
  onRequestSubmit?: () => void;
}

export function FloatingActionButton({ onRewardRedeem, onRequestSubmit }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    type: "",
    eventType: "",
    description: ""
  });
  const [kudosForm, setKudosForm] = useState({
    recipient: "",
    rating: 5,
    message: ""
  });
  const [employees, setEmployees] = useState<Array<{ id: string; full_name: string }>>([]);
  const [eventTypes, setEventTypes] = useState<Array<{ name: string; event_type: string; points: number }>>([]);
  const { currentEmployee } = useAuth();
  const { toast } = useToast();

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('is_active', true)
      .neq('id', currentEmployee?.id);
    setEmployees(data || []);
  };

  const loadEventTypes = async () => {
    const { data } = await supabase
      .from('events_settings')
      .select('name, event_type, points')
      .eq('is_enabled', true);
    setEventTypes(data || []);
  };

  const handleRequestSubmit = async () => {
    if (!requestForm.type || !requestForm.eventType || !requestForm.description) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
      });
      return;
    }

    try {
      const selectedEvent = eventTypes.find(e => e.name === requestForm.eventType);
      if (!selectedEvent) return;

      const { error } = await supabase
        .from('employee_requests')
        .insert({
          employee_id: currentEmployee?.id,
          request_type: selectedEvent.event_type,
          event_type: requestForm.eventType,
          description: requestForm.description,
          points: selectedEvent.points,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: "Η αίτησή σας στάλθηκε για έγκριση",
      });

      setShowRequestModal(false);
      setRequestForm({ type: "", eventType: "", description: "" });
      setIsOpen(false);
      onRequestSubmit?.();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποστολή της αίτησης",
      });
    }
  };

  const handleRewardRedeem = () => {
    // Navigate to rewards page or open reward selection
    if (onRewardRedeem) {
      onRewardRedeem();
    } else {
      toast({
        title: "Ανταμοιβές",
        description: "Ανοίγει η σελίδα ανταμοιβών...",
      });
    }
    setIsOpen(false);
  };

  const handleKudosSubmit = async () => {
    if (!kudosForm.recipient || !kudosForm.message) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('employee_feedback')
        .insert({
          employee_id: kudosForm.recipient,
          from_employee_id: currentEmployee?.id,
          feedback_type: 'kudos',
          title: 'Kudos από συνάδελφο',
          message: kudosForm.message,
          rating: kudosForm.rating,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: "Τα kudos στάλθηκαν για έγκριση",
      });

      setShowKudosModal(false);
      setKudosForm({ recipient: "", rating: 5, message: "" });
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending kudos:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποστολή των kudos",
      });
    }
  };

  const actions = [
    {
      label: "Νέα Αίτηση",
      icon: FileText,
      onClick: () => {
        loadEventTypes();
        setShowRequestModal(true);
      },
    },
    {
      label: "Εξαργύρωση Ανταμοιβής",
      icon: Gift,
      onClick: handleRewardRedeem,
    },
    {
      label: "Στείλε Kudos",
      icon: Heart,
      onClick: () => {
        loadEmployees();
        setShowKudosModal(true);
      },
    },
  ];

  return (
    <>
      {/* Main FAB Button */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col-reverse items-end gap-2">
        {isOpen && (
          <div className="flex flex-col gap-2 animate-fade-in">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.onClick}
                  className="shadow-lg bg-background hover:bg-accent flex items-center gap-2 min-w-[160px]"
                >
                  <Icon size={16} />
                  <span className="text-sm">{action.label}</span>
                </Button>
              );
            })}
          </div>
        )}
        
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-14 h-14"
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </Button>
      </div>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Νέα Αίτηση</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Τύπος</Label>
              <Select value={requestForm.type} onValueChange={(value) => setRequestForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Επιλέξτε τύπο" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Θετικό Συμβάν</SelectItem>
                  <SelectItem value="negative">Αρνητικό Συμβάν</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {requestForm.type && (
              <div>
                <Label>Συμβάν</Label>
                <Select value={requestForm.eventType} onValueChange={(value) => setRequestForm(prev => ({ ...prev, eventType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Επιλέξτε συμβάν" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes
                      .filter(e => e.event_type === requestForm.type)
                      .map((event) => (
                        <SelectItem key={event.name} value={event.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{event.name}</span>
                            <Badge variant={event.event_type === 'positive' ? 'default' : 'destructive'}>
                              {event.event_type === 'positive' ? '+' : ''}{event.points} πόντοι
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Περιγραφή</Label>
              <Textarea
                value={requestForm.description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Περιγράψτε το συμβάν..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRequestSubmit} className="flex-1">
                Αποστολή
              </Button>
              <Button variant="outline" onClick={() => setShowRequestModal(false)}>
                Ακύρωση
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kudos Modal */}
      <Dialog open={showKudosModal} onOpenChange={setShowKudosModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Στείλε Kudos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Παραλήπτης</Label>
              <Select value={kudosForm.recipient} onValueChange={(value) => setKudosForm(prev => ({ ...prev, recipient: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Επιλέξτε συνάδελφο" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Βαθμολογία (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={kudosForm.rating}
                onChange={(e) => setKudosForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Μήνυμα</Label>
              <Textarea
                value={kudosForm.message}
                onChange={(e) => setKudosForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Γράψτε το μήνυμά σας..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleKudosSubmit} className="flex-1">
                Αποστολή
              </Button>
              <Button variant="outline" onClick={() => setShowKudosModal(false)}>
                Ακύρωση
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}