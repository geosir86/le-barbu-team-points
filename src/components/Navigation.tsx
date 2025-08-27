import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Users, Gift, Settings, BarChart3, Bell, Activity, FileText, User, Store, Plus, CheckCircle } from "lucide-react";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isManager?: boolean;
}

export function Navigation({ currentView, onViewChange, isManager = false }: NavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = isManager ? [
    { name: "Dashboard", icon: BarChart3, view: "dashboard" },
    { name: "Εργαζόμενοι", icon: Users, view: "employees" },
    { name: "Εγκρίσεις", icon: CheckCircle, view: "approvals" },
    { name: "Καταστήματα", icon: Store, view: "stores" },
    { name: "Ειδοποιήσεις", icon: Bell, view: "notifications" },
    { name: "Ρυθμίσεις", icon: Settings, view: "settings" },
  ] : [
    { name: "Dashboard", icon: Home, view: "employee-dashboard" },
    { name: "Δραστηριότητα", icon: Activity, view: "activity" },
    { name: "Ανταμοιβές", icon: Gift, view: "rewards" },
    { name: "Αιτήσεις", icon: FileText, view: "requests" },
    { name: "Προφίλ", icon: User, view: "profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
      <div className={`flex ${isExpanded ? 'flex-wrap justify-center' : 'justify-around'} items-center py-2 px-1`}>
        {navItems.slice(0, isExpanded ? navItems.length : 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          
          return (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              onClick={() => onViewChange(item.view)}
              className={`flex flex-col items-center gap-1 p-2 h-auto ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              } ${isExpanded ? 'min-w-[80px] mb-2' : 'flex-1'}`}
            >
              <Icon size={18} />
              <span className="text-xs font-medium">{item.name}</span>
            </Button>
          );
        })}
        
        {!isExpanded && navItems.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="flex flex-col items-center gap-1 p-2 h-auto text-muted-foreground hover:text-foreground flex-1"
          >
            <Plus size={18} />
            <span className="text-xs font-medium">Άλλα</span>
          </Button>
        )}
        
        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="flex flex-col items-center gap-1 p-2 h-auto text-muted-foreground hover:text-foreground min-w-[80px] mb-2"
          >
            <Plus size={18} className="rotate-45" />
            <span className="text-xs font-medium">Κλείσιμο</span>
          </Button>
        )}
      </div>

      {/* Floating Action Button for Add Event (Manager only) */}
      {isManager && (
        <Button
          onClick={() => onViewChange("add-event")}
          className="fixed bottom-20 right-4 z-40 rounded-full w-14 h-14 bg-gradient-gold hover:bg-gradient-gold/90 shadow-lg animate-pulse"
          size="sm"
        >
          <Plus size={24} />
        </Button>
      )}
    </div>
  );
}