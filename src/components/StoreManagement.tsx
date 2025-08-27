import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Building, Plus, Edit2, Trash2, MapPin, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Store {
  id: string;
  name: string;
  location: string;
  monthly_goal: number;
  created_at?: string;
  updated_at?: string;
}

interface StoreWithStats extends Store {
  employees_count: number;
  total_points: number;
  avg_points: number;
}

export function StoreManagement() {
  const [stores, setStores] = useState<StoreWithStats[]>([]);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [newStore, setNewStore] = useState({
    name: "",
    location: "",
    monthly_goal: 1000,
  });

  const fetchStores = async () => {
    try {
      // First get all stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (storesError) throw storesError;

      // Then get employee statistics for each store
      const storesWithStats = await Promise.all(
        (storesData || []).map(async (store) => {
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('points_balance')
            .eq('store_id', store.id)
            .eq('is_active', true);

          if (employeesError) {
            console.warn(`Error fetching employees for store ${store.id}:`, employeesError);
          }

          const employees = employeesData || [];
          const totalPoints = employees.reduce((sum, emp) => sum + (emp.points_balance || 0), 0);
          const avgPoints = employees.length > 0 ? Math.round(totalPoints / employees.length) : 0;

          return {
            ...store,
            employees_count: employees.length,
            total_points: totalPoints,
            avg_points: avgPoints,
          };
        })
      );

      setStores(storesWithStats);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των καταστημάτων",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.location) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία!",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('stores')
        .insert([{
          name: newStore.name,
          location: newStore.location,
          monthly_goal: newStore.monthly_goal,
        }]);

      if (error) throw error;

      setNewStore({ name: "", location: "", monthly_goal: 1000 });
      setIsAddDialogOpen(false);
      toast({
        title: "Επιτυχία!",
        description: "Νέο κατάστημα προστέθηκε!",
      });
      
      fetchStores();
    } catch (error) {
      console.error('Error adding store:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά την προσθήκη",
      });
    }
  };

  const handleEditStore = async () => {
    if (!editingStore) return;
    
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: editingStore.name,
          location: editingStore.location,
          monthly_goal: editingStore.monthly_goal,
        })
        .eq('id', editingStore.id);

      if (error) throw error;

      setEditingStore(null);
      toast({
        title: "Επιτυχία!",
        description: "Το κατάστημα ενημερώθηκε!",
      });
      
      fetchStores();
    } catch (error) {
      console.error('Error updating store:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά την ενημέρωση",
      });
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε το κατάστημα;")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: "Το κατάστημα διαγράφηκε!",
      });
      
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά τη διαγραφή",
      });
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const getProgressPercentage = (current: number, goal: number): number => {
    return Math.min((current / goal) * 100, 100);
  };

  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 100) return { status: "Στόχος επιτεύχθηκε", color: "text-green-600" };
    if (percentage >= 80) return { status: "Πολύ καλή πορεία", color: "text-blue-600" };
    if (percentage >= 60) return { status: "Καλή πορεία", color: "text-yellow-600" };
    return { status: "Χρειάζεται βελτίωση", color: "text-red-600" };
  };

  const totalStores = stores.length;
  const totalEmployees = stores.reduce((sum, store) => sum + store.employees_count, 0);
  const totalPoints = stores.reduce((sum, store) => sum + store.total_points, 0);
  const avgStorePerformance = stores.length > 0 ? 
    stores.reduce((sum, store) => sum + getProgressPercentage(store.total_points, store.monthly_goal), 0) / stores.length : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded-lg mb-6"></div>
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Store Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-gradient-gold hover:bg-gradient-gold/90">
            <Plus className="w-4 h-4 mr-2" />
            Προσθήκη Νέου Καταστήματος
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Προσθήκη Νέου Καταστήματος</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Όνομα Καταστήματος</Label>
              <Input
                value={newStore.name}
                onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                placeholder="π.χ. Κατάστημα Βόρεια"
              />
            </div>
            <div>
              <Label>Περιοχή</Label>
              <Input
                value={newStore.location}
                onChange={(e) => setNewStore({...newStore, location: e.target.value})}
                placeholder="π.χ. Κηφισιά"
              />
            </div>
            <div>
              <Label>Μηνιαίος Στόχος (πόντοι)</Label>
              <Input
                type="number"
                value={newStore.monthly_goal}
                onChange={(e) => setNewStore({...newStore, monthly_goal: Number(e.target.value)})}
                placeholder="1000"
              />
            </div>
            <Button onClick={handleAddStore} className="w-full">
              Προσθήκη Καταστήματος
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Store Dialog */}
      <Dialog open={!!editingStore} onOpenChange={() => setEditingStore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Επεξεργασία Καταστήματος</DialogTitle>
          </DialogHeader>
          {editingStore && (
            <div className="space-y-4">
              <div>
                <Label>Όνομα Καταστήματος</Label>
                <Input
                  value={editingStore.name}
                  onChange={(e) => setEditingStore({...editingStore, name: e.target.value})}
                  placeholder="π.χ. Κατάστημα Βόρεια"
                />
              </div>
              <div>
                <Label>Περιοχή</Label>
                <Input
                  value={editingStore.location}
                  onChange={(e) => setEditingStore({...editingStore, location: e.target.value})}
                  placeholder="π.χ. Κηφισιά"
                />
              </div>
              <div>
                <Label>Μηνιαίος Στόχος (πόντοι)</Label>
                <Input
                  type="number"
                  value={editingStore.monthly_goal}
                  onChange={(e) => setEditingStore({...editingStore, monthly_goal: Number(e.target.value)})}
                  placeholder="1000"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditStore} className="flex-1">
                  Αποθήκευση
                </Button>
                <Button variant="outline" onClick={() => setEditingStore(null)} className="flex-1">
                  Ακύρωση
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Overall Statistics - Owner View */}
      <Card className="bg-card border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            📈 Συνολική Εικόνα (Owner View)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalStores}</div>
              <div className="text-sm text-muted-foreground">Καταστήματα</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">{totalEmployees}</div>
              <div className="text-sm text-muted-foreground">Εργαζόμενοι</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Σύνολο Πόντων</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{avgStorePerformance.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Μέση Απόδοση</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores List */}
      <div className="grid gap-4">
        {stores.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Δεν υπάρχουν καταστήματα</h3>
              <p className="text-muted-foreground mb-4">
                Προσθέστε το πρώτο κατάστημα για να αρχίσετε
              </p>
            </CardContent>
          </Card>
        ) : (
          stores.map((store) => {
            const progressPercentage = getProgressPercentage(store.total_points, store.monthly_goal);
            const performance = getPerformanceStatus(progressPercentage);

            return (
              <Card key={store.id} className="bg-card border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="w-6 h-6 text-accent" />
                      <div>
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {store.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingStore(store)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteStore(store.id)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Employees Count */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span>Εργαζόμενοι</span>
                    </div>
                    <Badge variant="secondary">{store.employees_count} άτομα</Badge>
                  </div>

                  {/* Monthly Goal Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Μηνιαίος Στόχος</span>
                      <span className={performance.color}>{performance.status}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{store.total_points} / {store.monthly_goal} πόντοι</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary">
                        {store.total_points}
                      </div>
                      <div className="text-xs text-muted-foreground">Συνολικοί Πόντοι</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-accent">
                        {store.avg_points}
                      </div>
                      <div className="text-xs text-muted-foreground">Μ.Ο. ανά εργαζόμενο</div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      📊 Αναλυτικά Στοιχεία
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      👥 Εργαζόμενοι
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Performance Rankings */}
      {stores.length > 0 && (
        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              🏆 Κατάταξη Απόδοσης
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stores
                .sort((a, b) => getProgressPercentage(b.total_points, b.monthly_goal) - getProgressPercentage(a.total_points, a.monthly_goal))
                .map((store, index) => {
                  const progressPercentage = getProgressPercentage(store.total_points, store.monthly_goal);
                  return (
                    <div key={store.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-urban-border">
                      <div className="text-2xl font-bold w-8 text-center">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{store.name}</div>
                        <div className="text-sm text-muted-foreground">{store.location}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{progressPercentage.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {store.total_points}/{store.monthly_goal}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}