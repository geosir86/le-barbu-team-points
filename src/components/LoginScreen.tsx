import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Eye, EyeOff, LogIn, Sun, Moon, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/providers/ThemeProvider";
import { PinLoginForm } from "@/components/PinLoginForm";

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [activeTab, setActiveTab] = useState("normal");
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await onLogin(username, password);
      
      if (result.success) {
        setAttempts(0);
        setUsername("");
        setPassword("");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        toast({
          variant: "destructive",
          title: "Αποτυχία σύνδεσης",
          description: result.error || "Λάθος στοιχεία σύνδεσης",
        });

        if (newAttempts >= 3) {
          toast({
            variant: "destructive",
            title: "Πολλές αποτυχημένες προσπάθειες",
            description: "Δοκιμάστε ξανά σε 5 λεπτά",
          });
          setTimeout(() => setAttempts(0), 300000);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά τη σύνδεση",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isBlocked = attempts >= 3;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <Button
            variant={theme === 'light' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('light')}
            className="px-2"
          >
            <Sun className="h-4 w-4" />
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('dark')}
            className="px-2"
          >
            <Moon className="h-4 w-4" />
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('system')}
            className="px-2"
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
    </div>

      {activeTab === "pin" ? (
        <PinLoginForm 
          onBack={() => setActiveTab("normal")}
          onSuccess={() => {
            // Reset attempts and redirect will be handled by the app
            setAttempts(0);
            window.location.reload();
          }}
        />
      ) : (
        <Card className="w-full max-w-md shadow-urban">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              Σύστημα Πόντων Εργαζομένων
            </CardTitle>
            <p className="text-muted-foreground">Συνδεθείτε με τα στοιχεία σας</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="normal">Κανονική σύνδεση</TabsTrigger>
                <TabsTrigger value="pin">Σύνδεση με PIN</TabsTrigger>
              </TabsList>
              
              <TabsContent value="normal" className="mt-4 space-y-4">
                {/* Username Input */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Εισάγετε το username σας"
                    disabled={isBlocked || isLoading}
                    autoComplete="username"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password">Κωδικός Πρόσβασης</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !isBlocked && !isLoading && handleLogin()}
                      className="pr-10"
                      placeholder="Εισάγετε τον κωδικό σας"
                      disabled={isBlocked || isLoading}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isBlocked || isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  onClick={handleLogin}
                  className="w-full"
                  disabled={!username || !password || isBlocked || isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Σύνδεση...
                    </div>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      {isBlocked ? "Μπλοκαρισμένο" : "Σύνδεση"}
                    </>
                  )}
                </Button>

                {/* Attempts Warning */}
                {attempts > 0 && attempts < 3 && (
                  <div className="text-center">
                    <p className="text-sm text-destructive">
                      Εναπομένουσες προσπάθειες: {3 - attempts}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pin" className="mt-4">
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Εάν έχετε λάβει προσωρινό PIN από τον διαχειριστή, 
                    πατήστε το κουμπί παρακάτω για να προχωρήσετε.
                  </p>
                  <Button 
                    onClick={() => {
                      // Switch to PIN form by changing the main activeTab
                      setActiveTab("pin");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Συνέχεια με PIN
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Info Section */}
            <div className="text-xs text-muted-foreground space-y-2 border border-muted rounded-lg p-3">
              <p className="font-medium">Πληροφορίες Σύνδεσης:</p>
              <div className="space-y-1">
                <p><strong>Εργαζόμενοι:</strong> Username που δημιουργεί ο διαχειριστής</p>
                <p><strong>PIN:</strong> Προσωρινός κωδικός 6 ψηφίων από τον διαχειριστή</p>
              </div>
              <p className="text-xs opacity-70 mt-2">
                Οι κωδικοί δημιουργούνται από τον διαχειριστή
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}