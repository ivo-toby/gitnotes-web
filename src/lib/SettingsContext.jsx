import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'gitnotes_settings';

const defaultSettings = {
  owner: '',
  repo: '',
  branch: 'main',
  path: ''
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setLoading(false);
  }, []);

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    loading,
    isConfigured: !!(settings.owner && settings.repo)
  };

  return (
    <SettingsContext.Provider value={value}>
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
