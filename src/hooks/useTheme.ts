
import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'colorblind' | 'high-contrast';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('todo-it-theme') as Theme;
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('todo-it-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Code de débogage pour diagnostiquer les problèmes de thème
  useEffect(() => {
    console.log('theme-debug',
      document.documentElement.getAttribute('data-theme'),
      getComputedStyle(document.documentElement).getPropertyValue('--color-background'));
  }, [theme]);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    changeTheme
  };
};
