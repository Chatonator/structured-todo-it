
/**
 * Design System - Couleurs centralisées
 * Toutes les couleurs de l'application avec support thématique
 */

// Couleurs de base (HSL pour compatibilité CSS)
export const BASE_COLORS = {
  // Couleurs neutres
  white: '0 0% 100%',
  black: '0 0% 0%',
  transparent: 'transparent',
  
  // Palette de gris
  gray: {
    50: '210 40% 98%',
    100: '210 40% 96%',
    200: '214 32% 91%',
    300: '213 27% 84%',
    400: '215 20% 65%',
    500: '215 16% 47%',
    600: '215 19% 35%',
    700: '215 25% 27%',
    800: '217 33% 17%',
    900: '222 84% 5%',
  },
} as const;

// Couleurs sémantiques
export const SEMANTIC_COLORS = {
  primary: {
    50: '238 100% 97%',
    100: '237 100% 93%',
    200: '237 96% 85%',
    300: '239 84% 67%',
    400: '241 77% 63%',
    500: '243 75% 59%',
    600: '245 73% 52%',
    700: '247 72% 50%',
    800: '248 70% 40%',
    900: '249 69% 32%',
  },
  
  success: {
    50: '138 76% 97%',
    100: '141 84% 93%',
    200: '141 79% 85%',
    300: '142 77% 73%',
    400: '142 69% 58%',
    500: '142 71% 45%',
    600: '142 76% 36%',
    700: '142 72% 29%',
    800: '143 64% 24%',
    900: '144 61% 20%',
  },
  
  warning: {
    50: '54 92% 95%',
    100: '55 97% 88%',
    200: '53 98% 77%',
    300: '50 98% 64%',
    400: '48 96% 53%',
    500: '45 93% 47%',
    600: '41 96% 40%',
    700: '35 91% 33%',
    800: '32 81% 29%',
    900: '28 73% 26%',
  },
  
  error: {
    50: '0 86% 97%',
    100: '0 93% 94%',
    200: '0 96% 89%',
    300: '0 94% 82%',
    400: '0 91% 71%',
    500: '0 84% 60%',
    600: '0 72% 51%',
    700: '0 74% 42%',
    800: '0 70% 35%',
    900: '0 63% 31%',
  },
} as const;

// Couleurs des catégories (depuis le système existant mais centralisées)
export const CATEGORY_COLORS = {
  obligation: {
    light: '0 84% 60%',
    dark: '0 72% 51%',
    bg: '0 86% 97%',
  },
  quotidien: {
    light: '45 93% 47%',
    dark: '41 96% 40%',
    bg: '54 92% 95%',
  },
  envie: {
    light: '142 71% 45%',
    dark: '142 76% 36%',
    bg: '138 76% 97%',
  },
  autres: {
    light: '243 75% 59%',
    dark: '245 73% 52%',
    bg: '238 100% 97%',
  },
} as const;

// Helper pour récupérer une couleur CSS custom property
export const getCSSColorVar = (colorPath: string): string => {
  return `hsl(var(--color-${colorPath}))`;
};

// Types pour la sécurité TypeScript
export type BaseColorKey = keyof typeof BASE_COLORS;
export type SemanticColorKey = keyof typeof SEMANTIC_COLORS;
export type CategoryColorKey = keyof typeof CATEGORY_COLORS;
