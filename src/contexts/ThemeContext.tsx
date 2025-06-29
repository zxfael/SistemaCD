import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getThemeSettings, getDefaultRestaurant } from '../lib/supabase';
import type { ThemeSettings } from '../lib/supabase';

type ThemeType = {
  bgColor: string;
  textColor: string;
  accentColor: string;
  backgroundImage: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
};

type ThemeContextType = {
  theme: ThemeType;
  themeSettings: ThemeSettings | null;
  updateTheme: (newTheme: Partial<ThemeType>) => void;
  refreshTheme: () => Promise<void>;
};

const defaultTheme: ThemeType = {
  bgColor: 'bg-primary',
  textColor: 'text-white',
  accentColor: 'text-accent',
  backgroundImage: '',
  logoUrl: '',
  primaryColor: '#1E1E1E',
  secondaryColor: '#000000',
  fontFamily: 'Inter'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(defaultTheme);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);

  const convertToTheme = (settings: ThemeSettings): ThemeType => {
    return {
      bgColor: `bg-[${settings.primary_color}]`,
      textColor: `text-[${settings.text_color}]`,
      accentColor: `text-[${settings.accent_color}]`,
      backgroundImage: settings.background_image || '',
      logoUrl: settings.logo_url || '',
      primaryColor: settings.primary_color,
      secondaryColor: settings.secondary_color,
      fontFamily: settings.font_family
    };
  };

  const fetchThemeSettings = async () => {
    try {
      // First get the default restaurant
      const { data: restaurant } = await getDefaultRestaurant();
      
      if (restaurant) {
        const { data: settings, error } = await getThemeSettings(restaurant.id);
        
        if (!error && settings) {
          setThemeSettings(settings);
          setTheme(convertToTheme(settings));
          return;
        }
      }
      
      // Fallback to global theme settings if no restaurant-specific settings
      const { data: globalSettings } = await getThemeSettings();
      
      if (globalSettings) {
        setThemeSettings(globalSettings);
        setTheme(convertToTheme(globalSettings));
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error);
    }
  };

  useEffect(() => {
    fetchThemeSettings();
  }, []);

  const updateTheme = (newTheme: Partial<ThemeType>) => {
    setTheme(currentTheme => ({ ...currentTheme, ...newTheme }));
  };

  const refreshTheme = async () => {
    await fetchThemeSettings();
  };

  return (
    <ThemeContext.Provider value={{ theme, themeSettings, updateTheme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}