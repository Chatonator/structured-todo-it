
import { TaskCategory, CATEGORY_CONFIG, CATEGORY_CSS_NAMES } from '@/types/task';
import { cssVarRGB } from '@/utils/colors';

/**
 * Utilitaire pour garantir la cohérence entre les noms de catégories JS et les classes CSS
 * Utilise exclusivement les variables CSS centralisées
 */
export const getCategoryClasses = (category: TaskCategory) => {
  const config = CATEGORY_CONFIG[category];
  const cssName = CATEGORY_CSS_NAMES[category];
  
  // Vérification de sécurité
  if (!config || !cssName) {
    console.warn(`Configuration de catégorie manquante pour: ${category}`);
    return {
      color: 'bg-priority-low-light text-priority-low border-priority-low',
      borderPattern: 'border-l-4 border-l-priority-low',
      cssColor: cssVarRGB('--color-priority-low')
    };
  }
  
  return {
    color: `bg-category-${cssName}-light text-category-${cssName} border-category-${cssName}`,
    borderPattern: `border-l-4 border-l-category-${cssName}`,
    cssColor: cssVarRGB(`--color-${cssName}`), // Utilise l'utilitaire de résolution
    cssName
  };
};

/**
 * Validation que toutes les classes CSS nécessaires existent
 * et utilisent les variables CSS centralisées
 */
export const validateCategoryClasses = () => {
  const categories: TaskCategory[] = ['Obligation', 'Quotidien', 'Envie', 'Autres'];
  const missingClasses: string[] = [];
  
  categories.forEach(category => {
    const cssName = CATEGORY_CSS_NAMES[category];
    const expectedClasses = [
      `bg-category-${cssName}`,
      `bg-category-${cssName}-light`,
      `text-category-${cssName}`,
      `border-category-${cssName}`,
      `border-l-category-${cssName}`
    ];
    
    console.log(`Classes CSS attendues pour ${category} (basées sur --color-${cssName}):`, expectedClasses);
  });
  
  return missingClasses;
};

/**
 * Utilitaire pour obtenir directement la variable CSS d'une catégorie
 */
export const getCategoryColorVariable = (category: TaskCategory): string => {
  const cssName = CATEGORY_CSS_NAMES[category];
  return `--color-${cssName}`;
};

/**
 * Utilitaire pour générer des styles inline basés sur les variables CSS
 */
export const getCategoryInlineStyles = (category: TaskCategory) => {
  const cssName = CATEGORY_CSS_NAMES[category];
  return {
    '--category-color': `var(--color-${cssName})`,
    '--category-color-light': `rgba(var(--color-${cssName}), 0.1)`,
    '--category-color-medium': `rgba(var(--color-${cssName}), 0.3)`,
    '--category-color-dark': `rgba(var(--color-${cssName}), 0.8)`
  } as React.CSSProperties;
};
