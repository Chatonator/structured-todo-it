import React, { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { getAppearanceDataset, getCategoryCssVariables } from '@/lib/appearance/colorUtils';

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { actualTheme } = useTheme();
  const { preferences } = useUserPreferences();

  useEffect(() => {
    const root = document.documentElement;
    const dataset = getAppearanceDataset(actualTheme, {
      textSize: preferences.textSize,
      highContrast: preferences.highContrast,
      reducedAnimations: preferences.reducedAnimations,
    });

    root.setAttribute('data-theme', dataset.theme);
    root.setAttribute('data-text-size', dataset.textSize);
    root.setAttribute('data-contrast', dataset.contrast);
    root.setAttribute('data-motion', dataset.motion);

    const computed = getComputedStyle(root);
    const categoryVars = getCategoryCssVariables(
      preferences.categoryColors,
      dataset.theme === 'dark',
      (variableName) => computed.getPropertyValue(`--${variableName}`).trim() || null
    );

    Object.entries(categoryVars).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });
  }, [
    actualTheme,
    preferences.categoryColors,
    preferences.highContrast,
    preferences.reducedAnimations,
    preferences.textSize,
  ]);

  return <>{children}</>;
};

export default AppearanceProvider;
