import { useState, useEffect } from "react";
import { Bell, Star, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "achievement" | "points" | "goal" | "warning" | "info";
  title: string;
  message: string;
  created_at: string;
  employee_id: string;
  employee_name?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "achievement":
      return <Award className="h-5 w-5 text-primary" />;
    case "points":
      return <TrendingUp className="h-5 w-5 text-primary" />;
    case "goal":
      return <Star className="h-5 w-5 text-primary" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getNotificationBadgeColor = (type: string) => {
  switch (type) {
    case "achievement":
      return "bg-gradient-gold text-primary-foreground";
    case "points":
      return "bg-primary text-primary-foreground";
    case "goal":
      return "bg-secondary text-secondary-foreground";
    case "warning":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted";
  }
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Load employee names
      const notificationsWithNames: Notification[] = [];
      if (data) {
        for (const notification of data) {
          const { data: employee } = await supabase
            .from('employees')
            .select('full_name')
            .eq('id', notification.employee_id)
            .single();

          notificationsWithNames.push({
            id: notification.id,
            type: notification.type as "achievement" | "points" | "goal" | "warning" | "info",
            title: notification.title,
            message: notification.message,
            created_at: notification.created_at,
            employee_id: notification.employee_id,
            employee_name: employee?.full_name || 'Άγνωστος'
          });
        }
      }

      setNotifications(notificationsWithNames);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των ειδοποιήσεων",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('status', 'sent');

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Όλες οι ειδοποιήσεις επισημάνθηκαν ως διαβασμένες",
      });

      loadNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η ενημέρωση των ειδοποιήσεων",
      });
    }
  };
  
  const unreadCount = notifications.filter(n => n.created_at > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).length;

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Ειδοποιήσεις
          </h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-muted-foreground">Όλες οι ενημερώσεις</p>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {unreadCount} νέες
              </Badge>
            )}
          </div>
        </div>

        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            className="w-full border-urban-border"
            onClick={markAllAsRead}
          >
            Επισήμανση όλων ως διαβασμένα
          </Button>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Φόρτωση ειδοποιήσεων...</p>
          </div>
        ) : (
          /* Notifications List */
          <div className="space-y-4">
            {notifications.map((notification) => {
              const isRecent = new Date(notification.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
              return (
                <Card 
                  key={notification.id} 
                  className={`bg-card border shadow-sm transition-all ${
                    isRecent ? "ring-1 ring-primary/20" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-sm">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {isRecent && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString('el-GR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                          >
                            {notification.type === "achievement" && "🏆 Επίτευγμα"}
                            {notification.type === "points" && "📈 Πόντοι"}
                            {notification.type === "goal" && "🎯 Στόχος"}
                            {notification.type === "warning" && "⚠️ Προσοχή"}
                            {notification.type === "info" && "ℹ️ Πληροφορία"}
                          </Badge>
                        </div>

                        {notification.employee_name && (
                          <div className="mt-2 p-2 bg-muted/50 rounded border border-urban-border">
                            <p className="text-xs text-muted-foreground">
                              Εργαζόμενος: <span className="font-medium text-foreground">{notification.employee_name}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State (if no notifications) */}
        {notifications.length === 0 && !loading && (
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">Καμία ειδοποίηση</h3>
              <p className="text-sm text-muted-foreground">
                Δεν υπάρχουν νέες ειδοποιήσεις αυτή τη στιγμή
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}