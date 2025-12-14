import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Settings {
  companyName: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  showNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  dailyReportEnabled: boolean;
  dailyReportTime: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const defaultSettings: Settings = {
  companyName: 'Pipe Inventory Management',
  currency: 'TZS',
  taxRate: 0.18, // 18% VAT for Tanzania
  lowStockThreshold: 10,
  showNotifications: true,
  theme: 'system',
  dailyReportEnabled: false,
  dailyReportTime: '00:00',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('app_settings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (e) {
        console.error('Error parsing stored settings');
      }
    }
    
    // Initialize dark mode based on settings or system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = settings.theme;
    
    if (storedTheme === 'dark' || (storedTheme === 'system' && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
    
    // Handle theme changes
    if (newSettings.theme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const newIsDark = 
        newSettings.theme === 'dark' || 
        (newSettings.theme === 'system' && prefersDark);
      
      setIsDarkMode(newIsDark);
      
      if (newIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      isDarkMode, 
      toggleDarkMode 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 