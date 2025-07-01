
/**
 * Utilitaire pour convertir les variables CSS en couleurs RGB résolues
 * Résout le problème des styles inline avec var(...) non évalués par les navigateurs
 */

/**
 * Convertit une variable CSS en couleur RGB résolue
 * @param varName - Nom de la variable CSS (ex: '--color-obligation')
 * @returns Couleur au format 'rgb(r, g, b)'
 */
export const cssVarRGB = (varName: string): string => {
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    
    if (!value) {
      console.warn(`Variable CSS ${varName} non trouvée`);
      return 'rgb(0, 0, 0)'; // Fallback noir
    }
    
    return `rgb(${value})`;
  } catch (error) {
    console.error(`Erreur lors de la résolution de ${varName}:`, error);
    return 'rgb(0, 0, 0)'; // Fallback noir
  }
};

/**
 * Hook pour obtenir les couleurs résolues avec mise à jour lors des changements de thème
 */
export const useResolvedColors = () => {
  const [colors, setColors] = React.useState<Record<string, string>>({});
  
  React.useEffect(() => {
    const updateColors = () => {
      const newColors: Record<string, string> = {};
      
      // Couleurs de catégories
      ['obligation', 'quotidien', 'envie', 'autres'].forEach(cat => {
        newColors[`category-${cat}`] = cssVarRGB(`--color-${cat}`);
      });
      
      // Couleurs de thème
      ['primary', 'secondary', 'accent', 'muted'].forEach(theme => {
        newColors[`theme-${theme}`] = cssVarRGB(`--theme-${theme}`);
      });
      
      setColors(newColors);
    };
    
    updateColors();
    
    // Observer les changements de thème
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
    
    return () => observer.disconnect();
  }, []);
  
  return colors;
};

// Export React pour le hook
import React from 'react';
