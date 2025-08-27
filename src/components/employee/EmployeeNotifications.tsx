import { useEffect } from "react";
import { Bell, Check, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";

export function EmployeeNotifications() {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    // Mark all notifications as read when opening notifications page
    const markAllAsRead = async () => {
      const unreadNotifications = notifications.filter(n => !n.read_at);
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }
    };

    if (notifications.length > 0 && unreadCount > 0) {
      markAllAsRead();
    }
  }, [notifications, unreadCount, markAsRead]);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    
    // Handle deep linking
    if (notification.action_url) {
      toast({
        title: "Ανακατεύθυνση",
        description: `Ανακατεύθυνση σε: ${notification.action_url}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto text-center">Φόρτωση...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Ειδοποιήσεις
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} νέες ειδοποιήσεις` : 'Όλες οι ειδοποιήσεις διαβάστηκαν'}
          </p>
        </div>

        {notifications.length === 0 ? (
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Δεν έχεις ειδοποιήσεις</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${
                  !notification.read_at 
                    ? 'border-primary/20 bg-primary/5' 
                    : 'border-muted bg-card'
                } transition-all duration-200 cursor-pointer hover:bg-accent/50`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm">{notification.title}</h3>
                        {!notification.read_at && (
                          <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString('el-GR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}