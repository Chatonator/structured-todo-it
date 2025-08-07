
import { useState, useEffect } from 'react';

export type Theme = 'light';

export const useTheme = () => {
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    localStorage.setItem('todo-it-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const changeTheme = (newTheme: Theme) => {
    // Ne fait rien car on n'a qu'un seul thème
  };

  return {
    theme,
    changeTheme
  };
};
