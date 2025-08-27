import { useState, useEffect, useCallback } from "react";
import { Clock, TrendingUp, TrendingDown, ChevronDown, ChevronRight, ArrowUp, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ActivityData {
  id: string;
  event_type: string;
  points: number;
  type: 'positive' | 'negative';
  created_at: string;
  description: string | null;
}

interface GroupedEvents {
  [key: string]: ActivityData[];
}

type FilterType = 'all' | 'positive' | 'negative';
type MonthFilter = 'current' | 'last' | 'custom';

const formatDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Σήμερα';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Χθες';
  } else {
    return date.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
};

const isRecentDate = (dateStr: string, index: number) => {
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return index < 2 || dateStr === today || dateStr === yesterday.toDateString();
};

export function EmployeeEventsScreen() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("current");
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ActivityData | null>(null);
  const { toast } = useToast();
  const { currentEmployee } = useAuth();

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDateFilter = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (monthFilter) {
      case 'current':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      default:
        return null;
    }
    
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const loadActivities = useCallback(async (reset = false) => {
    if (!currentEmployee) return;

    try {
      if (reset) {
        setLoading(true);
        setActivities([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      // Set RLS context
      await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      let query = supabase
        .from('employee_events')
        .select('*')
        .eq('employee_id', currentEmployee.id);

      // Apply month filter
      const dateRange = getDateFilter();
      if (dateRange) {
        query = query.gte('created_at', dateRange.startDate).lte('created_at', dateRange.endDate);
      }

      // Apply pagination
      if (!reset && activities.length > 0) {
        const lastActivity = activities[activities.length - 1];
        query = query.lt('created_at', lastActivity.created_at);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedActivities: ActivityData[] = (data || []).map(activity => ({
        id: activity.id,
        event_type: activity.event_type,
        points: activity.points,
        type: activity.points >= 0 ? 'positive' : 'negative',
        created_at: activity.created_at,
        description: activity.description
      }));

      if (reset) {
        setActivities(formattedActivities);
      } else {
        setActivities(prev => [...prev, ...formattedActivities]);
      }

      setHasMore(formattedActivities.length === 20);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των δραστηριοτήτων",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentEmployee?.id, monthFilter, activities.length]);

  const getEventTypeLabel = (eventType: string) => {
    const eventLabels: { [key: string]: string } = {
      'sale': 'Πώληση προϊόντος',
      'appointment': 'Ραντεβού επιτυχημένο', 
      'review': 'Review 5 αστέρων',
      'overtime': 'Επιπλέον ώρες',
      'upsell': 'Upselling υπηρεσίας',
      'late': 'Καθυστέρηση',
      'absence': 'Απουσία χωρίς ειδοποίηση',
      'complaint': 'Παράπονο πελάτη',
      'reward_redemption': 'Εξαργύρωση ανταμοιβής',
      'reward_redeem': 'Εξαργύρωση ανταμοιβής',
      'bonus_payout': 'Καταβολή μπόνους',
      'manual_adjustment': 'Χειροκίνητη προσαρμογή',
      'Πώληση προϊόντος': 'Πώληση προϊόντος',
      'Ραντεβού επιτυχημένο': 'Ραντεβού επιτυχημένο',
      'Review 5 αστέρων': 'Review 5 αστέρων', 
      'Επιπλέον ώρες': 'Επιπλέον ώρες',
      'Upselling υπηρεσίας': 'Upselling υπηρεσίας',
      'Καθυστέρηση': 'Καθυστέρηση',
      'Απουσία χωρίς ειδοποίηση': 'Απουσία χωρίς ειδοποίηση',
      'Παράπονο πελάτη': 'Παράπονο πελάτη',
      'Βοήθεια σε συνάδελφο': 'Βοήθεια σε συνάδελφο'
    };
    return eventLabels[eventType] || eventType;
  };

  const getStatusBadge = (event: any) => {
    // For reward redemptions, check if there's a status
    if (event.event_type.includes('redemption') || event.event_type.includes('reward') || event.event_type.includes('Εξαργύρωση')) {
      return (
        <Badge variant="outline" className="text-xs">
          Εγκρίθηκε
        </Badge>
      );
    }
    return null;
  };

  useEffect(() => {
    if (currentEmployee) {
      loadActivities(true);

      // Set up real-time subscription
      const channel = supabase
        .channel('employee-events-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public', 
            table: 'employee_events',
            filter: `employee_id=eq.${currentEmployee.id}`
          },
          () => {
            loadActivities(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentEmployee?.id, monthFilter]);

  const filteredActivities = activities.filter(activity => {
    if (filter === "all") return true;
    if (filter === "positive") return activity.type === "positive";
    if (filter === "negative") return activity.type === "negative";
    return true;
  });

  // Group activities by date
  const groupedActivities: GroupedEvents = filteredActivities.reduce((groups, activity) => {
    const dateKey = new Date(activity.created_at).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as GroupedEvents);

  const sortedDateKeys = Object.keys(groupedActivities).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Initialize collapsed groups (keep 2 most recent open)
  useEffect(() => {
    const newCollapsedGroups = new Set<string>();
    sortedDateKeys.forEach((dateKey, index) => {
      if (!isRecentDate(dateKey, index)) {
        newCollapsedGroups.add(dateKey);
      }
    });
    setCollapsedGroups(newCollapsedGroups);
  }, [sortedDateKeys.join(',')]);

  const toggleGroup = (dateKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPositive = activities
    .filter(activity => activity.type === "positive")
    .reduce((sum, activity) => sum + activity.points, 0);

  const totalNegative = Math.abs(activities
    .filter(activity => activity.type === "negative")
    .reduce((sum, activity) => sum + activity.points, 0));

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Ιστορικό Συμβάντων
          </h1>
          <p className="text-muted-foreground">Όλες οι δραστηριότητές σου</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-primary mr-2" />
              </div>
              <p className="text-2xl font-bold text-primary">+{totalPositive}</p>
              <p className="text-sm text-muted-foreground">Θετικοί Πόντοι</p>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingDown className="h-6 w-6 text-destructive mr-2" />
              </div>
              <p className="text-2xl font-bold text-destructive">-{totalNegative}</p>
              <p className="text-sm text-muted-foreground">Αρνητικοί Πόντοι</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="sticky top-4 bg-background/95 backdrop-blur-sm z-40 p-4 -mx-4 border-b">
          <div className="flex flex-col gap-3">
            {/* Month Filter */}
            <Select value={monthFilter} onValueChange={(value: MonthFilter) => setMonthFilter(value)}>
              <SelectTrigger className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Επιλέξτε μήνα" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Αυτός ο μήνας</SelectItem>
                <SelectItem value="last">Προηγούμενος μήνας</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['all', 'positive', 'negative'] as FilterType[]).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className="whitespace-nowrap"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {filterType === 'all' ? 'Όλα' : 
                   filterType === 'positive' ? 'Θετικά' : 'Αρνητικά'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Φόρτωση...</p>
            </div>
          ) : sortedDateKeys.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === "all" 
                  ? "Δεν έχετε ακόμα καμία δραστηριότητα"
                  : `Δεν βρέθηκαν ${filter === "positive" ? "θετικές" : "αρνητικές"} δραστηριότητες`}
              </p>
            </div>
          ) : (
            sortedDateKeys.map((dateKey) => {
              const isCollapsed = collapsedGroups.has(dateKey);
              const dayEvents = groupedActivities[dateKey];
              
              return (
                <Card key={dateKey} className="bg-card border shadow-sm">
                  <CardHeader 
                    className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroup(dateKey)}
                  >
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{formatDateGroup(dateKey)}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {dayEvents.length} συμβάντα
                        </Badge>
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  {!isCollapsed && (
                    <CardContent className="pt-0 space-y-2">
                      {dayEvents.map((activity) => (
                        <Drawer key={activity.id}>
                          <DrawerTrigger asChild>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors border">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{getEventTypeLabel(activity.event_type)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.created_at).toLocaleTimeString('el-GR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge 
                                  variant={activity.type === "positive" ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {activity.type === "positive" ? "+" : ""}{activity.points}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </DrawerTrigger>
                          
                          <DrawerContent>
                            <DrawerHeader>
                              <DrawerTitle className="text-left">Λεπτομέρειες Συμβάντος</DrawerTitle>
                            </DrawerHeader>
                            <div className="p-4 space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Τύπος Συμβάντος</h4>
                                <p className="text-sm text-muted-foreground">{getEventTypeLabel(activity.event_type)}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">Πόντοι</h4>
                                <Badge 
                                  variant={activity.type === "positive" ? "default" : "destructive"}
                                  className="text-sm"
                                >
                                  {activity.type === "positive" ? "+" : ""}{activity.points} πόντοι
                                </Badge>
                              </div>
                              
                              {activity.description && (
                                <div>
                                  <h4 className="font-semibold mb-2">Περιγραφή</h4>
                                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                                </div>
                              )}
                              
                              <div>
                                <h4 className="font-semibold mb-2">Ημερομηνία & Ώρα</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(activity.created_at).toLocaleDateString('el-GR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} στις {new Date(activity.created_at).toLocaleTimeString('el-GR')}
                                </p>
                              </div>
                            </div>
                          </DrawerContent>
                        </Drawer>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
          
          {/* Load More Button */}
          {hasMore && !loading && (
            <div className="text-center py-4">
              <Button 
                onClick={() => loadActivities(false)}
                disabled={loadingMore}
                variant="outline"
              >
                {loadingMore ? "Φόρτωση..." : "Φόρτωση παλαιότερων"}
              </Button>
            </div>
          )}
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 rounded-full p-3 shadow-lg z-50"
            size="sm"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
