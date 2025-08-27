import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/providers/ThemeProvider';

export interface CustomColors {
  // Basic colors
  background?: string;
  foreground?: string;
  card?: string;
  'card-foreground'?: string;
  
  // Action colors
  primary?: string;
  'primary-foreground'?: string;
  secondary?: string;
  'secondary-foreground'?: string;
  accent?: string;
  'accent-foreground'?: string;
  
  // Text colors
  muted?: string;
  'muted-foreground'?: string;
  destructive?: string;
  'destructive-foreground'?: string;
  
  // Chart colors
  'chart-primary'?: string;
  'chart-secondary'?: string;
  'chart-tertiary'?: string;
  'chart-quaternary'?: string;
  
  // Border and input
  border?: string;
  input?: string;
  ring?: string;
}

export interface UserPreferences {
  id?: string;
  user_id?: string | null;
  user_type: 'manager' | 'employee';
  theme_mode: 'light' | 'dark' | 'system';
  custom_colors?: CustomColors | null;
}

export const useCustomTheme = (userType: 'manager' | 'employee', userId?: string) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  // Load user preferences
  const loadPreferences = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from('user_preferences')
        .select('*')
        .eq('user_type', userType);
      
      if (userType === 'employee' && userId) {
        query.eq('user_id', userId);
      } else if (userType === 'manager') {
        query.is('user_id', null);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const preferences: UserPreferences = {
          ...data,
          user_type: data.user_type as 'manager' | 'employee',
          theme_mode: data.theme_mode as 'light' | 'dark' | 'system',
          custom_colors: data.custom_colors as CustomColors | null,
        };
        setPreferences(preferences);
        // Apply custom colors if they exist
        if (preferences.custom_colors) {
          applyCustomColors(preferences.custom_colors);
        }
        // Set theme mode
        if (preferences.theme_mode && preferences.theme_mode !== 'system') {
          setTheme(preferences.theme_mode);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save user preferences
  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const dataToSave = {
        user_id: userType === 'employee' && userId ? userId : null,
        user_type: userType,
        ...newPreferences,
        custom_colors: newPreferences.custom_colors as any, // Cast to Json type for Supabase
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(dataToSave, {
          onConflict: 'user_type,user_id',
        })
        .select()
        .single();

      if (error) throw error;

      const preferences: UserPreferences = {
        ...data,
        user_type: data.user_type as 'manager' | 'employee',
        theme_mode: data.theme_mode as 'light' | 'dark' | 'system',
        custom_colors: data.custom_colors as CustomColors | null,
      };
      setPreferences(preferences);

      // Apply changes immediately
      if (newPreferences.custom_colors) {
        applyCustomColors(newPreferences.custom_colors);
      }
      if (newPreferences.theme_mode && newPreferences.theme_mode !== 'system') {
        setTheme(newPreferences.theme_mode);
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving preferences:', error);
      return { success: false, error };
    }
  };

  // Apply custom colors to CSS variables
  const applyCustomColors = (colors: CustomColors) => {
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--${key}`, value);
      }
    });
  };

  // Reset to default colors
  const resetToDefaults = async () => {
    try {
      const query = supabase
        .from('user_preferences')
        .update({ custom_colors: null })
        .eq('user_type', userType);
      
      if (userType === 'employee' && userId) {
        query.eq('user_id', userId);
      } else if (userType === 'manager') {
        query.is('user_id', null);
      }
      
      const { error } = await query;

      if (error) throw error;

      // Remove custom CSS variables
      const root = document.documentElement;
      const defaultColors: CustomColors = {
        background: '',
        foreground: '',
        card: '',
        'card-foreground': '',
        primary: '',
        'primary-foreground': '',
        secondary: '',
        'secondary-foreground': '',
        accent: '',
        'accent-foreground': '',
        muted: '',
        'muted-foreground': '',
        destructive: '',
        'destructive-foreground': '',
        'chart-primary': '',
        'chart-secondary': '',
        'chart-tertiary': '',
        'chart-quaternary': '',
        border: '',
        input: '',
        ring: '',
      };

      Object.keys(defaultColors).forEach((key) => {
        root.style.removeProperty(`--${key}`);
      });

      await loadPreferences();
      return { success: true };
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (userType === 'manager' || (userType === 'employee' && userId)) {
      loadPreferences();
    }
  }, [userType, userId]);

  return {
    preferences,
    loading,
    savePreferences,
    resetToDefaults,
    applyCustomColors,
  };
};