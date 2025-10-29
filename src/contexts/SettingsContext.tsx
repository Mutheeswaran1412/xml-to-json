import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ConversionSettings {
  preserveAttributes: boolean;
  minifyOutput: boolean;
  outputFormat: 'pretty' | 'minified' | 'compact';
  fileFilters: string[];
  autoSave: boolean;
  maxFileSize: number;
  performanceMode: 'fast' | 'balanced' | 'memory';
}

interface SettingsContextType {
  settings: ConversionSettings;
  updateSettings: (newSettings: Partial<ConversionSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => void;
}

const defaultSettings: ConversionSettings = {
  preserveAttributes: true,
  minifyOutput: false,
  outputFormat: 'pretty',
  fileFilters: ['.xml', '.yxmd'],
  autoSave: true,
  maxFileSize: 2048,
  performanceMode: 'balanced'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('xmlConverter_settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ConversionSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('xmlConverter_settings', JSON.stringify(updated));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('xmlConverter_settings');
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string) => {
    try {
      const imported = JSON.parse(settingsJson);
      updateSettings(imported);
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      exportSettings,
      importSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}