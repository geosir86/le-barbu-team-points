import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp, Calendar, Crown } from "lucide-react";

const leaderboardData = [
  { id: "1", name: "Μαρία Παπαδάκη", points: 320, rank: 1, avatar: "", change: "+5", store: "Κέντρο" },
  { id: "2", name: "Νίκος Αντωνίου", points: 290, rank: 2, avatar: "", change: "+2", store: "Mall" },
  { id: "3", name: "Γιώργος Παπαδόπουλος", points: 245, rank: 3, avatar: "", change: "-1", store: "Κέντρο" },
  { id: "4", name: "Άννα Κωνσταντίνου", points: 220, rank: 4, avatar: "", change: "+1", store: "Περιφέρεια" },
  { id: "5", name: "Δημήτρης Νικολάου", points: 180, rank: 5, avatar: "", change: "0", store: "Mall" },
];

const myStats = {
  currentRank: 3,
  previousRank: 2,
  points: 245,
  pointsFromTop: 75,
  pointsFromNext: 45
};

const weeklyTop = [
  { name: "Μαρία Π.", points: 85, achievement: "Sales Master" },
  { name: "Γιώργος Π.", points: 62, achievement: "Review King" },
  { name: "Νίκος Α.", points: 58, achievement: "Customer Hero" },
];

export function EmployeeLeaderboard() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case 2: return "bg-gray-400/20 text-gray-300 border-gray-400/30";
      case 3: return "bg-amber-600/20 text-amber-400 border-amber-600/30";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return "text-green-400";
    if (change.startsWith('-')) return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Κατάταξη</h1>
          <p className="text-muted-foreground">Η θέση σου ανάμεσα στους συναδέλφους</p>
        </div>

        {/* My Position */}
        <Card className="bg-gradient-card border-primary/30 border-2">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-3">
              {getRankIcon(myStats.currentRank)}
              <h2 className="text-2xl font-bold ml-2">#{myStats.currentRank}</h2>
            </div>
            <p className="text-lg font-medium mb-2">Η θέση μου</p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{myStats.points}</p>
                <p>Πόντοι</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">{myStats.pointsFromTop}</p>
                <p>Από την κορυφή</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{myStats.pointsFromNext}</p>
                <p>Από τον επόμενο</p>
              </div>
            </div>
            <div className="mt-3">
              <Badge className={getChangeColor(myStats.currentRank > myStats.previousRank ? `-${myStats.currentRank - myStats.previousRank}` : `+${myStats.previousRank - myStats.currentRank}`)}>
                {myStats.currentRank > myStats.previousRank ? '↓' : '↑'} 
                {Math.abs(myStats.currentRank - myStats.previousRank)} από την προηγούμενη εβδομάδα
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Highlights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">🏆 Top 3</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {leaderboardData.slice(0, 3).map((employee, index) => (
              <Card key={employee.id} className={`bg-gradient-card border-urban-border text-center ${index === 0 ? 'border-yellow-500/30' : index === 1 ? 'border-gray-400/30' : 'border-amber-600/30'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-center mb-2">
                    {getRankIcon(index + 1)}
                  </div>
                  <Avatar className="w-12 h-12 mx-auto mb-2">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{employee.name.split(' ')[0]}</p>
                  <p className="text-xs text-muted-foreground">{employee.store}</p>
                  <Badge className={getRankBadgeColor(index + 1)} variant="outline">
                    {employee.points} πόντοι
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Full Leaderboard */}
        <Card className="bg-gradient-card border-urban-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Πλήρης Κατάταξη
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboardData.map((employee) => (
              <div 
                key={employee.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${employee.id === "3" ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-muted/20'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(employee.rank)}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback className="text-xs">{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">{employee.store}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{employee.points}</p>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs ${getChangeColor(employee.change)}`}>
                      {employee.change !== "0" && (employee.change.startsWith('+') ? '↑' : '↓')}
                      {employee.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Highlights */}
        <Card className="bg-gradient-card border-urban-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              🔥 Εβδομαδιαίοι MVP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyTop.map((employee, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-accent/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{employee.name}</p>
                    <p className="text-xs text-accent">{employee.achievement}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-accent/10">
                  {employee.points} πόντοι
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}