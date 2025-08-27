import { Home, Activity, Bell, Gift, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRewardsBadge } from "@/hooks/useRewardsBadge";
import { useNotifications } from "@/hooks/useNotifications";

interface EmployeeNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function EmployeeNavigation({ currentView, onViewChange }: EmployeeNavigationProps) {
  const { rewardsBadgeCount } = useRewardsBadge();
  const { unreadCount } = useNotifications();
  const navItems = [
    { id: "employee-dashboard", label: "Dashboard", icon: Home },
    { id: "events", label: "Συμβάντα", icon: Activity },
    { id: "employee-rewards", label: "Ανταμοιβές", icon: Gift, badge: rewardsBadgeCount > 0 ? rewardsBadgeCount : undefined },
    { id: "employee-notifications", label: "Ειδοποιήσεις", icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "employee-profile", label: "Προφίλ", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-urban-border shadow-urban z-50">
      <div className="flex justify-center overflow-x-auto py-2 px-2 max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const showBadge = item.badge && item.badge > 0;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onViewChange(item.id)}
              className={`relative flex flex-col items-center gap-1 p-3 h-auto transition-all duration-200 min-w-[80px] flex-shrink-0 ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
              {showBadge && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full text-xs flex items-center justify-center"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}