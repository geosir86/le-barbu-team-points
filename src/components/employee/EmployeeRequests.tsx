import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Plus, ArrowLeft, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RequestData {
  id: string;
  request_type: 'positive' | 'negative' | 'kudos';
  event_type: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  description: string | null;
}

// Event types with their point values
const eventTypes = {
  positive: {
    "Review 5⭐": 15,
    "Πώληση προϊόντος": 10,
    "Booking ραντεβού": 12,
    "Επιπλέον ώρες": 8,
    "Βοήθεια πελάτη": 5,
  },
  negative: {
    "Καθυστέρηση": -5,
    "Μικρό λάθος": -3,
    "Παράπονο πελάτη": -10,
  },
  kudos: {
    "Συνεργασία": 0,
    "Ποιότητα Εργασίας": 0,
    "Εξυπηρέτηση Πελατών": 0,
    "Καινοτομία": 0,
    "Ηγεσία": 0,
  }
};

export function EmployeeRequests() {
  const [activeTab, setActiveTab] = useState("all");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<'positive' | 'negative' | 'kudos'>('positive');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [description, setDescription] = useState('');
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentEmployee } = useAuth();

  useEffect(() => {
    if (currentEmployee) {
      loadRequests();
    }
  }, [currentEmployee]);

  const loadRequests = async () => {
    if (!currentEmployee) return;
    
    try {
      const { data, error } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const typedRequests: RequestData[] = (data || []).map(req => ({
        ...req,
        request_type: req.request_type as 'positive' | 'negative' | 'kudos',
        status: req.status as 'pending' | 'approved' | 'rejected'
      }));
      setRequests(typedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των αιτήσεων",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return request.status === "pending";
    if (activeTab === "approved") return request.status === "approved";
    if (activeTab === "rejected") return request.status === "rejected";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-400";
      case "approved": return "text-green-400";
      case "rejected": return "text-red-400";
      default: return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedEvent || !currentEmployee) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε ένα συμβάν",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('employee_requests')
        .insert({
          employee_id: currentEmployee.id,
          request_type: selectedRequestType,
          event_type: selectedEvent,
          description: description || null,
          points: eventTypes[selectedRequestType][selectedEvent]
        });

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: "Η αίτησή σας υποβλήθηκε για έγκριση",
      });

      // Reset form and reload requests
      setSelectedEvent('');
      setDescription('');
      setShowNewRequest(false);
      loadRequests();
      
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η υποβολή της αίτησης",
      });
    }
  };

  if (showNewRequest) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewRequest(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Νέα Αίτηση</h1>
              <p className="text-muted-foreground">Καταγραφή συμβάντος</p>
            </div>
          </div>

          <Card className="bg-gradient-card border-urban-border shadow-urban">
            <CardHeader>
              <CardTitle>Τύπος Αίτησης</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={selectedRequestType === 'positive' ? "default" : "outline"}
                  onClick={() => setSelectedRequestType('positive')}
                  className="h-16"
                >
                  <div className="text-center">
                    <Plus className="h-5 w-5 mx-auto mb-1" />
                    <span>Θετικό</span>
                  </div>
                </Button>
                <Button
                  variant={selectedRequestType === 'negative' ? "destructive" : "outline"}
                  onClick={() => setSelectedRequestType('negative')}
                  className="h-16"
                >
                  <div className="text-center">
                    <XCircle className="h-5 w-5 mx-auto mb-1" />
                    <span>Αρνητικό</span>
                  </div>
                </Button>
                <Button
                  variant={selectedRequestType === 'kudos' ? "secondary" : "outline"}
                  onClick={() => setSelectedRequestType('kudos')}
                  className="h-16"
                >
                  <div className="text-center">
                    <Heart className="h-5 w-5 mx-auto mb-1" />
                    <span>Kudos</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-urban-border shadow-urban">
            <CardHeader>
              <CardTitle>Επιλογή Συμβάντος</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(eventTypes[selectedRequestType]).map(([event, points]) => (
                <Button
                  key={event}
                  variant={selectedEvent === event ? "default" : "outline"}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full justify-between"
                >
                  <span>{event}</span>
                  <Badge variant={
                    selectedRequestType === 'positive' ? "default" : 
                    selectedRequestType === 'negative' ? "destructive" : "secondary"
                  }>
                    {selectedRequestType === 'kudos' ? 'Kudos' : 
                     `${points > 0 ? '+' : ''}${points} πόντοι`}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          {selectedEvent && (
            <Card className="bg-gradient-card border-urban-border shadow-urban">
              <CardHeader>
                <CardTitle>Περιγραφή</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Περιγράψτε το συμβάν με λεπτομέρειες..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowNewRequest(false)}
              className="flex-1"
            >
              Ακύρωση
            </Button>
            <Button
              onClick={handleSubmitRequest}
              className="flex-1 bg-gradient-gold hover:bg-gradient-gold/90"
              disabled={!selectedEvent}
            >
              Αποστολή
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Οι Αιτήσεις μου
          </h1>
          <p className="text-muted-foreground">Παρακολούθηση αιτήσεων</p>
        </div>

        <Button
          onClick={() => setShowNewRequest(true)}
          className="w-full bg-gradient-gold hover:bg-gradient-gold/90 text-primary-foreground font-medium"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Νέα Αίτηση
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Όλες</TabsTrigger>
            <TabsTrigger value="pending">Εκκρεμείς</TabsTrigger>
            <TabsTrigger value="approved">Εγκεκριμένες</TabsTrigger>
            <TabsTrigger value="rejected">Απορριφθείσες</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Φόρτωση...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {activeTab === "all" ? "Δεν έχετε κάνει καμία αίτηση ακόμα" :
                   activeTab === "pending" ? "Δεν έχετε εκκρεμείς αιτήσεις" :
                   activeTab === "approved" ? "Δεν έχετε εγκεκριμένες αιτήσεις" :
                   "Δεν έχετε απορριφθείσες αιτήσεις"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg border-border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{request.event_type}</h3>
                        {getStatusIcon(request.status)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={request.points > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {request.points > 0 ? "+" : ""}{request.points}
                        </Badge>
                      </div>
                    </div>
                    {request.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {request.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(request.status)}`}
                      >
                        {request.status === "pending" ? "Εκκρεμεί" : 
                         request.status === "approved" ? "Εγκρίθηκε" : "Απορρίφθηκε"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString('el-GR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}