import React, { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { getAppearanceDataset, getCategoryCssVariables } from '@/lib/appearance/colorUtils';

const isSidebarColorDebugEnabled = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('debugSidebarColors');
};

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

    if (isSidebarColorDebugEnabled()) {
      console.groupCollapsed('[sidebar-colors][appearance]');
      console.table({
        theme: dataset.theme,
        textSize: dataset.textSize,
        contrast: dataset.contrast,
        motion: dataset.motion,
        categoryCritical: root.style.getPropertyValue('--category-critical').trim() || computed.getPropertyValue('--category-critical').trim(),
        categoryUrgent: root.style.getPropertyValue('--category-urgent').trim() || computed.getPropertyValue('--category-urgent').trim(),
        categoryImportant: root.style.getPropertyValue('--category-important').trim() || computed.getPropertyValue('--category-important').trim(),
        categoryLowPriority: root.style.getPropertyValue('--category-low-priority').trim() || computed.getPropertyValue('--category-low-priority').trim(),
      });
      console.log('[sidebar-colors][preferences.categoryColors]', preferences.categoryColors);
      console.log('[sidebar-colors][appliedVariables]', categoryVars);
      console.groupEnd();
    }
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
