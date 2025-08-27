import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, DollarSign, Trophy, Gift, Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  category: string;
  is_active: boolean;
  icon?: string;
}

export function RewardsManagement() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [newReward, setNewReward] = useState<Partial<Reward>>({
    name: "",
    description: "",
    points_cost: 0,
    category: "",
    is_active: true
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

      const mappedRewards: Reward[] = data.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description || '',
        points_cost: reward.points_cost,
        category: reward.category,
        is_active: reward.is_active,
        icon: reward.icon
      }));

      setRewards(mappedRewards);
      
      // Extract unique categories from rewards
      const categories = [...new Set(data.map(reward => reward.category))];
      setAvailableCategories(categories);
      
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast.error('Σφάλμα φόρτωσης ανταμοιβών');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "dayoff": 
      case "άδεια":
      case "άδειες": return Clock;
      case "cash":
      case "χρήμα":
      case "euro": return DollarSign;
      case "team":
      case "ομαδικές": return Trophy;
      case "gift":
      case "δώρα":
      default: return Gift;
    }
  };

  const getCategoryLabel = (category: string) => {
    // Show category as is, capitalized
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleToggleEnabled = async (id: string) => {
    try {
      const reward = rewards.find(r => r.id === id);
      if (!reward) return;

      const { error } = await supabase
        .from('rewards_catalog')
        .update({ is_active: !reward.is_active })
        .eq('id', id);

      if (error) throw error;

      setRewards(rewards.map(reward => 
        reward.id === id ? { ...reward, is_active: !reward.is_active } : reward
      ));
      toast.success("Η ανταμοιβή ενημερώθηκε!");
    } catch (error) {
      console.error('Error toggling reward:', error);
      toast.error('Σφάλμα ενημέρωσης ανταμοιβής');
    }
  };

  const handleEditReward = (reward: Reward) => {
    setEditingReward({ ...reward });
  };

  const handleSaveEdit = async () => {
    if (!editingReward) return;

    try {
      const { error } = await supabase
        .from('rewards_catalog')
        .update({
          name: editingReward.name,
          description: editingReward.description,
          points_cost: editingReward.points_cost,
          category: editingReward.category,
          is_active: editingReward.is_active
        })
        .eq('id', editingReward.id);

      if (error) throw error;

      setRewards(rewards.map(reward => 
        reward.id === editingReward.id ? editingReward : reward
      ));
      setEditingReward(null);
      toast.success("Η ανταμοιβή ενημερώθηκε!");
    } catch (error) {
      console.error('Error updating reward:', error);
      toast.error('Σφάλμα ενημέρωσης ανταμοιβής');
    }
  };

  const handleAddReward = async () => {
    if (!newReward.name || !newReward.description || !newReward.points_cost) {
      toast.error("Παρακαλώ συμπληρώστε όλα τα πεδία!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .insert({
          name: newReward.name!,
          description: newReward.description!,
          points_cost: newReward.points_cost!,
          category: newReward.category!,
          is_active: newReward.is_active!
        })
        .select()
        .single();

      if (error) throw error;

        const reward: Reward = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        points_cost: data.points_cost,
        category: data.category,
        is_active: data.is_active,
        icon: data.icon
      };

      setRewards([reward, ...rewards]);
      // Update available categories
      if (!availableCategories.includes(reward.category)) {
        setAvailableCategories([...availableCategories, reward.category]);
      }
      setNewReward({
        name: "",
        description: "",
        points_cost: 0,
        category: "",
        is_active: true
      });
      setIsAddDialogOpen(false);
      toast.success("Νέα ανταμοιβή προστέθηκε!");
    } catch (error) {
      console.error('Error adding reward:', error);
      toast.error('Σφάλμα προσθήκης ανταμοιβής');
    }
  };

  const handleDeleteReward = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rewards_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRewards(rewards.filter(reward => reward.id !== id));
      toast.success("Η ανταμοιβή διαγράφηκε!");
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Σφάλμα διαγραφής ανταμοιβής');
    }
  };

  const groupedRewards = rewards.reduce((acc, reward) => {
    if (!acc[reward.category]) {
      acc[reward.category] = [];
    }
    acc[reward.category].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Φόρτωση ανταμοιβών...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Διαχείριση Ανταμοιβών</h1>
            <p className="text-muted-foreground">Επεξεργασία και διαχείριση των διαθέσιμων ανταμοιβών</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Νέα Ανταμοιβή
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Προσθήκη Νέας Ανταμοιβής</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Όνομα</Label>
                  <Input
                    id="name"
                    value={newReward.name || ""}
                    onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                    placeholder="π.χ. Δωροκάρτα καφέ"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Περιγραφή</Label>
                  <Input
                    id="description"
                    value={newReward.description || ""}
                    onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                    placeholder="π.χ. Δωροκάρτα 10€"
                  />
                </div>
                <div>
                  <Label htmlFor="points">Πόντοι</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newReward.points_cost || ""}
                    onChange={(e) => setNewReward({...newReward, points_cost: parseInt(e.target.value)})}
                    placeholder="π.χ. 100"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Κατηγορία</Label>
                  <Input
                    id="category"
                    value={newReward.category || ""}
                    onChange={(e) => setNewReward({...newReward, category: e.target.value})}
                    placeholder="π.χ. Δώρα, Χρήμα, Άδειες"
                    list="categories"
                  />
                  <datalist id="categories">
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={newReward.is_active}
                    onCheckedChange={(checked) => setNewReward({...newReward, is_active: checked})}
                  />
                  <Label htmlFor="enabled">Ενεργή</Label>
                </div>
                <Button onClick={handleAddReward} className="w-full">
                  Προσθήκη
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rewards by Category */}
        {Object.entries(groupedRewards).map(([category, categoryRewards]) => {
          const Icon = getCategoryIcon(category);
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold">{getCategoryLabel(category)}</h2>
                <Badge variant="secondary">{categoryRewards.length}</Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {categoryRewards.map((reward) => (
                  <Card key={reward.id} className={`${!reward.is_active ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{reward.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{reward.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={reward.is_active ? "default" : "secondary"}>
                              {reward.points_cost} πόντοι
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={reward.is_active}
                            onCheckedChange={() => handleToggleEnabled(reward.id)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReward(reward)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReward(reward.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {/* Edit Dialog */}
        <Dialog open={!!editingReward} onOpenChange={() => setEditingReward(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Επεξεργασία Ανταμοιβής</DialogTitle>
            </DialogHeader>
            {editingReward && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Όνομα</Label>
                  <Input
                    id="edit-name"
                    value={editingReward.name}
                    onChange={(e) => setEditingReward({...editingReward, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Περιγραφή</Label>
                  <Input
                    id="edit-description"
                    value={editingReward.description}
                    onChange={(e) => setEditingReward({...editingReward, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-points">Πόντοι</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    value={editingReward.points_cost}
                    onChange={(e) => setEditingReward({...editingReward, points_cost: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Κατηγορία</Label>
                  <Input
                    id="edit-category"
                    value={editingReward.category}
                    onChange={(e) => setEditingReward({...editingReward, category: e.target.value})}
                    placeholder="π.χ. Δώρα, Χρήμα, Άδειες"
                    list="edit-categories"
                  />
                  <datalist id="edit-categories">
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-enabled"
                    checked={editingReward.is_active}
                    onCheckedChange={(checked) => setEditingReward({...editingReward, is_active: checked})}
                  />
                  <Label htmlFor="edit-enabled">Ενεργή</Label>
                </div>
                <Button onClick={handleSaveEdit} className="w-full">
                  Αποθήκευση
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}