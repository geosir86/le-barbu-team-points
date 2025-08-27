import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Gift, DollarSign, Users, Building, Lock, Palette, Globe, Monitor, Check, Target } from "lucide-react";
import { EventsSettings } from "./EventsSettings";
import { RewardsSettings } from "./RewardsSettings";
import { PointsToEuroSettings } from "./PointsToEuroSettings";
import { EmployeeManagement } from "./EmployeeManagement";
import { StoreManagement } from "./StoreManagement";
import { AuthSettings } from "./AuthSettings";
import { TargetsManagement } from "./TargetsManagement";
import ColorPalette from "./ColorPalette";

export function Settings() {
  const [activeTab, setActiveTab] = useState("events");
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('app-language', newLanguage);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case "events":
        return <EventsSettings />;
      case "rewards":
        return <RewardsSettings />;
      case "points-euro":
        return <PointsToEuroSettings />;
      case "employees":
        return <EmployeeManagement />;
      case "stores":
        return <StoreManagement />;
      case "auth":
        return <AuthSettings />;
      case "targets":
        return <TargetsManagement />;
      case "display":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('display')} & {t('language')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('theme')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleThemeChange('light')}
                      className="flex items-center gap-2"
                    >
                      {theme === 'light' && <Check className="h-4 w-4" />}
                      {t('light')}
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleThemeChange('dark')}
                      className="flex items-center gap-2"
                    >
                      {theme === 'dark' && <Check className="h-4 w-4" />}
                      {t('dark')}
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleThemeChange('system')}
                      className="flex items-center gap-2"
                    >
                      {theme === 'system' && <Check className="h-4 w-4" />}
                      <Monitor className="h-4 w-4" />
                      {t('system')}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Language Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('language')}</Label>
                  <Select value={i18n.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="el">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('greek')}
                        </div>
                      </SelectItem>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('english')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Color Palette Component */}
            <ColorPalette userType="manager" />
          </div>
        );
      default:
        return <EventsSettings />;
    }
  };

  const settingsItems = [
    { id: "events", label: "Συμβάντα", icon: CheckCircle, description: "Θετικά & Αρνητικά" },
    { id: "rewards", label: "Ανταμοιβές", icon: Gift, description: "Ατομικές & Ομαδικές" },
    { id: "points-euro", label: "Πόντοι → €", icon: DollarSign, description: "Conversion Rate" },
    { id: "employees", label: "Εργαζόμενοι", icon: Users, description: "Διαχείριση Team" },
    { id: "stores", label: "Καταστήματα", icon: Building, description: "Stores & Reports" },
    { id: "targets", label: "Στόχοι", icon: Target, description: "Τζίρος & KPIs" },
    { id: "auth", label: "Ασφάλεια", icon: Lock, description: "Κωδικοί & Συνεδρίες" },
    { id: "display", label: t('display'), icon: Palette, description: `${t('theme')} & ${t('language')}` },
  ];

  return (
    <div className="min-h-screen bg-background pb-32 px-4 pt-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            Ρυθμίσεις Συστήματος
          </h1>
          <p className="text-muted-foreground">Διαχείριση όλων των παραμέτρων του συστήματος</p>
        </div>

        {/* Horizontal Navigation */}
        <div className="bg-card border border-border rounded-lg p-2 mb-6">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-center">
                    <div className="text-xs font-medium">{item.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="w-full">{renderActiveContent()}</div>
      </div>
    </div>
  );
}