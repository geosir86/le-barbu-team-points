import { useState, useEffect } from "react";
import { Bell, Send, Plus, MessageCircle, Target, Award, AlertTriangle, Info, Eye, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SentNotification {
  id: string;
  employee_id: string;
  employee_name: string;
  type: "achievement" | "points" | "goal" | "warning" | "info";
  title: string;
  message: string;
  priority: "normal" | "urgent";
  created_at: string;
  status: "sent" | "delivered" | "read";
}

interface Employee {
  id: string;
  full_name: string;
  username: string;
  is_active: boolean;
}

const notificationTemplates = [
  { type: "achievement", title: "Συγχαρητήρια!", message: "Εξαιρετική δουλειά σήμερα! Συνεχίστε έτσι!" },
  { type: "points", title: "Επιπλέον πόντοι", message: "Κερδίσατε bonus πόντους για την εξαιρετική σας απόδοση!" },
  { type: "goal", title: "Στόχος επιτεύχθηκε", message: "Φτάσατε τον στόχο σας! Μπράβο!" },
  { type: "warning", title: "Προσοχή στην ώρα", message: "Παρακαλώ προσέξτε τις ώρες άφιξης." },
  { type: "info", title: "Ενημέρωση", message: "Νέες οδηγίες για την εξυπηρέτηση πελατών." },
];

export function ManagerNotifications() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [newNotification, setNewNotification] = useState({
    recipients: [] as string[],
    type: "info" as SentNotification['type'],
    title: "",
    message: "",
    priority: "normal" as SentNotification['priority'],
  });

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, username, is_active')
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

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          employee_id,
          type,
          title,
          message,
          priority,
          status,
          created_at,
          employees!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedNotifications: SentNotification[] = (data || []).map(notif => ({
        id: notif.id,
        employee_id: notif.employee_id,
        employee_name: (notif.employees as any).full_name,
        type: notif.type as SentNotification['type'],
        title: notif.title,
        message: notif.message,
        priority: notif.priority as SentNotification['priority'],
        created_at: notif.created_at,
        status: notif.status as SentNotification['status'],
      }));
      
      setSentNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των ειδοποιήσεων",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchNotifications();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "achievement": return <Award className="h-4 w-4" />;
      case "points": return <Target className="h-4 w-4" />;
      case "goal": return <Target className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "info": return <Info className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Send className="h-3 w-3 text-muted-foreground" />;
      case "delivered": return <Eye className="h-3 w-3 text-blue-500" />;
      case "read": return <Eye className="h-3 w-3 text-green-500" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "achievement": return "text-yellow-600";
      case "points": return "text-blue-600";
      case "goal": return "text-green-600";
      case "warning": return "text-red-600";
      case "info": return "text-blue-500";
      default: return "text-gray-600";
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message || newNotification.recipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία!",
      });
      return;
    }

    try {
      // Create notifications for each recipient
      const notifications = newNotification.recipients.map(employeeId => ({
        employee_id: employeeId,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        priority: newNotification.priority,
        status: 'sent'
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      setNewNotification({
        recipients: [],
        type: "info",
        title: "",
        message: "",
        priority: "normal",
      });
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Επιτυχία!",
        description: `Στάλθηκαν ${notifications.length} ειδοποιήσεις!`,
      });

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά την αποστολή",
      });
    }
  };

  const applyTemplate = (template: typeof notificationTemplates[0]) => {
    setNewNotification({
      ...newNotification,
      type: template.type as SentNotification['type'],
      title: template.title,
      message: template.message,
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `πριν ${diffMinutes} λεπτά`;
    } else if (diffHours < 24) {
      return `πριν ${diffHours} ώρες`;
    } else {
      return date.toLocaleDateString('el-GR');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-lg w-1/2 mx-auto mb-8"></div>
            <div className="h-12 bg-muted rounded-lg mb-6"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Διαχείριση Ειδοποιήσεων
          </h1>
          <p className="text-muted-foreground">Στείλετε ειδοποιήσεις και παρακολουθήστε το ιστορικό</p>
        </div>

        {/* Create Notification Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-gold hover:bg-gradient-gold/90 mb-6">
              <Plus className="w-4 h-4 mr-2" />
              Νέα Ειδοποίηση
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Δημιουργία Ειδοποίησης</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Recipients */}
              <div>
                <Label>Παραλήπτες</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                  {employees.map((employee) => (
                    <label key={employee.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newNotification.recipients.includes(employee.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification({
                              ...newNotification,
                              recipients: [...newNotification.recipients, employee.id]
                            });
                          } else {
                            setNewNotification({
                              ...newNotification,
                              recipients: newNotification.recipients.filter(id => id !== employee.id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{employee.full_name}</span>
                      <Badge variant="outline" className="text-xs">
                        @{employee.username}
                      </Badge>
                    </label>
                  ))}
                </div>
                {employees.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">Δεν υπάρχουν ενεργοί εργαζόμενοι</p>
                )}
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Τύπος</Label>
                  <Select value={newNotification.type} onValueChange={(value) => setNewNotification({...newNotification, type: value as SentNotification['type']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">💡 Ενημέρωση</SelectItem>
                      <SelectItem value="achievement">🏆 Επίτευγμα</SelectItem>
                      <SelectItem value="points">📈 Πόντοι</SelectItem>
                      <SelectItem value="goal">🎯 Στόχος</SelectItem>
                      <SelectItem value="warning">⚠️ Προσοχή</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Προτεραιότητα</Label>
                  <Select value={newNotification.priority} onValueChange={(value) => setNewNotification({...newNotification, priority: value as SentNotification['priority']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Κανονική</SelectItem>
                      <SelectItem value="urgent">🔴 Επείγουσα</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label>Τίτλος</Label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  placeholder="π.χ. Συγχαρητήρια!"
                />
              </div>

              {/* Message */}
              <div>
                <Label>Μήνυμα</Label>
                <Textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  placeholder="Εισάγετε το μήνυμα σας..."
                  rows={4}
                />
              </div>

              {/* Templates */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Γρήγορα Templates</Label>
                <div className="grid grid-cols-1 gap-2">
                  {notificationTemplates.slice(0, 3).map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="justify-start text-left h-auto p-2"
                    >
                      <div>
                        <div className="font-medium text-xs">{template.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{template.message}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Send Button */}
              <Button 
                onClick={handleSendNotification} 
                className="w-full"
                disabled={employees.length === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                Αποστολή ({newNotification.recipients.length} παραλήπτες)
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sent Notifications History */}
        <Card className="bg-card border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ιστορικό Αποσταλμένων ({sentNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Δεν έχετε στείλει ειδοποιήσεις ακόμη</p>
              </div>
            ) : (
              sentNotifications.map((notification) => (
                <div key={notification.id} className="p-4 rounded-lg border border-urban-border bg-muted/20 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{notification.title}</span>
                          {notification.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-xs">Επείγον</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">προς: {notification.employee_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(notification.status)}
                      <span className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pl-8">{notification.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}