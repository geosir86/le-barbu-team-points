import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from 'bcryptjs';

interface PinLoginFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function PinLoginForm({ onBack, onSuccess }: PinLoginFormProps) {
  const [step, setStep] = useState<'pin' | 'newPassword'>('pin');
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const { toast } = useToast();

  const handlePinVerification = async () => {
    if (!username || !pin) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα πεδία",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, find the employee
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('username', username)
        .eq('is_active', true)
        .maybeSingle();

      if (employeeError || !employee) {
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Δεν βρέθηκε εργαζόμενος με αυτό το username",
        });
        return;
      }

      // Find valid, unused PIN for this employee
      const { data: userPins, error: pinsError } = await supabase
        .from('user_pins')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (pinsError) {
        console.error('Error fetching PINs:', pinsError);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: "Σφάλμα κατά την επαλήθευση του PIN",
        });
        return;
      }

      if (!userPins || userPins.length === 0) {
        toast({
          variant: "destructive",
          title: "Μη έγκυρο PIN",
          description: "Δεν βρέθηκε έγκυρο PIN ή έχει λήξει",
        });
        return;
      }

      // Verify PIN against all valid PINs (in case there are multiple)
      let validPin = null;
      for (const userPin of userPins) {
        const pinMatch = await bcrypt.compare(pin, userPin.pin_hash);
        if (pinMatch) {
          validPin = userPin;
          break;
        }
      }

      if (!validPin) {
        toast({
          variant: "destructive",
          title: "Λάθος PIN",
          description: "Το PIN που εισάγατε δεν είναι σωστό",
        });
        return;
      }

      // PIN is valid, proceed to password reset
      setEmployeeId(employee.id);
      setStep('newPassword');
      
      toast({
        title: "Επιτυχής επαλήθευση",
        description: "Παρακαλώ ορίστε νέο κωδικό πρόσβασης",
      });

    } catch (error) {
      console.error('Error verifying PIN:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά την επαλήθευση",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
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

    setIsLoading(true);

    try {
      // Hash new password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      // Update employee password
      const { error: updateError } = await supabase
        .from('employees')
        .update({ password_hash })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      // Mark all PINs for this employee as used
      const { error: pinUpdateError } = await supabase
        .from('user_pins')
        .update({ used: true })
        .eq('employee_id', employeeId)
        .eq('used', false);

      if (pinUpdateError) {
        console.warn('Error updating PIN status:', pinUpdateError);
      }

      toast({
        title: "Επιτυχής αλλαγή κωδικού",
        description: "Ο κωδικός σας άλλαξε επιτυχώς. Μπορείτε τώρα να συνδεθείτε.",
      });

      // Reset form and go back to normal login
      setStep('pin');
      setUsername("");
      setPin("");
      setNewPassword("");
      setConfirmPassword("");
      setEmployeeId("");
      onBack();

    } catch (error) {
      console.error('Error resetting password:', error);
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
    <Card className="w-full max-w-md shadow-urban">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Hash className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold">
          {step === 'pin' ? 'Σύνδεση με PIN' : 'Ορισμός νέου κωδικού'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === 'pin' 
            ? 'Εισάγετε το username σας και το προσωρινό PIN που λάβατε'
            : 'Ορίστε τον νέο σας κωδικό πρόσβασης'
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'pin' ? (
          <>
            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Εισάγετε το username σας"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* PIN Input */}
            <div className="space-y-2">
              <Label htmlFor="pin">PIN (6 ψηφία)</Label>
              <Input
                id="pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Εισάγετε το 6-ψήφιο PIN"
                disabled={isLoading}
                maxLength={6}
                className="font-mono text-center text-lg tracking-wider"
              />
            </div>

            {/* Verify PIN Button */}
            <Button
              onClick={handlePinVerification}
              className="w-full"
              disabled={!username || pin.length !== 6 || isLoading}
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Επαλήθευση...
                </div>
              ) : (
                <>
                  <Hash className="h-4 w-4 mr-2" />
                  Επαλήθευση PIN
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* New Password Input */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Νέος κωδικός</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Εισάγετε νέο κωδικό"
                  disabled={isLoading}
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

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Επιβεβαίωση κωδικού</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Επιβεβαιώστε τον κωδικό"
                disabled={isLoading}
              />
            </div>

            {/* Set Password Button */}
            <Button
              onClick={handlePasswordReset}
              className="w-full"
              disabled={!newPassword || !confirmPassword || isLoading}
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Αποθήκευση...
                </div>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Ορισμός κωδικού
                </>
              )}
            </Button>
          </>
        )}

        {/* Back Button */}
        <Button onClick={onBack} variant="ghost" className="w-full" disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Επιστροφή στη σύνδεση
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground border border-muted rounded-lg p-3">
          <p className="font-medium mb-1">Πληροφορίες:</p>
          <ul className="space-y-1">
            <li>• Το PIN ισχύει για 24 ώρες από τη δημιουργία του</li>
            <li>• Μετά την αλλαγή κωδικού, το PIN γίνεται άκυρο</li>
            <li>• Επικοινωνήστε με τον διαχειριστή για νέο PIN</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}