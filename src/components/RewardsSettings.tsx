import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, DollarSign, Trophy, Gift, Edit2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface IndividualReward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  category: "gift" | "cash" | "dayoff" | "team";
  is_active: boolean;
}

interface TeamReward {
  id: string;
  name: string;
  description: string;
  goalType: "points" | "reviews" | "zero_negative";
  goalValue: number;
  rewardType: "bonus" | "time_off" | "outing";
  rewardValue: number;
  distribution: "equal" | "proportional";
  enabled: boolean;
}

const initialTeamRewards: TeamReward[] = [
  { 
    id: "1", 
    name: "Ομαδικό Bonus", 
    description: "Όλη η ομάδα πιάνει στόχο", 
    goalType: "points", 
    goalValue: 1000, 
    rewardType: "bonus", 
    rewardValue: 200, 
    distribution: "proportional", 
    enabled: true 
  },
  { 
    id: "2", 
    name: "Team Outing", 
    description: "Έξοδος ομάδας για φαγητό", 
    goalType: "reviews", 
    goalValue: 50, 
    rewardType: "outing", 
    rewardValue: 500, 
    distribution: "equal", 
    enabled: false 
  },
];

export function RewardsSettings() {
  const [individualRewards, setIndividualRewards] = useState<IndividualReward[]>([]);
  const [teamRewards, setTeamRewards] = useState<TeamReward[]>(initialTeamRewards);
  const [editingIndividual, setEditingIndividual] = useState<IndividualReward | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamReward | null>(null);
  const [isAddIndividualOpen, setIsAddIndividualOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newIndividual, setNewIndividual] = useState<Partial<IndividualReward>>({
    name: "", description: "", points_cost: 0, category: "gift", is_active: true
  });
  const [newTeam, setNewTeam] = useState<Partial<TeamReward>>({
    name: "", description: "", goalType: "points", goalValue: 0, rewardType: "bonus", rewardValue: 0, distribution: "equal", enabled: true
  });

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedRewards: IndividualReward[] = data.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description || '',
        points_cost: reward.points_cost,
        category: reward.category as "gift" | "cash" | "dayoff" | "team",
        is_active: reward.is_active
      }));

      setIndividualRewards(mappedRewards);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast.error('Σφάλμα φόρτωσης ανταμοιβών');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rewards_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIndividualRewards(rewards => rewards.filter(r => r.id !== id));
      toast.success("Η ανταμοιβή διαγράφηκε!");
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Σφάλμα διαγραφής ανταμοιβής');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "dayoff": return Clock;
      case "cash": return DollarSign;
      case "team": return Trophy;
      case "gift":
      default: return Gift;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "dayoff": return "🕒 Άδειες";
      case "cash": return "💰 Χρήμα";
      case "team": return "🏆 Ομαδικές";
      case "gift":
      default: return "🎁 Δώρα";
    }
  };

  const getGoalTypeLabel = (goalType: string) => {
    switch (goalType) {
      case "points": return "Συνολικοί πόντοι";
      case "reviews": return "Αριθμός reviews";
      case "zero_negative": return "Μηδενικά αρνητικά";
      default: return goalType;
    }
  };

  const getRewardTypeLabel = (rewardType: string) => {
    switch (rewardType) {
      case "bonus": return "Χρηματικό bonus (€)";
      case "time_off": return "Άδεια (ημέρες)";
      case "outing": return "Έξοδος (€)";
      default: return rewardType;
    }
  };

  const getDistributionLabel = (distribution: string) => {
    switch (distribution) {
      case "equal": return "Ίση κατανομή";
      case "proportional": return "Αναλογική κατανομή";
      default: return distribution;
    }
  };

  const handleToggleIndividual = async (id: string) => {
    try {
      const reward = individualRewards.find(r => r.id === id);
      if (!reward) return;

      const { error } = await supabase
        .from('rewards_catalog')
        .update({ is_active: !reward.is_active })
        .eq('id', id);

      if (error) throw error;

      setIndividualRewards(rewards => rewards.map(reward => 
        reward.id === id ? { ...reward, is_active: !reward.is_active } : reward
      ));
      toast.success("Η ανταμοιβή ενημερώθηκε!");
    } catch (error) {
      console.error('Error toggling reward:', error);
      toast.error('Σφάλμα ενημέρωσης ανταμοιβής');
    }
  };

  const handleToggleTeam = (id: string) => {
    setTeamRewards(rewards => rewards.map(reward => 
      reward.id === id ? { ...reward, enabled: !reward.enabled } : reward
    ));
    toast.success("Η ομαδική ανταμοιβή ενημερώθηκε!");
  };

  const handleAddIndividual = async () => {
    if (!newIndividual.name || !newIndividual.description || !newIndividual.points_cost) {
      toast.error("Παρακαλώ συμπληρώστε όλα τα πεδία!");
      return;
    }

    try {
      if (editingIndividual) {
        // Edit existing
        const { error } = await supabase
          .from('rewards_catalog')
          .update({
            name: newIndividual.name!,
            description: newIndividual.description!,
            points_cost: newIndividual.points_cost!,
            category: newIndividual.category!,
            is_active: newIndividual.is_active!
          })
          .eq('id', editingIndividual.id);

        if (error) throw error;

        setIndividualRewards(rewards => rewards.map(r => 
          r.id === editingIndividual.id 
            ? {
                ...r,
                name: newIndividual.name!,
                description: newIndividual.description!,
                points_cost: newIndividual.points_cost!,
                category: newIndividual.category as "gift" | "cash" | "dayoff" | "team",
                is_active: newIndividual.is_active!
              }
            : r
        ));
        toast.success("Η ανταμοιβή ενημερώθηκε!");
        setEditingIndividual(null);
      } else {
        // Add new
        const { data, error } = await supabase
          .from('rewards_catalog')
          .insert({
            name: newIndividual.name!,
            description: newIndividual.description!,
            points_cost: newIndividual.points_cost!,
            category: newIndividual.category!,
            is_active: newIndividual.is_active!
          })
          .select()
          .single();

        if (error) throw error;

        const newReward: IndividualReward = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          points_cost: data.points_cost,
          category: data.category as "gift" | "cash" | "dayoff" | "team",
          is_active: data.is_active
        };

        setIndividualRewards([...individualRewards, newReward]);
        toast.success("Νέα ανταμοιβή προστέθηκε!");
      }
      
      setNewIndividual({ name: "", description: "", points_cost: 0, category: "gift", is_active: true });
      setIsAddIndividualOpen(false);
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Σφάλμα αποθήκευσης ανταμοιβής');
    }
  };

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.description || !newTeam.goalValue || !newTeam.rewardValue) {
      toast.error("Παρακαλώ συμπληρώστε όλα τα πεδία!");
      return;
    }

    if (editingTeam) {
      // Edit existing
      setTeamRewards(rewards => rewards.map(r => 
        r.id === editingTeam.id 
          ? {
              ...r,
              name: newTeam.name!,
              description: newTeam.description!,
              goalType: newTeam.goalType as "points" | "reviews" | "zero_negative",
              goalValue: newTeam.goalValue!,
              rewardType: newTeam.rewardType as "bonus" | "time_off" | "outing",
              rewardValue: newTeam.rewardValue!,
              distribution: newTeam.distribution as "equal" | "proportional",
              enabled: newTeam.enabled!
            }
          : r
      ));
      toast.success("Η ομαδική ανταμοιβή ενημερώθηκε!");
      setEditingTeam(null);
    } else {
      // Add new
      const reward: TeamReward = {
        id: Date.now().toString(),
        name: newTeam.name!,
        description: newTeam.description!,
        goalType: newTeam.goalType as "points" | "reviews" | "zero_negative",
        goalValue: newTeam.goalValue!,
        rewardType: newTeam.rewardType as "bonus" | "time_off" | "outing",
        rewardValue: newTeam.rewardValue!,
        distribution: newTeam.distribution as "equal" | "proportional",
        enabled: newTeam.enabled!
      };

      setTeamRewards([...teamRewards, reward]);
      toast.success("Νέα ομαδική ανταμοιβή προστέθηκε!");
    }
    
    setNewTeam({ name: "", description: "", goalType: "points", goalValue: 0, rewardType: "bonus", rewardValue: 0, distribution: "equal", enabled: true });
    setIsAddTeamOpen(false);
  };

  const groupedIndividualRewards = individualRewards.reduce((acc, reward) => {
    if (!acc[reward.category]) {
      acc[reward.category] = [];
    }
    acc[reward.category].push(reward);
    return acc;
  }, {} as Record<string, IndividualReward[]>);

  return (
    <div className="space-y-6">
      {/* Individual Rewards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ατομικές Ανταμοιβές</h2>
          <Dialog open={isAddIndividualOpen} onOpenChange={(open) => {
            setIsAddIndividualOpen(open);
            if (!open) {
              setEditingIndividual(null);
              setNewIndividual({ name: "", description: "", points_cost: 0, category: "gift", is_active: true });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Νέα Ατομική Ανταμοιβή
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingIndividual ? "Επεξεργασία Ατομικής Ανταμοιβής" : "Προσθήκη Ατομικής Ανταμοιβής"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Όνομα</Label>
                  <Input
                    value={newIndividual.name || ""}
                    onChange={(e) => setNewIndividual({...newIndividual, name: e.target.value})}
                    placeholder="π.χ. Δωροκάρτα καφέ"
                  />
                </div>
                <div>
                  <Label>Περιγραφή</Label>
                  <Input
                    value={newIndividual.description || ""}
                    onChange={(e) => setNewIndividual({...newIndividual, description: e.target.value})}
                    placeholder="π.χ. Δωροκάρτα 10€"
                  />
                </div>
                <div>
                  <Label>Πόντοι</Label>
                  <Input
                    type="number"
                    value={newIndividual.points_cost || ""}
                    onChange={(e) => setNewIndividual({...newIndividual, points_cost: parseInt(e.target.value)})}
                    placeholder="π.χ. 100"
                  />
                </div>
                <div>
                  <Label>Κατηγορία</Label>
                  <Select value={newIndividual.category} onValueChange={(value) => setNewIndividual({...newIndividual, category: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gift">Δώρα</SelectItem>
                      <SelectItem value="cash">Χρήμα</SelectItem>
                      <SelectItem value="dayoff">Άδειες</SelectItem>
                      <SelectItem value="team">Ομαδικές</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newIndividual.is_active}
                    onCheckedChange={(checked) => setNewIndividual({...newIndividual, is_active: checked})}
                  />
                  <Label>Ενεργή</Label>
                </div>
                <Button onClick={handleAddIndividual} className="w-full">
                  {editingIndividual ? "Ενημέρωση" : "Προσθήκη"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Φόρτωση ανταμοιβών...</p>
            </CardContent>
          </Card>
        ) : (
          /* Individual Rewards by Category */
          Object.entries(groupedIndividualRewards).map(([category, categoryRewards]) => {
            const Icon = getCategoryIcon(category);
            return (
              <Card key={category} className="bg-card border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-accent" />
                    {getCategoryLabel(category)}
                    <Badge variant="secondary">{categoryRewards.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryRewards.map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${!reward.is_active ? 'opacity-50' : ''}`}>{reward.name}</p>
                        <p className={`text-xs text-muted-foreground ${!reward.is_active ? 'opacity-50' : ''}`}>{reward.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={reward.is_active ? "default" : "secondary"}>
                          {reward.points_cost} πόντοι
                        </Badge>
                        <Switch
                          checked={reward.is_active}
                          onCheckedChange={() => handleToggleIndividual(reward.id)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingIndividual(reward);
                            setNewIndividual({
                              name: reward.name,
                              description: reward.description,
                              points_cost: reward.points_cost,
                              category: reward.category,
                              is_active: reward.is_active
                            });
                            setIsAddIndividualOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReward(reward.id)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Team Rewards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ομαδικές Ανταμοιβές</h2>
          <Dialog open={isAddTeamOpen} onOpenChange={(open) => {
            setIsAddTeamOpen(open);
            if (!open) {
              setEditingTeam(null);
              setNewTeam({ name: "", description: "", goalType: "points", goalValue: 0, rewardType: "bonus", rewardValue: 0, distribution: "equal", enabled: true });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Νέα Ομαδική Ανταμοιβή
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTeam ? "Επεξεργασία Ομαδικής Ανταμοιβής" : "Προσθήκη Ομαδικής Ανταμοιβής"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Όνομα</Label>
                  <Input
                    value={newTeam.name || ""}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                    placeholder="π.χ. Ομαδικό Bonus"
                  />
                </div>
                <div>
                  <Label>Περιγραφή</Label>
                  <Input
                    value={newTeam.description || ""}
                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                    placeholder="π.χ. Bonus για όλη την ομάδα"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Τύπος Στόχου</Label>
                    <Select value={newTeam.goalType} onValueChange={(value) => setNewTeam({...newTeam, goalType: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Συνολικοί πόντοι</SelectItem>
                        <SelectItem value="reviews">Αριθμός reviews</SelectItem>
                        <SelectItem value="zero_negative">Μηδενικά αρνητικά</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Στόχος</Label>
                    <Input
                      type="number"
                      value={newTeam.goalValue || ""}
                      onChange={(e) => setNewTeam({...newTeam, goalValue: parseInt(e.target.value)})}
                      placeholder="π.χ. 1000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Τύπος Ανταμοιβής</Label>
                    <Select value={newTeam.rewardType} onValueChange={(value) => setNewTeam({...newTeam, rewardType: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">Bonus (€)</SelectItem>
                        <SelectItem value="time_off">Άδεια (ημέρες)</SelectItem>
                        <SelectItem value="outing">Έξοδος (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Αξία Ανταμοιβής</Label>
                    <Input
                      type="number"
                      value={newTeam.rewardValue || ""}
                      onChange={(e) => setNewTeam({...newTeam, rewardValue: parseInt(e.target.value)})}
                      placeholder="π.χ. 200"
                    />
                  </div>
                </div>
                <div>
                  <Label>Κατανομή</Label>
                  <Select value={newTeam.distribution} onValueChange={(value) => setNewTeam({...newTeam, distribution: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Ίση κατανομή</SelectItem>
                      <SelectItem value="proportional">Αναλογική κατανομή</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newTeam.enabled}
                    onCheckedChange={(checked) => setNewTeam({...newTeam, enabled: checked})}
                  />
                  <Label>Ενεργή</Label>
                </div>
                <Button onClick={handleAddTeam} className="w-full">
                  {editingTeam ? "Ενημέρωση" : "Προσθήκη"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              🏆 Ομαδικές Ανταμοιβές
              <Badge variant="secondary">{teamRewards.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamRewards.map((reward) => (
              <div key={reward.id} className="p-4 rounded-lg bg-muted/50 border border-urban-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${!reward.enabled ? 'opacity-50' : ''}`}>{reward.name}</p>
                    <p className={`text-xs text-muted-foreground ${!reward.enabled ? 'opacity-50' : ''}`}>{reward.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reward.enabled}
                      onCheckedChange={() => handleToggleTeam(reward.id)}
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setEditingTeam(reward);
                        setNewTeam({
                          name: reward.name,
                          description: reward.description,
                          goalType: reward.goalType,
                          goalValue: reward.goalValue,
                          rewardType: reward.rewardType,
                          rewardValue: reward.rewardValue,
                          distribution: reward.distribution,
                          enabled: reward.enabled
                        });
                        setIsAddTeamOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTeamRewards(rewards => rewards.filter(r => r.id !== reward.id))}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Badge variant="outline" className={!reward.enabled ? 'opacity-50' : ''}>
                    {getGoalTypeLabel(reward.goalType)}: {reward.goalValue}
                  </Badge>
                  <Badge variant="outline" className={!reward.enabled ? 'opacity-50' : ''}>
                    {getRewardTypeLabel(reward.rewardType)}: {reward.rewardValue}
                  </Badge>
                  <Badge variant="outline" className={!reward.enabled ? 'opacity-50' : ''}>
                    {getDistributionLabel(reward.distribution)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}