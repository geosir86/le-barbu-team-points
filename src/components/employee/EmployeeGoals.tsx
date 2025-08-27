import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, DollarSign, Users, TrendingUp, Calendar, Award } from "lucide-react";

const personalGoals = {
  monthlyPoints: { current: 245, target: 350, reward: "Bonus €50" },
  salesTarget: { current: 2800, target: 3500, reward: "Bonus €100 + 1 μέρα άδεια" },
  customerReviews: { current: 8, target: 10, reward: "€25 gift card" },
};

const teamGoals = [
  {
    id: "1",
    title: "Ομαδικός Στόχος Πόντων",
    description: "Συνολικά 1500 πόντοι όλη η ομάδα",
    current: 1240,
    target: 1500,
    teamSize: 5,
    reward: "Ομαδικό dinner €300",
    deadline: "31 Ιαν 2024",
    type: "points"
  },
  {
    id: "2", 
    title: "Zero Αρνητικά",
    description: "Κανένα αρνητικό συμβάν για 30 μέρες",
    current: 22,
    target: 30,
    teamSize: 5,
    reward: "Επιπλέον μέρα άδεια για όλους",
    deadline: "15 Φεβ 2024",
    type: "days"
  },
  {
    id: "3",
    title: "Customer Satisfaction",
    description: "Μέσος όρος 4.5+ αστέρια",
    current: 4.2,
    target: 4.5,
    teamSize: 5,
    reward: "Bonus €200 κατανομή",
    deadline: "28 Φεβ 2024",
    type: "rating"
  }
];

const achievements = [
  { title: "Weekly Winner", description: "Καλύτερος της εβδομάδας", achieved: true, date: "08 Ιαν 2024" },
  { title: "Sales Champion", description: "Έφτασες το sales target", achieved: true, date: "15 Ιαν 2024" },
  { title: "Perfect Week", description: "7 μέρες χωρίς αρνητικά", achieved: false, progress: "5/7 μέρες" },
  { title: "Customer Favorite", description: "10+ reviews 5 αστέρων", achieved: false, progress: "8/10 reviews" },
];

export function EmployeeGoals() {
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-blue-500";
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Στόχοι & Πρόοδος</h1>
          <p className="text-muted-foreground">Παρακολούθηση προσωπικών & ομαδικών στόχων</p>
        </div>

        {/* Personal Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">🎯 Προσωπικοί Στόχοι</h2>
          </div>

          {/* Monthly Points Goal */}
          <Card className="bg-gradient-card border-urban-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">Μηνιαίοι Πόντοι</h3>
                  <p className="text-sm text-muted-foreground">Στόχος: {personalGoals.monthlyPoints.target} πόντοι</p>
                </div>
                <Badge variant="outline" className="bg-primary/10">
                  {personalGoals.monthlyPoints.current}/{personalGoals.monthlyPoints.target}
                </Badge>
              </div>
              <Progress value={getProgressPercentage(personalGoals.monthlyPoints.current, personalGoals.monthlyPoints.target)} className="h-2 mb-2" />
              <div className="flex justify-between items-center">
                <p className={`text-sm font-medium ${getProgressColor(getProgressPercentage(personalGoals.monthlyPoints.current, personalGoals.monthlyPoints.target))}`}>
                  {getProgressPercentage(personalGoals.monthlyPoints.current, personalGoals.monthlyPoints.target).toFixed(0)}% ολοκληρώθηκε
                </p>
                <p className="text-xs text-muted-foreground">Ανταμοιβή: {personalGoals.monthlyPoints.reward}</p>
              </div>
            </CardContent>
          </Card>

          {/* Sales Target Goal */}
          <Card className="bg-gradient-card border-urban-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">Στόχος Τζίρου</h3>
                  <p className="text-sm text-muted-foreground">Στόχος: €{personalGoals.salesTarget.target}</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10">
                  €{personalGoals.salesTarget.current}/€{personalGoals.salesTarget.target}
                </Badge>
              </div>
              <Progress value={getProgressPercentage(personalGoals.salesTarget.current, personalGoals.salesTarget.target)} className="h-2 mb-2" />
              <div className="flex justify-between items-center">
                <p className={`text-sm font-medium ${getProgressColor(getProgressPercentage(personalGoals.salesTarget.current, personalGoals.salesTarget.target))}`}>
                  {getProgressPercentage(personalGoals.salesTarget.current, personalGoals.salesTarget.target).toFixed(0)}% ολοκληρώθηκε
                </p>
                <p className="text-xs text-muted-foreground">Ανταμοιβή: {personalGoals.salesTarget.reward}</p>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Goal */}
          <Card className="bg-gradient-card border-urban-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">Customer Reviews</h3>
                  <p className="text-sm text-muted-foreground">Στόχος: {personalGoals.customerReviews.target} reviews 5⭐</p>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10">
                  {personalGoals.customerReviews.current}/{personalGoals.customerReviews.target}
                </Badge>
              </div>
              <Progress value={getProgressPercentage(personalGoals.customerReviews.current, personalGoals.customerReviews.target)} className="h-2 mb-2" />
              <div className="flex justify-between items-center">
                <p className={`text-sm font-medium ${getProgressColor(getProgressPercentage(personalGoals.customerReviews.current, personalGoals.customerReviews.target))}`}>
                  {getProgressPercentage(personalGoals.customerReviews.current, personalGoals.customerReviews.target).toFixed(0)}% ολοκληρώθηκε
                </p>
                <p className="text-xs text-muted-foreground">Ανταμοιβή: {personalGoals.customerReviews.reward}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">👥 Ομαδικοί Στόχοι</h2>
          </div>

          {teamGoals.map((goal) => (
            <Card key={goal.id} className="bg-gradient-card border-urban-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium">{goal.title}</h3>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {goal.teamSize}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      {goal.type === "points" ? `${goal.current}/${goal.target} πόντοι` :
                       goal.type === "days" ? `${goal.current}/${goal.target} μέρες` :
                       `${goal.current}/5.0 ⭐`}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {goal.deadline}
                    </div>
                  </div>
                  
                  <Progress value={getProgressPercentage(goal.current, goal.target)} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-medium ${getProgressColor(getProgressPercentage(goal.current, goal.target))}`}>
                      {getProgressPercentage(goal.current, goal.target).toFixed(0)}% ολοκληρώθηκε
                    </p>
                  </div>
                  
                  <div className="bg-accent/5 p-2 rounded-lg">
                    <p className="text-xs text-accent">🎁 Ανταμοιβή: {goal.reward}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Achievements */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">🏆 Πρόσφατα Επιτεύγματα</h2>
          </div>

          {achievements.map((achievement, index) => (
            <Card key={index} className={`bg-gradient-card border-urban-border ${achievement.achieved ? 'border-yellow-500/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{achievement.title}</h3>
                      {achievement.achieved && <Badge className="bg-yellow-500/20 text-yellow-400">✓ Επιτεύχθηκε</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {achievement.achieved ? (
                      <p className="text-xs text-yellow-400 mt-1">{achievement.date}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Πρόοδος: {achievement.progress}</p>
                    )}
                  </div>
                  <div className="text-2xl">
                    {achievement.achieved ? '🏆' : '⏳'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}