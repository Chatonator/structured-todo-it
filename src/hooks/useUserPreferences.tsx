import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserPreferences, DEFAULT_PREFERENCES, CategoryColors, CATEGORY_PALETTE_VERSION } from '@/types/preferences';
import { normalizeTaskRulePreferences } from '@/types/taskRules';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  resetInterfacePreferences: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'todoIt_userPreferences';

function isHexCategoryColor(value: unknown): value is string {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

function resolveStoredCategoryColor(value: unknown, fallback: string): string {
  return isHexCategoryColor(value) ? value.trim() : fallback;
}

function normalizeCategoryColors(storedColors?: Partial<CategoryColors>): CategoryColors {
  const legacy = storedColors as Record<string, string> | undefined;

  return {
    ...DEFAULT_PREFERENCES.categoryColors,
    critical: resolveStoredCategoryColor(
      legacy?.critical ?? legacy?.Obligation,
      DEFAULT_PREFERENCES.categoryColors.critical
    ),
    urgent: resolveStoredCategoryColor(
      legacy?.urgent ?? legacy?.Quotidien,
      DEFAULT_PREFERENCES.categoryColors.urgent
    ),
    important: resolveStoredCategoryColor(
      legacy?.important ?? legacy?.Envie,
      DEFAULT_PREFERENCES.categoryColors.important
    ),
    low_priority: resolveStoredCategoryColor(
      legacy?.low_priority ?? legacy?.Autres,
      DEFAULT_PREFERENCES.categoryColors.low_priority
    ),
  };
}

function resolveCategoryColors(
  storedColors: Partial<CategoryColors> | undefined,
  paletteVersion: number | undefined
): CategoryColors {
  if (paletteVersion !== CATEGORY_PALETTE_VERSION) {
    return { ...DEFAULT_PREFERENCES.categoryColors };
  }

  return normalizeCategoryColors(storedColors);
}

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedPrefs = JSON.parse(stored);

        const storedCategoryIds = new Set(storedPrefs.categoryOrder?.map((cat: any) => cat.id) || []);
        const newCategories = DEFAULT_PREFERENCES.categoryOrder.filter(
          cat => !storedCategoryIds.has(cat.id)
        );

        const mergedCategoryOrder = [
          ...(storedPrefs.categoryOrder || []),
          ...newCategories,
        ];

        const categoryColors = resolveCategoryColors(
          storedPrefs.categoryColors,
          storedPrefs.categoryPaletteVersion
        );

        return {
          ...DEFAULT_PREFERENCES,
          ...storedPrefs,
          categoryOrder: mergedCategoryOrder,
          categoryColors,
          categoryPaletteVersion: CATEGORY_PALETTE_VERSION,
          taskRules: normalizeTaskRulePreferences(storedPrefs.taskRules),
        };
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
    const nextCategoryColors = updates.categoryColors
      ? normalizeCategoryColors(updates.categoryColors)
      : undefined;

    setPreferences(prev => ({
      ...prev,
      ...updates,
      categoryColors: nextCategoryColors ?? prev.categoryColors,
      taskRules: updates.taskRules ? normalizeTaskRulePreferences(updates.taskRules) : prev.taskRules,
    }));
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
      categoryOrder: DEFAULT_PREFERENCES.categoryOrder.map(cat => ({ ...cat })),
      categoryColors: { ...DEFAULT_PREFERENCES.categoryColors },
      categoryPaletteVersion: CATEGORY_PALETTE_VERSION,
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
