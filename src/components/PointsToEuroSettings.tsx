import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Euro, Gift, CreditCard, Clock } from "lucide-react";
import { toast } from "sonner";

interface ConversionSettings {
  conversionRate: number; // points per euro
  minimumRedemption: number; // minimum points to redeem
  redemptionMethods: {
    cash: boolean;
    gift: boolean;
    timeOff: boolean;
  };
  autoConversion: boolean;
  autoConversionThreshold: number;
}

const initialSettings: ConversionSettings = {
  conversionRate: 10, // 10 points = 1€
  minimumRedemption: 50, // minimum 50 points to redeem
  redemptionMethods: {
    cash: true,
    gift: true,
    timeOff: false,
  },
  autoConversion: false,
  autoConversionThreshold: 200,
};

export function PointsToEuroSettings() {
  const [settings, setSettings] = useState<ConversionSettings>(initialSettings);
  const [previewPoints, setPreviewPoints] = useState(100);

  const updateSettings = (updates: Partial<ConversionSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateRedemptionMethod = (method: keyof ConversionSettings['redemptionMethods'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      redemptionMethods: {
        ...prev.redemptionMethods,
        [method]: enabled
      }
    }));
  };

  const saveSettings = () => {
    toast.success("Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!");
  };

  const resetToDefaults = () => {
    setSettings(initialSettings);
    toast.success("Οι ρυθμίσεις επαναφέρθηκαν στις προκαθορισμένες τιμές!");
  };

  const previewEuros = previewPoints / settings.conversionRate;

  return (
    <div className="space-y-6">
      {/* Main Conversion Settings */}
      <Card className="bg-card border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-primary">
            <Euro className="h-5 w-5" />
            💶 Αντιστοιχία Πόντων ↔ Ευρώ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conversion Rate */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Τιμή Μετατροπής</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={settings.conversionRate}
                onChange={(e) => updateSettings({ conversionRate: Number(e.target.value) })}
                className="w-24 bg-muted border-urban-border text-center"
                min="1"
              />
              <span className="text-sm text-muted-foreground">πόντοι = 1€</span>
            </div>
            <p className="text-xs text-muted-foreground">Πόσοι πόντοι ισοδυναμούν με 1 ευρώ</p>
          </div>

          {/* Minimum Redemption */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ελάχιστο Όριο Εξαργύρωσης</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={settings.minimumRedemption}
                onChange={(e) => updateSettings({ minimumRedemption: Number(e.target.value) })}
                className="w-24 bg-muted border-urban-border text-center"
                min="1"
              />
              <span className="text-sm text-muted-foreground">πόντοι</span>
            </div>
            <p className="text-xs text-muted-foreground">Ελάχιστος αριθμός πόντων για εξαργύρωση</p>
          </div>

          {/* Preview Calculator */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-medium text-sm mb-3">🧮 Υπολογιστής Προεπισκόπησης</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Πόντοι</Label>
                <Input
                  type="number"
                  value={previewPoints}
                  onChange={(e) => setPreviewPoints(Number(e.target.value))}
                  className="bg-background border-urban-border"
                  min="0"
                />
              </div>
              <div>
                <Label className="text-xs">Ευρώ</Label>
                <div className="h-10 flex items-center px-3 bg-muted/50 border border-urban-border rounded-md text-sm">
                  €{previewEuros.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redemption Methods */}
      <Card className="bg-card border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-accent" />
            🎯 Τρόποι Εξαργύρωσης
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-sm">💰 Χρήματα</p>
                  <p className="text-xs text-muted-foreground">Άμεση πληρωμή σε ευρώ</p>
                </div>
              </div>
              <Switch
                checked={settings.redemptionMethods.cash}
                onCheckedChange={(checked) => updateRedemptionMethod('cash', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-sm">🎁 Δωροκάρτες</p>
                  <p className="text-xs text-muted-foreground">Δωροκάρτες καταστημάτων</p>
                </div>
              </div>
              <Switch
                checked={settings.redemptionMethods.gift}
                onCheckedChange={(checked) => updateRedemptionMethod('gift', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-urban-border">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-sm">🕒 Άδεια</p>
                  <p className="text-xs text-muted-foreground">Μετατροπή σε ημέρες άδειας</p>
                </div>
              </div>
              <Switch
                checked={settings.redemptionMethods.timeOff}
                onCheckedChange={(checked) => updateRedemptionMethod('timeOff', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto Conversion */}
      <Card className="bg-card border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-accent" />
            🔄 Αυτόματη Μετατροπή
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Ενεργοποίηση Αυτόματης Μετατροπής</p>
              <p className="text-xs text-muted-foreground">
                Αυτόματη μετατροπή πόντων σε ευρώ όταν ξεπεραστεί το όριο
              </p>
            </div>
            <Switch
              checked={settings.autoConversion}
              onCheckedChange={(checked) => updateSettings({ autoConversion: checked })}
            />
          </div>

          {settings.autoConversion && (
            <div className="space-y-2 border-t border-urban-border pt-4">
              <Label className="text-sm font-medium">Όριο Αυτόματης Μετατροπής</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={settings.autoConversionThreshold}
                  onChange={(e) => updateSettings({ autoConversionThreshold: Number(e.target.value) })}
                  className="w-32 bg-muted border-urban-border text-center"
                  min="50"
                />
                <span className="text-sm text-muted-foreground">πόντοι</span>
              </div>
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-xs text-accent-foreground">
                  <strong>Παράδειγμα:</strong> Όταν ένας εργαζόμενος φτάσει {settings.autoConversionThreshold} πόντους, 
                  θα μετατραπούν αυτόματα σε €{(settings.autoConversionThreshold / settings.conversionRate).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={saveSettings} className="flex-1 bg-gradient-gold hover:bg-gradient-gold/90">
          💾 Αποθήκευση Ρυθμίσεων
        </Button>
        <Button onClick={resetToDefaults} variant="outline" className="flex-1">
          🔄 Επαναφορά Προκαθορισμένων
        </Button>
      </div>
    </div>
  );
}