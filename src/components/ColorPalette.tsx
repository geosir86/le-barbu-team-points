import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomTheme, CustomColors } from '@/hooks/useCustomTheme';
import { toast } from '@/hooks/use-toast';
import { Palette, RotateCcw } from 'lucide-react';

interface ColorPaletteProps {
  userType: 'manager' | 'employee';
  userId?: string;
}

const ColorPalette = ({ userType, userId }: ColorPaletteProps) => {
  const { preferences, loading, savePreferences, resetToDefaults } = useCustomTheme(userType, userId);
  const [tempColors, setTempColors] = useState<CustomColors>({});

  const colorGroups = {
    basic: {
      title: 'Βασικά Χρώματα',
      description: 'Χρώματα φόντου και κειμένου',
      colors: {
        background: 'Χρώμα Φόντου',
        foreground: 'Χρώμα Κύριου Κειμένου',
        card: 'Χρώμα Καρτών',
        'card-foreground': 'Χρώμα Κειμένου Καρτών',
      }
    },
    actions: {
      title: 'Χρώματα Δράσης',
      description: 'Κουμπιά και ενεργά στοιχεία',
      colors: {
        primary: 'Κύριο Χρώμα',
        'primary-foreground': 'Κείμενο Κυρίου Χρώματος',
        secondary: 'Δευτερεύον Χρώμα',
        'secondary-foreground': 'Κείμενο Δευτερεύοντος',
        accent: 'Χρώμα Έμφασης',
        'accent-foreground': 'Κείμενο Έμφασης',
      }
    },
    text: {
      title: 'Χρώματα Κειμένου',
      description: 'Διάφορα επίπεδα κειμένου',
      colors: {
        muted: 'Χρώμα Φόντου Σίγασης',
        'muted-foreground': 'Χρώμα Δευτερεύοντος Κειμένου',
        destructive: 'Χρώμα Διαγραφής/Σφάλματος',
        'destructive-foreground': 'Κείμενο Σφάλματος',
      }
    },
    charts: {
      title: 'Χρώματα Γραφημάτων',
      description: 'Χρώματα για charts και statistics',
      colors: {
        'chart-primary': 'Κύριο Χρώμα Γραφήματος',
        'chart-secondary': 'Δευτερεύον Χρώμα Γραφήματος',
        'chart-tertiary': 'Τρίτο Χρώμα Γραφήματος',
        'chart-quaternary': 'Τέταρτο Χρώμα Γραφήματος',
      }
    },
    interface: {
      title: 'Στοιχεία Διεπαφής',
      description: 'Borders, inputs και άλλα',
      colors: {
        border: 'Χρώμα Περιγραμμάτων',
        input: 'Χρώμα Φόντου Εισόδου',
        ring: 'Χρώμα Focus Ring',
      }
    }
  };

  const handleColorChange = (colorKey: string, value: string) => {
    const newColors = { ...tempColors, [colorKey]: value };
    setTempColors(newColors);
    
    // Apply immediately for preview
    const root = document.documentElement;
    root.style.setProperty(`--${colorKey}`, value);
  };

  const handleSave = async () => {
    const result = await savePreferences({
      custom_colors: { ...preferences?.custom_colors, ...tempColors }
    });

    if (result.success) {
      toast({
        title: "Επιτυχία",
        description: "Οι προτιμήσεις χρωμάτων αποθηκεύτηκαν επιτυχώς.",
      });
      setTempColors({});
    } else {
      toast({
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η αποθήκευση των προτιμήσεων.",
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    const result = await resetToDefaults();
    
    if (result.success) {
      toast({
        title: "Επιτυχία",
        description: "Τα χρώματα επαναφέρθηκαν στις προεπιλογές.",
      });
      setTempColors({});
    } else {
      toast({
        title: "Σφάλμα",
        description: "Δεν ήταν δυνατή η επαναφορά των χρωμάτων.",
        variant: "destructive",
      });
    }
  };

  const getCurrentColor = (colorKey: string): string => {
    return tempColors[colorKey as keyof CustomColors] || 
           preferences?.custom_colors?.[colorKey as keyof CustomColors] || 
           '';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Παλέτα Χρωμάτων
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Φόρτωση προτιμήσεων...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Παλέτα Χρωμάτων
        </CardTitle>
        <CardDescription>
          Προσαρμόστε τα χρώματα της εφαρμογής σύμφωνα με τις προτιμήσεις σας
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Βασικά</TabsTrigger>
            <TabsTrigger value="actions">Δράσεις</TabsTrigger>
            <TabsTrigger value="text">Κείμενο</TabsTrigger>
            <TabsTrigger value="charts">Γραφήματα</TabsTrigger>
            <TabsTrigger value="interface">Διεπαφή</TabsTrigger>
          </TabsList>

          {Object.entries(colorGroups).map(([groupKey, group]) => (
            <TabsContent key={groupKey} value={groupKey} className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{group.title}</h3>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(group.colors).map(([colorKey, colorLabel]) => (
                  <div key={colorKey} className="space-y-2">
                    <Label htmlFor={colorKey}>{colorLabel}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id={colorKey}
                        type="color"
                        value={getCurrentColor(colorKey) || '#000000'}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        className="w-10 h-10 rounded border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={getCurrentColor(colorKey)}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        placeholder="π.χ. #000000 ή hsl(0, 0%, 0%)"
                        className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={Object.keys(tempColors).length === 0}>
            Αποθήκευση Χρωμάτων
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Επαναφορά Προεπιλογών
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorPalette;