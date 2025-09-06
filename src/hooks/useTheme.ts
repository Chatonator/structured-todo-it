
import { useState } from 'react';

export type Theme = 'light';

export const useTheme = () => {
  const [theme] = useState<Theme>('light');

  return {
    theme
  };
};
