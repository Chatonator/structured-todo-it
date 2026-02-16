import React from 'react';
import { ItemCategory } from '@/types/item';
import { EisenhowerSelector } from './EisenhowerSelector';

interface CategorySelectorProps {
  value: ItemCategory | '';
  onChange: (value: ItemCategory) => void;
  hasError?: boolean;
  required?: boolean;
  label?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = (props) => {
  return <EisenhowerSelector {...props} />;
};
