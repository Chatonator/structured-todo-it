
/**
 * Utilitaire pour convertir les variables CSS en couleurs RGB résolues
 * Résout le problème des styles inline avec var(...) non évalués par les navigateurs
 */

/**
 * Mapping des couleurs hardcodées comme fallback si les variables CSS échouent
 */
const COLOR_FALLBACKS: Record<string, string> = {
  '--color-obligation': '219, 39, 119',
  '--color-quotidien': '22, 163, 74', 
  '--color-envie': '56, 189, 248',
  '--color-autres': '107, 114, 128',
  '--color-context-pro': '59, 130, 246',
  '--color-context-perso': '34, 197, 94',
  '--color-priority-highest': '147, 51, 234',
  '--color-priority-high': '59, 130, 246',
  '--color-priority-medium': '234, 179, 8',
  '--color-priority-low': '107, 114, 128',
  '--color-success': '34, 197, 94',
  '--color-warning': '234, 179, 8',
  '--color-error': '239, 68, 68',
  '--color-info': '59, 130, 246'
};

/**
 * Convertit une variable CSS en couleur RGB résolue avec fallback robuste
 * @param varName - Nom de la variable CSS (ex: '--color-obligation')
 * @returns Couleur au format 'rgb(r, g, b)'
 */
export const cssVarRGB = (varName: string): string => {
  try {
    // Vérifier si nous sommes dans le navigateur
    if (typeof window === 'undefined' || !document?.documentElement) {
      return `rgb(${COLOR_FALLBACKS[varName] || '0, 0, 0'})`;
    }

    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    
    if (value && value !== '') {
      return `rgb(${value})`;
    }
    
    // Fallback vers les couleurs hardcodées
    const fallback = COLOR_FALLBACKS[varName];
    if (fallback) {
      console.warn(`Variable CSS ${varName} non trouvée, utilisation du fallback`);
      return `rgb(${fallback})`;
    }
    
    console.warn(`Variable CSS ${varName} et fallback non trouvés`);
    return 'rgb(0, 0, 0)';
    
  } catch (error) {
    console.error(`Erreur lors de la résolution de ${varName}:`, error);
    const fallback = COLOR_FALLBACKS[varName];
    return fallback ? `rgb(${fallback})` : 'rgb(0, 0, 0)';
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
