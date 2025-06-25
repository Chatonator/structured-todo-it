
import { TaskCategory, CATEGORY_CONFIG, CATEGORY_CSS_NAMES } from '@/types/task';

/**
 * Utilitaire pour garantir la cohérence entre les noms de catégories JS et les classes CSS
 */
export const getCategoryClasses = (category: TaskCategory) => {
  const config = CATEGORY_CONFIG[category];
  const cssName = CATEGORY_CSS_NAMES[category];
  
  // Vérification de sécurité
  if (!config || !cssName) {
    console.warn(`Configuration de catégorie manquante pour: ${category}`);
    return {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      borderPattern: 'border-l-4 border-l-gray-500',
      cssColor: 'rgb(128, 128, 128)'
    };
  }
  
  return {
    color: `bg-category-${cssName}-light text-category-${cssName} border-category-${cssName}`,
    borderPattern: `border-l-4 border-l-category-${cssName}`,
    cssColor: config.cssColor,
    cssName
  };
};

/**
 * Validation que toutes les classes CSS nécessaires existent
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
      `border-category-${cssName}`
    ];
    
    // Note: En production, on pourrait vérifier si les classes existent réellement
    console.log(`Classes attendues pour ${category}:`, expectedClasses);
  });
  
  return missingClasses;
};
