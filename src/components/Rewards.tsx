import { useState, useEffect } from "react";
import { Gift, Trophy, Star, Coffee, ShoppingBag, Gamepad2, Euro, Calendar, Users, CheckCircle, Clock, XCircle, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContextManager } from "@/hooks/useContextManager";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  icon: string;
  category: string;
  type: 'cash' | 'dayoff' | 'other';
  stock?: number;
  is_active: boolean;
}

interface RedemptionRequest {
  id: string;
  reward_id: string;
  reward_name: string;
  points_cost: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  decided_at?: string;
  delivered_code?: string;
  manager_comment?: string;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'euro': return Euro;
    case 'calendar': return Calendar;
    case 'users': return Users;
    case 'gift': return Gift;
    case 'coffee': return Coffee;
    case 'shopping-bag': return ShoppingBag;
    case 'gamepad': return Gamepad2;
    case 'trophy': return Trophy;
    case 'star': return Star;
    default: return Gift;
  }
};

export function Rewards() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [userPoints, setUserPoints] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRequests, setMyRequests] = useState<RedemptionRequest[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cancel dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<RedemptionRequest | null>(null);
  
  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [requestToEdit, setRequestToEdit] = useState<RedemptionRequest | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  
  const { toast } = useToast();
  const { currentEmployee } = useAuth();
  const { setEmployeeContext, isManagerMode } = useContextManager();

  useEffect(() => {
    if (currentEmployee) {
      // Set employee context for RLS when component mounts (only if not in manager mode)
      const setContext = async () => {
        if (isManagerMode()) {
          console.log('🚫 Rewards: Blocked context setting - in manager mode');
          return;
        }
        
        try {
          console.log('🎯 Rewards: Setting employee context for:', currentEmployee.id);
          const success = await setEmployeeContext(currentEmployee.id);
          if (success) {
            console.log('✅ Rewards: Employee context set successfully');
          } else {
            console.error('❌ Rewards: Failed to set employee context');
          }
        } catch (error) {
          console.error('Error in setContext:', error);
        }
      };
      
      setContext().then(() => {
        loadData();
      });
    }
  }, [currentEmployee]);

  const loadData = async () => {
    if (!currentEmployee) return;

    try {
      // Set employee context first for RLS
      const { error: contextError } = await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      if (contextError) {
        console.error('Error setting employee context:', contextError);
      }

      // Load employee points, rewards, and user's redemption requests in parallel
      const [pointsResponse, rewardsResponse, requestsResponse] = await Promise.all([
        supabase
          .from('employees')
          .select('points_balance')
          .eq('id', currentEmployee.id)
          .single(),
        supabase
          .from('rewards_catalog')
          .select('*')
          .eq('is_active', true)
          .order('points_cost', { ascending: true }),
        supabase
          .from('reward_redemptions')
          .select('*')
          .eq('employee_id', currentEmployee.id)
          .order('created_at', { ascending: false })
      ]);

      if (pointsResponse.error) throw pointsResponse.error;
      if (rewardsResponse.error) throw rewardsResponse.error;
      if (requestsResponse.error) throw requestsResponse.error;

      setUserPoints(pointsResponse.data.points_balance || 0);
      setRewards((rewardsResponse.data || []).map(reward => ({
        ...reward,
        type: reward.type as 'cash' | 'dayoff' | 'other'
      })));
      setMyRequests((requestsResponse.data || []).map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'rejected' | 'cancelled'
      })));
      
      // Extract unique categories and types
      const categories = [...new Set((rewardsResponse.data || []).map(reward => reward.category))];
      const types = [...new Set((rewardsResponse.data || []).map(reward => reward.type))];
      setAvailableCategories(categories);
      setAvailableTypes(types);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των δεδομένων",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRewards = rewards.filter(reward => {
    const categoryMatch = selectedCategory === "all" || reward.category === selectedCategory;
    const typeMatch = selectedType === "all" || reward.type === selectedType;
    return categoryMatch && typeMatch;
  });

  const handleRedeem = async (reward: Reward) => {
    if (!currentEmployee) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συνδεθείτε για να εξαργυρώσετε ανταμοιβές",
      });
      return;
    }

    if (userPoints < reward.points_cost) {
      toast({
        variant: "destructive",
        title: "Ανεπαρκή πόντοι",
        description: `Χρειάζεστε ${reward.points_cost - userPoints} επιπλέον πόντους για αυτή την ανταμοιβή.`,
      });
      return;
    }

    try {
      console.log('Starting redemption for reward:', reward);
      console.log('Current employee:', currentEmployee);

      // Set the current employee context for RLS
      const { error: contextError } = await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      if (contextError) {
        console.error('Error setting employee context:', contextError);
        throw contextError;
      }

      console.log('Employee context set successfully');

      // Only create redemption request (not employee_requests)
      const { data, error } = await supabase
        .from('reward_redemptions')
        .insert({
          employee_id: currentEmployee.id,
          reward_id: reward.id,
          reward_name: reward.name,
          points_cost: reward.points_cost,
          status: 'pending'
        })
        .select();

      console.log('Redemption result:', { data, error });

      if (error) throw error;

      toast({
        title: "Επιτυχία!",
        description: "Το αίτημα στάλθηκε για έγκριση.",
      });

      // Refresh data
      loadData();
      
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: `Δεν ήταν δυνατή η αποστολή αιτήματος εξαργύρωσης: ${error.message || 'Άγνωστο σφάλμα'}`,
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Cash';
      case 'dayoff': return 'Dayoff';  
      case 'other': return 'Other';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Εκκρεμεί</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Εγκρίθηκε</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Απορρίφθηκε</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-muted-foreground"><X className="w-3 h-3 mr-1" />Ακυρώθηκε</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCancelRequest = (request: RedemptionRequest) => {
    setRequestToCancel(request);
    setShowCancelDialog(true);
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel || !currentEmployee) return;

    try {
      // Set employee context
      await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      // Re-fetch the request to check if it's still pending (concurrency guard)
      const { data: currentRequestData, error: fetchError } = await supabase
        .from('reward_redemptions')
        .select('status')
        .eq('id', requestToCancel.id)
        .single();

      if (fetchError) throw fetchError;

      if (currentRequestData.status !== 'pending') {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Το αίτημα επεξεργάστηκε/ολοκληρώθηκε στο μεταξύ.",
        });
        setShowCancelDialog(false);
        setRequestToCancel(null);
        loadData(); // Refresh to show current state
        return;
      }

      // Cancel the request
      const { error } = await supabase
        .from('reward_redemptions')
        .update({
          status: 'cancelled',
          decided_at: new Date().toISOString()
        })
        .eq('id', requestToCancel.id);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το αίτημα ακυρώθηκε.",
      });

      loadData();
      setShowCancelDialog(false);
      setRequestToCancel(null);

    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η ακύρωση του αιτήματος.",
      });
    }
  };

  const handleEditRequest = (request: RedemptionRequest) => {
    setRequestToEdit(request);
    setSelectedRewardId(request.reward_id);
    setShowEditDialog(true);
  };

  const confirmEditRequest = async () => {
    if (!requestToEdit || !currentEmployee || !selectedRewardId) return;

    const selectedReward = rewards.find(r => r.id === selectedRewardId);
    if (!selectedReward) return;

    // Pre-check balance
    if (userPoints < selectedReward.points_cost) {
      toast({
        variant: "destructive",
        title: "Ανεπαρκή πόντοι",
        description: `Χρειάζεστε ${selectedReward.points_cost - userPoints} επιπλέον πόντους για αυτή την ανταμοιβή.`,
      });
      return;
    }

    setEditLoading(true);

    try {
      // Set employee context
      await supabase.rpc('set_current_employee_id', { 
        employee_id: currentEmployee.id 
      });

      // Re-fetch the request to check if it's still pending (concurrency guard)
      const { data: currentRequestData, error: fetchError } = await supabase
        .from('reward_redemptions')
        .select('status')
        .eq('id', requestToEdit.id)
        .single();

      if (fetchError) throw fetchError;

      if (currentRequestData.status !== 'pending') {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Το αίτημα επεξεργάστηκε/ολοκληρώθηκε στο μεταξύ.",
        });
        setShowEditDialog(false);
        setRequestToEdit(null);
        loadData(); // Refresh to show current state
        return;
      }

      // Update the request
      const { error } = await supabase
        .from('reward_redemptions')
        .update({
          reward_id: selectedReward.id,
          reward_name: selectedReward.name,
          points_cost: selectedReward.points_cost
        })
        .eq('id', requestToEdit.id);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Οι αλλαγές αποθηκεύτηκαν.",
      });

      loadData();
      setShowEditDialog(false);
      setRequestToEdit(null);
      setSelectedRewardId("");

    } catch (error) {
      console.error('Error editing request:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η επεξεργασία του αιτήματος.",
      });
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto text-center">
          <div className="text-muted-foreground">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Ανταμοιβές
          </h1>
          <p className="text-muted-foreground">
            Διαθέσιμοι πόντοι: <span className="text-primary font-bold">{userPoints}</span>
          </p>
        </div>

        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rewards">Διαθέσιμες</TabsTrigger>
            <TabsTrigger value="requests">
              Τα αιτήματά μου
              {myRequests.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {myRequests.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-4">
            {/* Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
                className="whitespace-nowrap flex-shrink-0"
              >
                Όλες
              </Button>
              {availableTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {getTypeLabel(type)}
                </Button>
              ))}
            </div>

            {/* Rewards Grid */}
            <div className="space-y-4">
              {filteredRewards.map((reward) => {
                const Icon = getIconComponent(reward.icon);
                const canAfford = userPoints >= reward.points_cost;
                const outOfStock = reward.stock !== null && reward.stock <= 0;

                return (
                  <Card key={reward.id} className={`bg-card border shadow-sm ${canAfford && !outOfStock ? '' : 'opacity-60'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${canAfford && !outOfStock ? 'bg-primary/20' : 'bg-muted/20'}`}>
                            <Icon className={`h-5 w-5 ${canAfford && !outOfStock ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{reward.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{reward.description}</p>
                            {reward.stock !== null && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Διαθέσιμα: {reward.stock}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={canAfford && !outOfStock ? "default" : "secondary"}>
                          {reward.points_cost} πόντοι
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford || outOfStock}
                        className="w-full"
                        variant={canAfford && !outOfStock ? "default" : "outline"}
                      >
                        {outOfStock 
                          ? "Μη διαθέσιμη" 
                          : canAfford 
                            ? "Εξαργύρωση" 
                            : `Χρειάζονται ${reward.points_cost - userPoints} επιπλέον πόντοι`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredRewards.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Δεν βρέθηκαν ανταμοιβές σε αυτή την κατηγορία</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {/* My Requests List */}
            <div className="space-y-4">
              {myRequests.filter(request => request.status !== 'cancelled').map((request) => (
                <Card key={request.id} className="bg-card border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.reward_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('el-GR')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(request.status)}
                        <Badge variant="outline">
                          {request.points_cost} πόντοι
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {(request.status === 'approved' && request.delivered_code) && (
                    <CardContent className="pt-0">
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                          Κωδικός:
                        </p>
                        <code className="text-green-900 dark:text-green-100 font-mono text-lg">
                          {request.delivered_code}
                        </code>
                      </div>
                    </CardContent>
                  )}
                   {request.status === 'rejected' && request.manager_comment && (
                     <CardContent className="pt-0">
                       <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                         <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                           Σχόλιο απόρριψης:
                         </p>
                         <p className="text-red-900 dark:text-red-100 text-sm">
                           {request.manager_comment}
                         </p>
                       </div>
                     </CardContent>
                   )}
                   {request.status === 'pending' && (
                     <CardContent className="pt-0">
                       <div className="flex gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleEditRequest(request)}
                           className="flex-1"
                         >
                           <Pencil className="w-4 h-4 mr-1" />
                           Επεξεργασία
                         </Button>
                         <Button
                           variant="destructive"
                           size="sm"
                           onClick={() => handleCancelRequest(request)}
                           className="flex-1"
                         >
                           <X className="w-4 h-4 mr-1" />
                           Ακύρωση
                         </Button>
                       </div>
                     </CardContent>
                   )}
                 </Card>
              ))}
            </div>

            {myRequests.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Δεν έχετε κάνει ακόμα κανένα αίτημα εξαργύρωσης</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ακύρωση αιτήματος;</DialogTitle>
              <DialogDescription>
                Θέλεις σίγουρα να ακυρώσεις αυτό το αίτημα;
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Όχι
              </Button>
              <Button variant="destructive" onClick={confirmCancelRequest}>
                Ναι, ακύρωση
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Request Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Επεξεργασία Αιτήματος</DialogTitle>
              <DialogDescription>
                Επιλέξτε μια νέα ανταμοιβή για το αίτημά σας.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Ανταμοιβή:</label>
                <Select value={selectedRewardId} onValueChange={setSelectedRewardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Επιλέξτε ανταμοιβή" />
                  </SelectTrigger>
                  <SelectContent>
                    {rewards
                      .filter(reward => reward.is_active)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((reward) => {
                        const Icon = getIconComponent(reward.icon);
                        const canAfford = userPoints >= reward.points_cost;
                        return (
                          <SelectItem key={reward.id} value={reward.id} disabled={!canAfford}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{reward.name}</span>
                              <Badge variant={canAfford ? "default" : "secondary"} className="ml-auto">
                                {reward.points_cost} πόντοι
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
              {selectedRewardId && (() => {
                const selectedReward = rewards.find(r => r.id === selectedRewardId);
                return selectedReward && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {selectedReward.description}
                    </p>
                  </div>
                );
              })()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={editLoading}>
                Ακύρωση
              </Button>
              <Button onClick={confirmEditRequest} disabled={!selectedRewardId || editLoading}>
                {editLoading ? "Αποθήκευση..." : "Αποθήκευση"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}