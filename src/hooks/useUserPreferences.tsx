import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserPreferences, DEFAULT_PREFERENCES } from '@/types/preferences';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  resetInterfacePreferences: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'todoIt_userPreferences';

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const resetInterfacePreferences = () => {
    setPreferences(prev => ({
      ...prev,
      showHabits: DEFAULT_PREFERENCES.showHabits,
      showGamification: DEFAULT_PREFERENCES.showGamification,
      showTeams: DEFAULT_PREFERENCES.showTeams,
      categoryOrder: DEFAULT_PREFERENCES.categoryOrder,
      categoryColors: DEFAULT_PREFERENCES.categoryColors,
    }));
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences, resetInterfacePreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
};
