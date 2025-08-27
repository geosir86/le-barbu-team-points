import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { KeyRound, Hash, Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from 'bcryptjs';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    full_name: string;
    username: string;
  } | null;
  onSuccess?: () => void;
}

export function PasswordResetModal({ isOpen, onClose, employee, onSuccess }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPin, setGeneratedPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const { toast } = useToast();

  const handleDirectPasswordReset = async () => {
    if (!employee) return;

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
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      const { error } = await supabase
        .from('employees')
        .update({ password_hash })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Επιτυχής αλλαγή κωδικού",
        description: `Ο κωδικός του ${employee.full_name} άλλαξε επιτυχώς`,
      });

      resetForm();
      onClose();
      onSuccess?.();
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

  const handleGeneratePin = async () => {
    if (!employee) return;

    setIsLoading(true);

    try {
      // Generate 6-digit PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const saltRounds = 10;
      const pin_hash = await bcrypt.hash(pin, saltRounds);

      // Set expiry to 24 hours from now
      const expires_at = new Date();
      expires_at.setHours(expires_at.getHours() + 24);

      // Insert PIN into database
      const { error } = await supabase
        .from('user_pins')
        .insert({
          employee_id: employee.id,
          pin_hash,
          expires_at: expires_at.toISOString(),
          used: false,
          created_by: 'manager'
        });

      if (error) throw error;

      setGeneratedPin(pin);
      setShowPin(true);

      toast({
        title: "PIN δημιουργήθηκε",
        description: `Προσωρινός PIN για τον ${employee.full_name}. Ισχύει για 24 ώρες.`,
      });
    } catch (error) {
      console.error('Error generating PIN:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η δημιουργία PIN",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPin = () => {
    navigator.clipboard.writeText(generatedPin);
    toast({
      title: "PIN αντιγράφηκε",
      description: "Το PIN αντιγράφηκε στο clipboard",
    });
  };

  const resetForm = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setGeneratedPin("");
    setShowPin(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Reset κωδικού - {employee.full_name}
          </DialogTitle>
        </DialogHeader>

        {showPin ? (
          // Show generated PIN
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted rounded-lg">
              <Hash className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-2">Προσωρινός PIN</h3>
              <div className="text-3xl font-mono font-bold text-primary mb-2">
                {generatedPin}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Ισχύει για 24 ώρες
              </p>
              <Button onClick={copyPin} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Αντιγραφή PIN
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground border border-muted rounded p-3">
              <p className="font-medium mb-1">Οδηγίες για τον εργαζόμενο:</p>
              <ul className="space-y-1">
                <li>1. Στη σελίδα σύνδεσης, επιλέξτε "Σύνδεση με PIN"</li>
                <li>2. Εισάγετε το username: <strong>{employee.username}</strong></li>
                <li>3. Εισάγετε το PIN: <strong>{generatedPin}</strong></li>
                <li>4. Θα οδηγηθείτε να ορίσετε νέο κωδικό</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleClose} className="flex-1">
                Κλείσιμο
              </Button>
            </div>
          </div>
        ) : (
          // Show reset options
          <div className="space-y-6">
            {/* Direct Password Reset */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Ορισμός νέου κωδικού</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-password">Νέος κωδικός</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Εισάγετε νέο κωδικό"
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
                
                <div>
                  <Label htmlFor="confirm-password">Επιβεβαίωση κωδικού</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Επιβεβαιώστε τον κωδικό"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleDirectPasswordReset}
                disabled={!newPassword || !confirmPassword || isLoading}
                className="w-full"
              >
                {isLoading ? "Αποθήκευση..." : "Αποθήκευση κωδικού"}
              </Button>
            </div>

            <Separator />

            {/* PIN Generation */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Έκδοση προσωρινού PIN</h3>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Δημιουργήστε 6-ψήφιο PIN που ισχύει για 24 ώρες. 
                Ο εργαζόμενος θα το χρησιμοποιήσει για να ορίσει νέο κωδικό.
              </p>
              
              <Button 
                onClick={handleGeneratePin}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? "Δημιουργία..." : "Δημιουργία PIN"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleClose} variant="ghost" className="flex-1">
                Ακύρωση
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}