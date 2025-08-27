import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Lock, LogOut, User, Eye, EyeOff, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function AuthSettings() {
  const { userRole, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleManagerPasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
      });
      return;
    }

    if (newPassword.length < 3) {
      toast({
        variant: "destructive",
        title: "Μη έγκυρος κωδικός",
        description: "Ο κωδικός πρέπει να έχει τουλάχιστον 3 χαρακτήρες",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Οι κωδικοί δεν ταιριάζουν",
        description: "Παρακαλώ βεβαιωθείτε ότι οι κωδικοί είναι ίδιοι",
      });
      return;
    }

    // Verify current password
    const storedPassword = localStorage.getItem("manager-password") || "manager123";
    if (currentPassword !== storedPassword) {
      toast({
        variant: "destructive",
        title: "Λάθος κωδικός",
        description: "Ο τρέχων κωδικός που εισάγατε δεν είναι σωστός",
      });
      return;
    }

    // Update password
    localStorage.setItem("manager-password", newPassword);
    toast({
      title: "Επιτυχής αλλαγή",
      description: "Ο κωδικός διαχειριστή άλλαξε επιτυχώς",
    });

    // Reset form
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      {/* Current Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Πληροφορίες Συνεδρίας
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Συνδεδεμένος ως:</p>
              <p className="text-sm text-muted-foreground">
                {userRole === "manager" ? "Διαχειριστής (Manager)" : "Εργαζόμενος (Employee)"}
              </p>
            </div>
            <Button onClick={logout} variant="destructive" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Αποσύνδεση
            </Button>
          </div>
          
          <Separator />
          
          <div className="text-xs text-muted-foreground">
            <p>Η συνεδρία λήγει αυτόματα μετά από 4 ώρες αδράνειας</p>
            <p>Χρόνος σύνδεσης: {
              localStorage.getItem("login-time") 
                ? new Date(parseInt(localStorage.getItem("login-time")!)).toLocaleString('el-GR')
                : "Άγνωστο"
            }</p>
          </div>
        </CardContent>
      </Card>

      {/* Manager Password Management - Only for Managers */}
      {userRole === "manager" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Αλλαγή Κωδικού Διαχειριστή
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Τρέχων κωδικός</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Εισάγετε τον τρέχοντα κωδικό σας"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Νέος κωδικός</Label>
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Εισάγετε νέο κωδικό (min. 3 χαρακτήρες)"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Επιβεβαίωση κωδικού</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Επιβεβαιώστε τον νέο κωδικό"
              />
            </div>

            {/* Change Password Button */}
            <Button
              onClick={handleManagerPasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Αλλαγή κωδικού
            </Button>

            {/* Info */}
            <div className="text-xs text-muted-foreground border border-muted rounded-lg p-3">
              <p className="font-medium mb-1">Σημειώσεις:</p>
              <ul className="space-y-1">
                <li>• Για reset κωδικών εργαζομένων χρησιμοποιήστε το μενού "Εργαζόμενοι"</li>
                <li>• Οι κωδικοί εργαζομένων αποθηκεύονται κρυπτογραφημένοι στη βάση</li>
                <li>• Μετά από 3 λάθος προσπάθειες, το σύστημα μπλοκάρει για 5 λεπτά</li>
                <li>• Οι συνεδρίες λήγουν αυτόματα μετά από 4 ώρες</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee View - Limited Info */}
      {userRole === "employee" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Ασφάλεια Λογαριασμού
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Μπορείτε να αλλάξετε τον κωδικό σας από την ενότητα "Ρυθμίσεις" στο προφίλ σας.
            </p>
            <p className="text-sm text-muted-foreground">
              Για επαναφορά κωδικού, επικοινωνήστε με τον διαχειριστή για να σας δώσει προσωρινό PIN.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}