import { useState, useEffect } from "react";
import { Euro, Target, Gift, Clock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface BonusRequest {
  id: string;
  bonus_value: number;
  bonus_type: string;
  status: string;
  created_at: string;
}

export function EmployeeRevenueBonus() {
  const [bonusRequest, setBonusRequest] = useState<BonusRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentEmployee } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadBonusRequest();
  }, [currentEmployee?.id]);

  const loadBonusRequest = async () => {
    if (!currentEmployee?.id) return;

    try {
      setLoading(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('bonus_requests')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBonusRequest(data || null);
    } catch (error) {
      console.error('Error loading bonus request:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitBonusRequest = async () => {
    if (!currentEmployee?.id) return;

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Create both approval request and bonus request
      const [approvalResult, bonusResult] = await Promise.all([
        supabase
          .from('employee_requests')
          .insert({
            employee_id: currentEmployee.id,
            request_type: 'bonus',
            event_type: 'revenue_bonus',
            description: `Αίτηση bonus τζίρου για ${currentMonth}/${currentYear}`,
            points: 0,
            amount: currentEmployee.bonus_revenue_value || 0,
            status: 'pending'
          }),
        supabase
          .from('bonus_requests')
          .insert({
            employee_id: currentEmployee.id,
            month: currentMonth,
            year: currentYear,
            bonus_value: currentEmployee.bonus_revenue_value || 0,
            bonus_type: currentEmployee.bonus_revenue_type || 'EUR',
            status: 'pending'
          })
      ]);

      if (approvalResult.error) throw approvalResult.error;
      if (bonusResult.error) throw bonusResult.error;

      toast({
        title: "Επιτυχία!",
        description: "Η αίτηση για εξαργύρωση bonus στάλθηκε",
      });

      loadBonusRequest();
    } catch (error) {
      console.error('Error submitting bonus request:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποστολή της αίτησης",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border shadow-sm">
        <CardContent className="p-6 text-center">
          <div>Φόρτωση...</div>
        </CardContent>
      </Card>
    );
  }

  const revenueTarget = currentEmployee?.monthly_revenue_target || 0;
  const revenueActual = currentEmployee?.monthly_revenue_actual || 0;
  const bonusValue = currentEmployee?.bonus_revenue_value || 0;
  const bonusType = currentEmployee?.bonus_revenue_type || 'EUR';
  
  const progress = revenueTarget > 0 ? (revenueActual / revenueTarget) * 100 : 0;
  const targetReached = progress >= 100;

  if (bonusValue === 0) {
    return null; // Don't show card if no bonus is configured
  }

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-yellow-700">
          <Gift className="h-5 w-5" />
          Bonus Τζίρου
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Στόχος</p>
            <p className="text-lg font-bold">€{(revenueTarget / 100).toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Πραγματικός</p>
            <p className="text-lg font-bold">€{(revenueActual / 100).toFixed(0)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Πρόοδος</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="bg-white/70 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Bonus Αξία</p>
              <p className="text-lg font-bold text-yellow-700">
                {bonusType === 'EUR' ? `€${bonusValue}` : `${bonusValue} πόντοι`}
              </p>
            </div>
            <Badge variant={targetReached ? "default" : "secondary"}>
              {targetReached ? "Διαθέσιμο" : "Μη διαθέσιμο"}
            </Badge>
          </div>
        </div>

        {bonusRequest ? (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Κατάσταση Αίτησης
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {bonusRequest.status === 'pending' && "Εκκρεμεί έγκριση"}
                {bonusRequest.status === 'approved' && "Εγκρίθηκε"}
                {bonusRequest.status === 'rejected' && "Απορρίφθηκε"}
              </span>
              {bonusRequest.status === 'approved' && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
        ) : (
          <Button
            onClick={submitBonusRequest}
            disabled={!targetReached}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {targetReached ? "Ζήτηση Εξαργύρωσης" : "Δεν έχεις φτάσει τον στόχο"}
          </Button>
        )}

        {!targetReached && (
          <p className="text-xs text-muted-foreground text-center">
            Απομένουν €{((revenueTarget - revenueActual) / 100).toFixed(0)} για να φτάσεις τον στόχο!
          </p>
        )}
      </CardContent>
    </Card>
  );
}