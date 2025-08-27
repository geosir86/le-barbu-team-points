import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, User, Gift, Euro, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useContextManager } from "@/hooks/useContextManager";

interface EmployeeRequest {
  id: string;
  employee_id: string;
  request_type: 'positive' | 'negative';
  event_type: string;
  description: string | null;
  points: number;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  employee_name?: string;
}

interface RewardRedemption {
  id: string;
  employee_id: string;
  reward_name: string;
  points_cost: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  employee_name?: string;
}

interface KudosApproval {
  id: string;
  employee_id: string;
  from_employee_id: string;
  title: string;
  message: string;
  category: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  employee_name?: string;
  from_employee_name?: string;
}

interface BonusRequest {
  id: string;
  employee_id: string;
  bonus_value: number;
  bonus_type: 'EUR' | 'POINTS';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  employee_name?: string;
}

export function ApprovalRequests() {
  const [employeeRequests, setEmployeeRequests] = useState<EmployeeRequest[]>([]);
  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemption[]>([]);
  const [kudosApprovals, setKudosApprovals] = useState<KudosApproval[]>([]);
  const [bonusRequests, setBonusRequests] = useState<BonusRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState<{ [key: string]: string }>({});
  const [editingAmount, setEditingAmount] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();
  const { setManagerContext, isManagerMode } = useContextManager();

  // Ensure manager context is set and maintained
  const ensureManagerContext = async () => {
    if (!isManagerMode()) {
      const success = await setManagerContext();
      if (!success) {
        console.error('Failed to set manager context');
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const initializeManagerMode = async () => {
      console.log('🚀 Initializing ApprovalRequests in MANAGER mode');
      const contextSet = await ensureManagerContext();
      if (contextSet) {
        loadData();
      } else {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν ήταν δυνατή η εκκίνηση του manager mode",
        });
      }
    };
    initializeManagerMode();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Ensure we maintain manager context during data loading
      await ensureManagerContext();
      
      console.log('📊 Loading approval data in MANAGER context');
      
      // Load employee requests
      const { data: requests, error: requestsError } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Load employee names for requests
      const requestsWithNames: EmployeeRequest[] = [];
      if (requests) {
        for (const req of requests) {
          const { data: employee } = await supabase
            .from('employees')
            .select('full_name')
            .eq('id', req.employee_id)
            .single();
          
          requestsWithNames.push({
            ...req,
            request_type: req.request_type as 'positive' | 'negative',
            status: req.status as 'pending' | 'approved' | 'rejected',
            employee_name: employee?.full_name || 'Άγνωστος',
            amount: req.amount || 0
          });
          
          // Initialize editing amount if request has an amount
          if (req.amount && req.amount > 0) {
            setEditingAmount(prev => ({
              ...prev,
              [req.id]: req.amount / 100 // Convert from cents to euros
            }));
          }
        }
      }

      // Load reward redemptions
      const { data: redemptions, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (redemptionsError) throw redemptionsError;

      // Load employee names for redemptions
      const redemptionsWithNames: RewardRedemption[] = [];
      if (redemptions) {
        for (const red of redemptions) {
          const { data: employee } = await supabase
            .from('employees')
            .select('full_name')
            .eq('id', red.employee_id)
            .single();
          
          redemptionsWithNames.push({
            ...red,
            status: red.status as 'pending' | 'approved' | 'rejected',
            employee_name: employee?.full_name || 'Άγνωστος'
          });
        }
      }

      // Load kudos approvals
      const { data: kudosData, error: kudosError } = await supabase
        .from('employee_feedback')
        .select('*')
        .eq('feedback_type', 'kudos')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (kudosError) throw kudosError;

      // Load employee names for kudos
      const kudosWithNames: KudosApproval[] = [];
      if (kudosData) {
        for (const kudos of kudosData) {
          const { data: employee } = await supabase
            .from('employees')
            .select('full_name')
            .eq('id', kudos.employee_id)
            .single();
            
          const { data: fromEmployee } = await supabase
            .from('employees')
            .select('full_name')
            .eq('id', kudos.from_employee_id)
            .single();

          kudosWithNames.push({
            ...kudos,
            status: kudos.status as 'pending' | 'approved' | 'rejected',
            employee_name: employee?.full_name || 'Άγνωστος',
            from_employee_name: fromEmployee?.full_name || 'Άγνωστος'
          });
        }
      }

      // Load bonus requests
      const { data: bonusData, error: bonusError } = await supabase
        .from('bonus_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (bonusError) throw bonusError;

      // Load employee names for bonus requests
      const bonusWithNames: BonusRequest[] = [];
      if (bonusData) {
        for (const bonus of bonusData) {
          const { data: employee } = await supabase
            .from('employees')
            .select('full_name')
            .eq('id', bonus.employee_id)
            .single();
          
          bonusWithNames.push({
            ...bonus,
            status: bonus.status as 'pending' | 'approved' | 'rejected',
            bonus_type: bonus.bonus_type as 'EUR' | 'POINTS',
            employee_name: employee?.full_name || 'Άγνωστος'
          });
        }
      }

      setEmployeeRequests(requestsWithNames);
      setRewardRedemptions(redemptionsWithNames);
      setKudosApprovals(kudosWithNames);
      setBonusRequests(bonusWithNames);

    } catch (error) {
      console.error('Error loading approval data:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των εγκρίσεων",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveEmployeeRequest = async (requestId: string) => {
    try {
      // Ensure we're in manager context
      const contextSet = await ensureManagerContext();
      if (!contextSet) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν είστε σε manager mode",
        });
        return;
      }
      
      const request = employeeRequests.find(r => r.id === requestId);
      if (!request) return;

      console.log('Approving request:', request);

      // Get the updated amount if it was edited
      const finalAmount = editingAmount[requestId] ? Math.round(editingAmount[requestId] * 100) : (request.amount || 0);

      // Approve the request with updated amount
      const { error: updateError } = await supabase
        .from('employee_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'manager',
          notes: approvalNotes[requestId] || null,
          amount: finalAmount
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
        throw updateError;
      }

      // Create employee event
      const eventData = {
        employee_id: request.employee_id,
        event_type: request.event_type,
        points: request.points,
        description: request.description,
        created_by: 'manager',
        notes: `Εγκρίθηκε αίτηση: ${request.description || request.event_type}${finalAmount > 0 ? ` - Ποσό: €${(finalAmount / 100).toFixed(2)}` : ''}`
      };

      console.log('Creating employee event:', eventData);

      const { error: eventError } = await supabase
        .from('employee_events')
        .insert(eventData);

      if (eventError) {
        console.error('Error creating event:', eventError);
        throw eventError;
      }

      // If this is a sale with amount, update weekly revenue
      if (finalAmount > 0 && request.event_type.toLowerCase().includes('πώληση')) {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const weekStart = monday.toISOString().split('T')[0];

        await supabase
          .from('weekly_revenue')
          .upsert({
            employee_id: request.employee_id,
            week_start_date: weekStart,
            revenue_amount: finalAmount
          }, {
            onConflict: 'employee_id,week_start_date'
          });
      }

      toast({
        title: "Επιτυχία",
        description: "Η αίτηση εγκρίθηκε και οι πόντοι καταχωρίστηκαν",
      });

      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: `Δεν ήταν δυνατή η έγκριση: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`,
      });
    }
  };

  const rejectEmployeeRequest = async (requestId: string) => {
    try {
      // Ensure we're in manager context
      await ensureManagerContext();
      
      const { error } = await supabase
        .from('employee_requests')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: 'manager',
          notes: approvalNotes[requestId] || null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η αίτηση απορρίφθηκε",
      });

      loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η απόρριψη της αίτησης",
      });
    }
  };

  const approveRewardRedemption = async (redemptionId: string) => {
    try {
      const contextSet = await ensureManagerContext();
      if (!contextSet) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν είστε σε manager mode",
        });
        return;
      }

      // Use atomic RPC function for approval
      const { data, error } = await supabase.rpc('approve_reward_redemption', {
        redemption_id: redemptionId,
        manager_notes: approvalNotes[redemptionId] || null
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η εξαργύρωση εγκρίθηκε επιτυχώς",
      });

      loadData();
    } catch (error) {
      console.error('Error approving redemption:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Αποτυχία έγκρισης εξαργύρωσης",
      });
    }
  };

  const rejectRewardRedemption = async (redemptionId: string) => {
    try {
      const contextSet = await ensureManagerContext();
      if (!contextSet) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν είστε σε manager mode",
        });
        return;
      }

      // Use atomic RPC function for rejection
      const { data, error } = await supabase.rpc('reject_reward_redemption', {
        redemption_id: redemptionId,
        manager_notes: approvalNotes[redemptionId] || null
      });

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το αίτημα απορρίφθηκε.",
      });

      loadData();
    } catch (error) {
      console.error('Error rejecting redemption:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η απόρριψη του αιτήματος",
      });
    }
  };

  const approveKudos = async (kudosId: string) => {
    try {
      // Ensure we're in manager context
      await ensureManagerContext();
      
      const { error } = await supabase
        .from('employee_feedback')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'manager'
        })
        .eq('id', kudosId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το kudos εγκρίθηκε",
      });

      loadData();
    } catch (error) {
      console.error('Error approving kudos:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η έγκριση του kudos",
      });
    }
  };

  const rejectKudos = async (kudosId: string) => {
    try {
      // Ensure we're in manager context
      await ensureManagerContext();
      
      const { error } = await supabase
        .from('employee_feedback')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: 'manager'
        })
        .eq('id', kudosId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το kudos απορρίφθηκε",
      });

      loadData();
    } catch (error) {
      console.error('Error rejecting kudos:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η απόρριψη του kudos",
      });
    }
  };

  const approveBonusRequest = async (bonusId: string) => {
    try {
      // Ensure we're in manager context
      await ensureManagerContext();
      
      const bonusRequest = bonusRequests.find(b => b.id === bonusId);
      if (!bonusRequest) return;

      // Approve the bonus request
      const { error: updateError } = await supabase
        .from('bonus_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'manager',
          notes: approvalNotes[bonusId] || null
        })
        .eq('id', bonusId);

      if (updateError) throw updateError;

      // If bonus is in points, add to employee balance
      if (bonusRequest.bonus_type === 'POINTS') {
        const { data: currentEmployee } = await supabase
          .from('employees')
          .select('points_balance')
          .eq('id', bonusRequest.employee_id)
          .single();

        if (currentEmployee) {
          const { error: pointsError } = await supabase
            .from('employees')
            .update({
              points_balance: currentEmployee.points_balance + bonusRequest.bonus_value
            })
            .eq('id', bonusRequest.employee_id);

          if (pointsError) throw pointsError;
        }
      }
      // If EUR, just record as payout (no points change needed)

      toast({
        title: "Επιτυχία",
        description: bonusRequest.bonus_type === 'POINTS' 
          ? "Το bonus εγκρίθηκε και οι πόντοι προστέθηκαν"
          : "Το bonus εγκρίθηκε για payout",
      });

      loadData();
    } catch (error) {
      console.error('Error approving bonus:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η έγκριση του bonus",
      });
    }
  };

  const rejectBonusRequest = async (bonusId: string) => {
    try {
      // Ensure we're in manager context
      await ensureManagerContext();
      
      const { error } = await supabase
        .from('bonus_requests')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: 'manager',
          notes: approvalNotes[bonusId] || null
        })
        .eq('id', bonusId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το bonus απορρίφθηκε",
      });

      loadData();
    } catch (error) {
      console.error('Error rejecting bonus:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η απόρριψη του bonus",
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Εγκρίσεις
          </h1>
          <p className="text-muted-foreground">Διαχείριση εκκρεμών αιτήσεων</p>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Αιτήσεις ({employeeRequests.length})
            </TabsTrigger>
            <TabsTrigger value="kudos" className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Kudos ({kudosApprovals.length})
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Ανταμοιβές ({rewardRedemptions.length})
            </TabsTrigger>
            <TabsTrigger value="bonus" className="flex items-center gap-1">
              <Euro className="h-3 w-3" />
              Bonus ({bonusRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            {employeeRequests.length === 0 ? (
              <Card className="bg-card border shadow-sm">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Δεν υπάρχουν εκκρεμείς αιτήσεις</p>
                </CardContent>
              </Card>
            ) : (
              employeeRequests.map((request) => (
                <Card key={request.id} className="bg-card border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{request.employee_name}</span>
                      <Badge variant={request.request_type === 'positive' ? 'default' : 'destructive'}>
                        {request.request_type === 'positive' ? '+' : ''}{request.points} πόντοι
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium">{request.event_type}</p>
                      {request.description && (
                        <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                      )}
                      {request.amount && request.amount > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-primary">
                            €{(request.amount / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(request.created_at).toLocaleDateString('el-GR')}
                      </p>
                    </div>

                    {/* Amount editing for sales */}
                    {request.event_type.toLowerCase().includes('πώληση') && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Ποσό Πώλησης (€)</Label>
                        <Input
                          type="number"
                          value={editingAmount[request.id] || 0}
                          onChange={(e) => setEditingAmount(prev => ({
                            ...prev,
                            [request.id]: Number(e.target.value)
                          }))}
                          placeholder="Εισάγετε ποσό..."
                          className="h-8"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Προσθήκη σημειώσεων (προαιρετικό)"
                        value={approvalNotes[request.id] || ''}
                        onChange={(e) => setApprovalNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveEmployeeRequest(request.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Έγκριση
                      </Button>
                      <Button
                        onClick={() => rejectEmployeeRequest(request.id)}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Απόρριψη
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="kudos" className="space-y-4">
            {kudosApprovals.length === 0 ? (
              <Card className="bg-card border shadow-sm">
                <CardContent className="p-6 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Δεν υπάρχουν εκκρεμή kudos</p>
                </CardContent>
              </Card>
            ) : (
              kudosApprovals.map((kudos) => (
                <Card key={kudos.id} className="bg-card border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{kudos.from_employee_name} → {kudos.employee_name}</span>
                      <Badge variant="outline" className="ml-2">
                        <Heart className="h-3 w-3 mr-1" />
                        Kudos
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">{kudos.title}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {kudos.category === 'teamwork' ? 'Συνεργασία' :
                           kudos.category === 'quality' ? 'Ποιότητα Εργασίας' :
                           kudos.category === 'customer_service' ? 'Εξυπηρέτηση Πελατών' :
                           kudos.category === 'innovation' ? 'Καινοτομία' :
                           kudos.category === 'leadership' ? 'Ηγεσία' : 'Γενικά'}
                        </Badge>
                        <div className="flex items-center">
                          {Array(kudos.rating).fill(0).map((_, i) => (
                            <span key={i} className="text-yellow-400 text-xs">⭐</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{kudos.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(kudos.created_at).toLocaleDateString('el-GR')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Προσθήκη σημειώσεων (προαιρετικό)"
                        value={approvalNotes[kudos.id] || ''}
                        onChange={(e) => setApprovalNotes(prev => ({
                          ...prev,
                          [kudos.id]: e.target.value
                        }))}
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveKudos(kudos.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Έγκριση
                      </Button>
                      <Button
                        onClick={() => rejectKudos(kudos.id)}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Απόρριψη
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            {rewardRedemptions.length === 0 ? (
              <Card className="bg-card border shadow-sm">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Δεν υπάρχουν εκκρεμείς ανταμοιβές</p>
                </CardContent>
              </Card>
            ) : (
              rewardRedemptions.map((redemption) => (
                <Card key={redemption.id} className="bg-card border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{redemption.employee_name}</span>
                      <Badge variant="secondary">
                        {redemption.points_cost} πόντοι
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div>
                       <p className="font-medium">{redemption.reward_name}</p>
                       <p className="text-xs text-muted-foreground mt-2">
                         {new Date(redemption.created_at).toLocaleDateString('el-GR')}
                       </p>
                     </div>

                     <div className="space-y-2">
                       <Textarea
                         placeholder="Προσθήκη σημειώσεων (προαιρετικό)"
                         value={approvalNotes[redemption.id] || ''}
                         onChange={(e) => setApprovalNotes(prev => ({
                           ...prev,
                           [redemption.id]: e.target.value
                         }))}
                         className="min-h-[60px]"
                       />
                     </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveRewardRedemption(redemption.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Έγκριση
                      </Button>
                      <Button
                        onClick={() => rejectRewardRedemption(redemption.id)}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Απόρριψη
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="bonus" className="space-y-4">
            {bonusRequests.length === 0 ? (
              <Card className="bg-card border shadow-sm">
                <CardContent className="p-6 text-center">
                  <Euro className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Δεν υπάρχουν εκκρεμή bonus τζίρου</p>
                </CardContent>
              </Card>
            ) : (
              bonusRequests.map((bonus) => (
                <Card key={bonus.id} className="bg-card border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{bonus.employee_name}</span>
                      <Badge variant={bonus.bonus_type === 'EUR' ? 'default' : 'secondary'}>
                        {bonus.bonus_type === 'EUR' 
                          ? `€${bonus.bonus_value}` 
                          : `${bonus.bonus_value} πόντοι`
                        }
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium">Bonus Τζίρου - {new Date().toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}</p>
                      <p className="text-sm text-muted-foreground">
                        Τύπος: {bonus.bonus_type === 'EUR' ? 'Χρηματικό' : 'Πόντοι'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(bonus.created_at).toLocaleDateString('el-GR')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Προσθήκη σημειώσεων (προαιρετικό)"
                        value={approvalNotes[bonus.id] || ''}
                        onChange={(e) => setApprovalNotes(prev => ({
                          ...prev,
                          [bonus.id]: e.target.value
                        }))}
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveBonusRequest(bonus.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Έγκριση
                      </Button>
                      <Button
                        onClick={() => rejectBonusRequest(bonus.id)}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Απόρριψη
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}