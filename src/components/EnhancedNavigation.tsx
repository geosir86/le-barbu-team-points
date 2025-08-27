import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  Store, 
  CheckCircle, 
  Bell, 
  Settings, 
  LogOut,
  Plus,
  Calendar,
  UserPlus,
  Building,
  Gift
} from 'lucide-react';

interface EnhancedNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  pendingApprovalsCount?: number;
  notificationsCount?: number;
  storeCount?: number;
}

const quickActions = [
  { id: 'new-event', icon: Calendar, color: 'bg-blue-500' },
  { id: 'revenue-entry', icon: Building, color: 'bg-green-500' },
];

export function EnhancedNavigation({ 
  currentView, 
  onViewChange, 
  pendingApprovalsCount = 0,
  notificationsCount = 0,
  storeCount = 1
}: EnhancedNavigationProps) {
  const { t } = useTranslation();
  const [showFAB, setShowFAB] = useState(false);

  const navigationItems = [
    { id: 'manager-dashboard', label: t('dashboard'), icon: Home },
    { id: 'monthly-revenue', label: 'Μηνιαίος Τζίρος', icon: Building },
    { 
      id: 'approvals', 
      label: t('approvals'), 
      icon: CheckCircle,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined
    },
    { 
      id: 'notifications', 
      label: t('notifications'), 
      icon: Bell,
      badge: notificationsCount > 0 ? notificationsCount : undefined
    },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleQuickAction = (actionId: string) => {
    setShowFAB(false);
    
    // Add small delay to ensure FAB state change
    setTimeout(() => {
      switch (actionId) {
        case 'new-event':
          onViewChange('add-event');
          break;
        case 'revenue-entry':
          onViewChange('revenue-entry');
          break;
      }
    }, 100);
  };

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex justify-center overflow-x-auto px-2 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-2 relative min-w-[70px] flex-shrink-0 ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium truncate">
                  {item.label}
                </span>
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 z-50">
        {showFAB && (
          <div className="absolute bottom-16 right-0 space-y-3 animate-fade-in">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-3"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <span className="bg-card text-card-foreground px-3 py-1 rounded-lg text-sm font-medium shadow-md border">
                    {action.id === 'new-event' ? 'Νέο Συμβάν' : 'Καταχώρηση Τζίρου'}
                  </span>
                  <Button
                    size="icon"
                    className={`h-14 w-14 rounded-full shadow-lg ${action.color} text-white hover:scale-110 transition-all duration-200`}
                    onClick={() => handleQuickAction(action.id)}
                  >
                    <Icon className="h-6 w-6" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        
        <Button
          size="icon"
          className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${
            showFAB 
              ? 'bg-destructive text-destructive-foreground rotate-45' 
              : 'bg-primary text-primary-foreground hover:scale-110'
          }`}
          onClick={() => setShowFAB(!showFAB)}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </div>
    </>
  );
}