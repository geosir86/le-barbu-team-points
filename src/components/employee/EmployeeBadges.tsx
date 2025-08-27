import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Award, Target, Clock, DollarSign, Users, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  criteria_type: string;
  criteria_value: number;
}

interface EarnedBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge_definitions: BadgeDefinition;
}

interface BadgeProgress {
  badge_definitions: BadgeDefinition;
  progress: number;
}

const earnedBadgesMock = [
  {
    id: "1",
    name: "First Week Champion",
    description: "Πρώτος στην πρώτη εβδομάδα",
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    earnedDate: "15 Ιαν 2024",
    rarity: "rare"
  },
  {
    id: "2", 
    name: "Review Master",
    description: "10+ reviews 5 αστέρων",
    icon: Star,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    earnedDate: "20 Ιαν 2024",
    rarity: "common"
  },
  {
    id: "3",
    name: "Sales Achiever",
    description: "Έφτασε το μηνιαίο sales target",
    icon: DollarSign,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    earnedDate: "22 Ιαν 2024",
    rarity: "uncommon"
  },
  {
    id: "4",
    name: "Team Player",
    description: "Συμμετείχε σε 3 ομαδικούς στόχους",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    earnedDate: "25 Ιαν 2024",
    rarity: "common"
  }
];

const availableBadgesMock = [
  {
    id: "5",
    name: "Perfect Month",
    description: "Μηδέν αρνητικά συμβάντα για 30 μέρες",
    icon: Award,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    progress: 22,
    target: 30,
    rarity: "legendary"
  },
  {
    id: "6",
    name: "Speed Demon",
    description: "Εξυπηρέτηση 50 πελατών σε μία μέρα",
    icon: Zap,
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    progress: 35,
    target: 50,
    rarity: "epic"
  },
  {
    id: "7",
    name: "Early Bird",
    description: "30 μέρες χωρίς καθυστέρηση",
    icon: Clock,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
    progress: 18,
    target: 30,
    rarity: "rare"
  },
  {
    id: "8",
    name: "Customer Whisperer",
    description: "Μέσος όρος 4.8+ αστέρια",
    icon: Star,
    color: "text-pink-500", 
    bgColor: "bg-pink-500/20",
    progress: 4.2,
    target: 4.8,
    rarity: "epic"
  }
];

const badgeStatsMock = {
  total: earnedBadgesMock.length,
  rare: earnedBadgesMock.filter(b => b.rarity === "rare").length,
  legendary: earnedBadgesMock.filter(b => b.rarity === "legendary").length,
  recentEarned: earnedBadgesMock[earnedBadgesMock.length - 1]
};

export function EmployeeBadges() {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentEmployee } = useAuth();

  useEffect(() => {
    if (currentEmployee) {
      loadBadges();
    }
  }, [currentEmployee]);

  const loadBadges = async () => {
    if (!currentEmployee) return;

    try {
      // Load earned badges
      const { data: earnedData, error: earnedError } = await supabase
        .from('employee_badges')
        .select(`
          id,
          badge_id,
          earned_at,
          badge_definitions (*)
        `)
        .eq('employee_id', currentEmployee.id)
        .not('earned_at', 'is', null);

      if (earnedError) throw earnedError;

      // Load available badge definitions
      const { data: badgeDefsData, error: badgeDefsError } = await supabase
        .from('badge_definitions')
        .select('*')
        .eq('is_active', true);

      if (badgeDefsError) throw badgeDefsError;

      // Calculate progress for unearned badges
      const earnedBadgeIds = earnedData?.map(eb => eb.badge_id) || [];
      const unearnedBadges = badgeDefsData?.filter(bd => !earnedBadgeIds.includes(bd.id)) || [];
      
      // For now, simulate progress calculation
      const progressBadges = unearnedBadges.map(badge => ({
        badge_definitions: badge,
        progress: Math.floor(Math.random() * badge.criteria_value * 0.8) // Simulate progress
      }));

      setEarnedBadges(earnedData || []);
      setAvailableBadges(progressBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "border-gray-400 bg-gray-400/10 text-gray-400";
      case "uncommon": return "border-green-500 bg-green-500/10 text-green-400";
      case "rare": return "border-blue-500 bg-blue-500/10 text-blue-400";
      case "epic": return "border-purple-500 bg-purple-500/10 text-purple-400";
      case "legendary": return "border-yellow-500 bg-yellow-500/10 text-yellow-400";
      default: return "border-gray-400 bg-gray-400/10 text-gray-400";
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "common": return "⚪";
      case "uncommon": return "🟢";
      case "rare": return "🔵";
      case "epic": return "🟣";
      case "legendary": return "🟡";
      default: return "⚪";
    }
  };

  const badgeStats = {
    total: earnedBadges.length,
    rare: earnedBadges.filter(b => ['rare', 'epic', 'legendary'].includes(b.badge_definitions.rarity)).length,
    legendary: earnedBadges.filter(b => b.badge_definitions.rarity === 'legendary').length,
    recentEarned: earnedBadges[earnedBadges.length - 1]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto text-center">
          <div className="text-muted-foreground">Φόρτωση badges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Διακρίσεις & Badges</h1>
          <p className="text-muted-foreground">Η συλλογή των επιτευγμάτων σου</p>
        </div>

        {/* Stats Overview */}
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{badgeStats.total}</p>
                <p className="text-xs text-muted-foreground">Σύνολο Badges</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{badgeStats.rare}</p>
                <p className="text-xs text-muted-foreground">Rare+</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{badgeStats.legendary}</p>
                <p className="text-xs text-muted-foreground">Legendary</p>
              </div>
            </div>
            {badgeStats.recentEarned && (
              <div className="mt-4 p-2 bg-accent/5 rounded-lg text-center">
                <p className="text-sm text-accent">🎉 Πρόσφατα απέκτησες: <span className="font-medium">{badgeStats.recentEarned.badge_definitions.name}</span></p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earned Badges */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">🏆 Κερδισμένα Badges</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {earnedBadges.map((earnedBadge) => {
              const badge = earnedBadge.badge_definitions;
              return (
                <Card key={earnedBadge.id} className={`bg-card border-2 ${getRarityColor(badge.rarity).split(' ')[0]} relative overflow-hidden shadow-sm`}>
                  <div className="absolute top-2 right-2">
                    <span className="text-xs">{getRarityIcon(badge.rarity)}</span>
                  </div>
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">{badge.icon}</span>
                    </div>
                    <h3 className="font-medium text-sm mb-1">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                    <Badge className={getRarityColor(badge.rarity)} variant="outline">
                      {badge.rarity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(earnedBadge.earned_at).toLocaleDateString('el-GR')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Available Badges (In Progress) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">🎯 Badges σε Εξέλιξη</h2>
          </div>

          <div className="space-y-3">
            {availableBadges.map((badgeProgress) => {
              const badge = badgeProgress.badge_definitions;
              const progressPercentage = badge.criteria_value ? (badgeProgress.progress / badge.criteria_value) * 100 : 0;
              
              return (
                <Card key={badge.id} className="bg-card border shadow-sm opacity-80">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{badge.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm">{badge.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{getRarityIcon(badge.rarity)}</span>
                            <Badge className={getRarityColor(badge.rarity)} variant="outline">
                              {badge.rarity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {badgeProgress.progress}/{badge.criteria_value} {badge.criteria_type === 'points' ? 'πόντοι' : badge.criteria_type === 'sales' ? 'πωλήσεις' : ''}
                            </span>
                            <span className="text-primary font-medium">{Math.round(progressPercentage)}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Badge Collection Tips */}
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-accent mb-2">💡 Tips για Badges</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Τα Legendary badges δίνουν μπόνους στους πόντους</li>
              <li>• Συμμετοχή σε ομαδικούς στόχους ξεκλειδώνει ειδικά badges</li>
              <li>• Κάποια badges έχουν κρυφές προϋποθέσεις</li>
              <li>• Τα Epic+ badges φαίνονται στο προφίλ σου</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}