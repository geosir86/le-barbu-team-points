import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ThumbsUp, Heart, Star, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Feedback {
  id: string;
  from_employee_id: string | null;
  feedback_type: string;
  title: string;
  message: string;
  rating?: number;
  category?: string;
  created_at: string;
}

export function EmployeeFeedback() {
  const [selectedTab, setSelectedTab] = useState("received");
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentEmployee } = useAuth();

  useEffect(() => {
    if (currentEmployee) {
      loadData();
    }
  }, [currentEmployee]);

  const loadData = async () => {
    if (!currentEmployee) return;

    try {
      // Load feedback and colleagues in parallel
      const [feedbackResponse, colleaguesResponse] = await Promise.all([
        supabase
          .from('employee_feedback')
          .select('*')
          .eq('employee_id', currentEmployee.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('employees')
          .select('id, full_name')
          .neq('id', currentEmployee.id)
          .eq('is_active', true)
          .limit(10)
      ]);

      if (feedbackResponse.error) throw feedbackResponse.error;
      if (colleaguesResponse.error) throw colleaguesResponse.error;

      setFeedback(feedbackResponse.data || []);
      setColleagues(colleaguesResponse.data || []);
    } catch (error) {
      console.error('Error loading feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGiveKudos = async (colleagueId: string, colleagueName: string) => {
    if (!currentEmployee) return;

    try {
      const { error } = await supabase
        .from('employee_feedback')
        .insert({
          employee_id: colleagueId,
          from_employee_id: currentEmployee.id,
          feedback_type: 'kudos',
          title: 'Kudos',
          message: `Kudos από ${currentEmployee.full_name}!`
        });

      if (error) throw error;

      toast.success(`Έδωσες Kudos στον/την ${colleagueName}! 🎉`);
    } catch (error) {
      console.error('Error giving kudos:', error);
      toast.error('Δεν ήταν δυνατή η αποστολή του kudos');
    }
  };

  const managerFeedback = feedback.filter(f => f.feedback_type === 'manager');
  const peerKudos = feedback.filter(f => f.feedback_type === 'peer' || f.feedback_type === 'kudos');

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case "positive": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "mixed": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "negative": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getKudosTypeEmoji = (type: string) => {
    switch (type) {
      case "thanks": return "🙏";
      case "recognition": return "🏆";
      case "teamwork": return "🤝";
      default: return "👍";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-6">
        <div className="max-w-md mx-auto text-center">
          <div className="text-muted-foreground">Φόρτωση feedback...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Feedback & Kudos</h1>
          <p className="text-muted-foreground">Αναγνώριση και βελτίωση</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-card border-urban-border">
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-xl font-bold text-blue-500">{managerFeedback.length}</p>
              <p className="text-xs text-muted-foreground">Manager Feedback</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-urban-border">
            <CardContent className="p-4 text-center">
              <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-xl font-bold text-green-500">{peerKudos.length}</p>
              <p className="text-xs text-muted-foreground">Kudos Λήψη</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-urban-border">
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-xl font-bold text-red-500">2</p>
              <p className="text-xs text-muted-foreground">Kudos Αποστολή</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received">Λήψη</TabsTrigger>
            <TabsTrigger value="give">Αποστολή</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
          </TabsList>

          {/* Received Kudos */}
          <TabsContent value="received" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold">🎉 Kudos που έλαβες</h2>
            </div>

            {peerKudos.length === 0 ? (
              <Card className="bg-gradient-card border-urban-border">
                <CardContent className="p-6 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Δεν έχεις λάβει kudos ακόμα</p>
                </CardContent>
              </Card>
            ) : (
              peerKudos.map((kudo) => (
                <Card key={kudo.id} className="bg-gradient-card border-urban-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="" />
                        <AvatarFallback>FK</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-sm">Συνάδελφος</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(kudo.created_at).toLocaleDateString('el-GR')}
                            </div>
                          </div>
                          <span className="text-xl">{getKudosTypeEmoji(kudo.feedback_type)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{kudo.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Give Kudos */}
          <TabsContent value="give" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold">💝 Δώσε Kudos</h2>
            </div>

            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-accent mb-2">📝 Κανόνες Kudos</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 1 Kudos ανά συνάδελφο την εβδομάδα</li>
                  <li>• Τα Kudos δίνουν +2 πόντοι στον παραλήπτη</li>
                  <li>• Κάθε Kudos που δίνεις σου δίνει +1 πόντο</li>
                </ul>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {colleagues.map((colleague) => (
                <Card key={colleague.id} className="bg-gradient-card border-urban-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="" />
                          <AvatarFallback>{colleague.full_name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-sm">{colleague.full_name}</h3>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleGiveKudos(colleague.id, colleague.full_name)}
                        variant="default"
                        size="sm"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Kudos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Manager Feedback */}
          <TabsContent value="manager" className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">💼 Feedback από Manager</h2>
            </div>

            {managerFeedback.length === 0 ? (
              <Card className="bg-gradient-card border-urban-border">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Δεν έχεις feedback από τον manager ακόμα</p>
                </CardContent>
              </Card>
            ) : (
              managerFeedback.map((feedbackItem) => (
                <Card key={feedbackItem.id} className="bg-gradient-card border-urban-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium text-sm">Manager</h3>
                          {feedbackItem.rating && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${i < feedbackItem.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} 
                                  />
                                ))}
                              </div>
                              {feedbackItem.category && (
                                <Badge variant="outline" className="text-xs">
                                  {feedbackItem.category}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getFeedbackTypeColor(feedbackItem.feedback_type)} variant="outline">
                          {feedbackItem.feedback_type === "positive" ? "Θετικό" : feedbackItem.feedback_type === "mixed" ? "Μικτό" : "Αρνητικό"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(feedbackItem.created_at).toLocaleDateString('el-GR')}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{feedbackItem.message}</p>
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