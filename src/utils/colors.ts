import React from 'react';


/**
 * Utilitaire pour convertir les variables CSS en couleurs RGB résolues
 * Résout le problème des styles inline avec var(...) non évalués par les navigateurs
 */


/**
 * Convertit une variable CSS en couleur RGB résolue avec fallback robuste
 * @param varName - Nom de la variable CSS (ex: '--color-obligation')
 * @returns Couleur au format 'rgb(r, g, b)'
 */
export const cssVarRGB = (varName: string): string => {
  try {
    // Vérifier si nous sommes dans le navigateur
    if (typeof window === 'undefined' || !document?.documentElement) {
      return 'rgb(0 0 0)';
    }

    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();

    if (value && value !== '') {
      return `rgb(${value})`;
    }

    console.warn(`Variable CSS ${varName} non trouvée`);
    return 'rgb(0 0 0)';

  } catch (error) {
    console.error(`Erreur lors de la résolution de ${varName}:`, error);
    return 'rgb(0 0 0)';
  }
};

/**
 * Hook pour obtenir les couleurs résolues (simplifié car un seul thème)
 */
export const useResolvedColors = () => {
  const [colors, setColors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const newColors: Record<string, string> = {};

    // Couleurs de catégories
    ['obligation', 'quotidien', 'envie', 'autres'].forEach(cat => {
      newColors[`category-${cat}`] = cssVarRGB(`--color-${cat}`);
    });

    // Couleurs de thème
    ['primary', 'secondary', 'accent', 'muted'].forEach(theme => {
      newColors[`theme-${theme}`] = cssVarRGB(`--color-${theme}`);
    });

    setColors(newColors);
  }, []);

  return colors;
};
