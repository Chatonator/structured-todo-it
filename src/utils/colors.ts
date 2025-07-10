import React from 'react';
import { colorTokens } from "@/theme/colors.config";

/**
 * Utilitaire pour convertir les variables CSS en couleurs RGB résolues
 * Résout le problème des styles inline avec var(...) non évalués par les navigateurs
 */

// On mappe chaque variable CSS vers le token centralisé
const COLOR_FALLBACKS: Record<string, string> = {
  '--color-background': colorTokens.background,
  '--color-foreground': colorTokens.foreground,
  '--color-muted': colorTokens.muted,
  '--color-accent': colorTokens.accent,
  '--color-border': colorTokens.border,
  '--color-card': colorTokens.card,
  '--color-input': colorTokens.input,
  '--color-primary': colorTokens.primary,
  '--color-secondary': colorTokens.secondary,
  '--color-sidebar': colorTokens.sidebar,
  '--color-obligation': colorTokens.obligation,
  '--color-quotidien': colorTokens.quotidien,
  '--color-envie': colorTokens.envie,
  '--color-autres': colorTokens.autres,
  '--color-context-pro': colorTokens.contextPro,
  '--color-context-perso': colorTokens.contextPerso,
  '--color-priority-highest': colorTokens.priorityHighest,
  '--color-priority-high': colorTokens.priorityHigh,
  '--color-priority-medium': colorTokens.priorityMedium,
  '--color-priority-low': colorTokens.priorityLow,
  '--color-success': colorTokens.success,
  '--color-warning': colorTokens.warning,
  '--color-error': colorTokens.error,
  '--color-info': colorTokens.info,
  '--color-drop-zone': colorTokens.dropZone,
  '--color-drag-active': colorTokens.dragActive,
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
      return `rgb(${COLOR_FALLBACKS[varName] || '0 0 0'})`;
    }

    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();

    if (value && value !== '') {
      return `rgb(${value})`;
    }

    // Fallback vers les couleurs centralisées
    const fallback = COLOR_FALLBACKS[varName];
    if (fallback) {
      console.warn(`Variable CSS ${varName} non trouvée, utilisation du fallback`);
      return `rgb(${fallback})`;
    }

    console.warn(`Variable CSS ${varName} et fallback non trouvés`);
    return 'rgb(0 0 0)';

  } catch (error) {
    console.error(`Erreur lors de la résolution de ${varName}:`, error);
    const fallback = COLOR_FALLBACKS[varName];
    return fallback ? `rgb(${fallback})` : 'rgb(0 0 0)';
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
        newColors[`theme-${theme}`] = cssVarRGB(`--color-${theme}`);
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
