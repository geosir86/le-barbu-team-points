import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from 'bcryptjs';

export function EmployeePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentEmployee } = useAuth();
  const { toast } = useToast();

  const handlePasswordChange = async () => {
    if (!currentEmployee) return;

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
        description: "Παρακαλώ βεβαιωθείτε ότι οι νέοι κωδικοί είναι ίδιοι",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, get the employee's current password hash to verify current password
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('password_hash')
        .eq('id', currentEmployee.id)
        .single();

      if (fetchError) throw fetchError;

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, employee.password_hash);
      if (!passwordMatch) {
        toast({
          variant: "destructive",
          title: "Λάθος κωδικός",
          description: "Ο τρέχων κωδικός που εισάγατε δεν είναι σωστός",
        });
        return;
      }

      // Hash new password
      const saltRounds = 10;
      const new_password_hash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const { error: updateError } = await supabase
        .from('employees')
        .update({ password_hash: new_password_hash })
        .eq('id', currentEmployee.id);

      if (updateError) throw updateError;

      toast({
        title: "Επιτυχής αλλαγή κωδικού",
        description: "Ο κωδικός σας άλλαξε επιτυχώς",
      });

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswords(false);

    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αλλαγή του κωδικού",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Αλλαγή Κωδικού Πρόσβασης
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="current-password">Τρέχων κωδικός</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Εισάγετε τον τρέχοντα κωδικό σας"
              className="pr-10"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPasswords(!showPasswords)}
              disabled={isLoading}
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="new-password">Νέος κωδικός</Label>
          <Input
            id="new-password"
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Εισάγετε νέο κωδικό (min. 3 χαρακτήρες)"
            disabled={isLoading}
          />
        </div>

        {/* Confirm New Password */}
        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">Επιβεβαίωση νέου κωδικού</Label>
          <Input
            id="confirm-new-password"
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Επιβεβαιώστε τον νέο κωδικό"
            disabled={isLoading}
          />
        </div>

        {/* Change Password Button */}
        <Button
          onClick={handlePasswordChange}
          disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Αλλαγή κωδικού...
            </div>
          ) : (
            <>
              <KeyRound className="h-4 w-4 mr-2" />
              Αλλαγή κωδικού
            </>
          )}
        </Button>

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground border border-muted rounded-lg p-3">
          <p className="font-medium mb-1">Συμβουλές ασφαλείας:</p>
          <ul className="space-y-1">
            <li>• Χρησιμοποιήστε κωδικό που δεν έχετε χρησιμοποιήσει αλλού</li>
            <li>• Αλλάξτε τον κωδικό σας τακτικά</li>
            <li>• Μην μοιράζεστε τον κωδικό σας με κανέναν</li>
            <li>• Ο κωδικός πρέπει να έχει τουλάχιστον 3 χαρακτήρες</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}