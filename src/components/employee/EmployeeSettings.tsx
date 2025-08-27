import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Monitor, Palette, Globe, User, Check, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ColorPalette from '../ColorPalette';
import { useAuth } from '@/hooks/useAuth';
import { EmployeePasswordChange } from './EmployeePasswordChange';

export function EmployeeSettings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { logout, currentEmployee } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    localStorage.setItem('app-language', newLanguage);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Αποσυνδέθηκες",
      description: "Έχεις αποσυνδεθεί επιτυχώς από το σύστημα.",
    });
  };

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display & Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('display')}
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
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
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

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('account')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            {t('contactManager')} για αλλαγές στο προφίλ σας.
          </div>
          
          <Separator />
          
          <div className="pt-2">
            <Button 
              onClick={handleLogout}
              variant="destructive" 
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Αποσύνδεση
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <EmployeePasswordChange />

      {/* Color Palette Component */}
      <ColorPalette userType="employee" userId={currentEmployee?.id} />
    </div>
  );
}