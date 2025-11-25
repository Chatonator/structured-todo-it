import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const THEME_STORAGE_KEY = 'todoIt_theme';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return (stored as Theme) || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const actualTheme = theme === 'system' ? getSystemTheme() : theme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      const systemTheme = getSystemTheme();
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return {
    theme,
    setTheme,
    actualTheme: theme === 'system' ? getSystemTheme() : theme,
  };
};
