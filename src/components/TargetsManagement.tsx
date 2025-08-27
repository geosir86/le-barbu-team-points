import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Target, Edit2, Save, X, Users, TrendingUp } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  monthly_revenue_target: number;
  monthly_revenue_actual: number;
  points_balance: number;
  position?: string;
  bonus_revenue_value?: number;
  bonus_revenue_type?: string;
}

export function TargetsManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editingActualRevenue, setEditingActualRevenue] = useState<string | null>(null);
  const [editingBonus, setEditingBonus] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [editActualValue, setEditActualValue] = useState("");
  const [editBonusValue, setEditBonusValue] = useState(0);
  const [editBonusType, setEditBonusType] = useState<'EUR' | 'POINTS'>('EUR');
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();

    // Listen for revenue updates from other components
    const handleRevenueUpdate = () => {
      loadEmployees();
    };

    window.addEventListener('revenueUpdated', handleRevenueUpdate);
    window.addEventListener('revenueTargetUpdated', handleRevenueUpdate);

    return () => {
      window.removeEventListener('revenueUpdated', handleRevenueUpdate);
      window.removeEventListener('revenueTargetUpdated', handleRevenueUpdate);
    };
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, monthly_revenue_target, monthly_revenue_actual, points_balance, position, manual_revenue_override, bonus_revenue_value, bonus_revenue_type')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η φόρτωση των εργαζομένων",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (employeeId: string, currentTarget: number) => {
    setEditingEmployee(employeeId);
    setEditValue(currentTarget / 100); // Convert from cents to euros for display
  };

  const startEditActualRevenue = (employeeId: string, currentActual: number) => {
    setEditingActualRevenue(employeeId);
    setEditActualValue((currentActual / 100).toString()); // Convert from cents to euros for display
  };

  const startEditBonus = (employeeId: string, currentValue: number, currentType: string) => {
    setEditingBonus(employeeId);
    setEditBonusValue(currentValue || 0);
    setEditBonusType(currentType as 'EUR' | 'POINTS' || 'EUR');
  };

  const cancelEdit = () => {
    setEditingEmployee(null);
    setEditingActualRevenue(null);
    setEditingBonus(null);
    setEditValue(0);
    setEditActualValue("");
    setEditBonusValue(0);
    setEditBonusType('EUR');
  };

  const saveTarget = async (employeeId: string) => {
    try {
      const targetInCents = Math.round(editValue * 100); // Convert euros to cents
      const { error } = await supabase
        .from('employees')
        .update({ monthly_revenue_target: targetInCents })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Στόχος ενημερώθηκε!",
        description: "Ο μηνιαίος στόχος τζίρου ενημερώθηκε επιτυχώς.",
      });

      setEditingEmployee(null);
      loadEmployees();
      
      // Trigger refresh of other components by emitting a custom event
      window.dispatchEvent(new CustomEvent('revenueTargetUpdated'));
    } catch (error) {
      console.error('Error updating target:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η ενημέρωση του στόχου",
      });
    }
  };

  const saveBonus = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ 
          bonus_revenue_value: editBonusValue,
          bonus_revenue_type: editBonusType
        })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Bonus ενημερώθηκε!",
        description: "Το bonus τζίρου ενημερώθηκε επιτυχώς.",
      });

      setEditingBonus(null);
      loadEmployees();
    } catch (error) {
      console.error('Error updating bonus:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η ενημέρωση του bonus",
      });
    }
  };

  const saveActualRevenue = async (employeeId: string) => {
    try {
      const actualAmount = parseFloat(editActualValue);
      if (isNaN(actualAmount) || actualAmount < 0) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Παρακαλώ εισάγετε έγκυρο ποσό",
        });
        return;
      }

      const actualInCents = Math.round(actualAmount * 100); // Convert euros to cents
      const { error } = await supabase
        .from('employees')
        .update({ 
          monthly_revenue_actual: actualInCents,
          manual_revenue_override: true // Set flag to prevent trigger from overwriting
        })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Πραγματικός τζίρος ενημερώθηκε!",
        description: "Ο πραγματικός μηνιαίος τζίρος ενημερώθηκε επιτυχώς.",
      });

      setEditingActualRevenue(null);
      loadEmployees();
      
      // Trigger refresh of other components by emitting a custom event
      window.dispatchEvent(new CustomEvent('revenueUpdated'));
    } catch (error) {
      console.error('Error updating actual revenue:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η ενημέρωση του πραγματικού τζίρου",
      });
    }
  };

  const getProgressPercentage = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">Φόρτωση εργαζομένων...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Διαχείριση Στόχων Τζίρου
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-6">
            Ορισμός και παρακολούθηση μηνιαίων στόχων τζίρου ανά εργαζόμενο. Οι στόχοι επηρεάζουν τον υπολογισμό των πόντων.
          </div>

          <div className="space-y-4">
            {employees.map((employee) => {
              const progress = getProgressPercentage(employee.monthly_revenue_actual, employee.monthly_revenue_target);
              const isEditing = editingEmployee === employee.id;
              const isEditingActual = editingActualRevenue === employee.id;

              return (
                <Card key={employee.id} className="bg-card border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{employee.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {employee.position || "Εργαζόμενος"} • {employee.points_balance} πόντοι
                          </p>
                        </div>
                      </div>
                      
                      <Badge className={getProgressColor(progress)} variant="outline">
                        {progress.toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Στόχος Μήνα</Label>
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(Number(e.target.value))}
                              className="h-8 text-sm"
                              min="0"
                              step="100"
                            />
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => saveTarget(employee.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-medium">€{(employee.monthly_revenue_target / 100).toFixed(2)}</p>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => startEdit(employee.id, employee.monthly_revenue_target)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Πραγματικός Τζίρος</Label>
                        {isEditingActual ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={editActualValue}
                              onChange={(e) => setEditActualValue(e.target.value)}
                              className="h-8 text-sm"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => saveActualRevenue(employee.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-medium">€{(employee.monthly_revenue_actual / 100).toFixed(2)}</p>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => startEditActualRevenue(employee.id, employee.monthly_revenue_actual)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Bonus Τζίρου</Label>
                        {editingBonus === employee.id ? (
                          <div className="space-y-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editBonusValue}
                                onChange={(e) => setEditBonusValue(Number(e.target.value))}
                                className="h-8 text-xs flex-1"
                                min="0"
                              />
                              <select 
                                value={editBonusType} 
                                onChange={(e) => setEditBonusType(e.target.value as 'EUR' | 'POINTS')}
                                className="h-8 text-xs border rounded px-1"
                              >
                                <option value="EUR">EUR</option>
                                <option value="POINTS">Points</option>
                              </select>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => saveBonus(employee.id)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={cancelEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-medium text-xs">
                              {employee.bonus_revenue_type === 'EUR' 
                                ? `€${employee.bonus_revenue_value || 0}`
                                : `${employee.bonus_revenue_value || 0} pts`
                              }
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => startEditBonus(employee.id, employee.bonus_revenue_value || 0, employee.bonus_revenue_type || 'EUR')}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          progress >= 100 ? 'bg-green-500' :
                          progress >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {employees.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Δεν βρέθηκαν εργαζόμενοι</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}