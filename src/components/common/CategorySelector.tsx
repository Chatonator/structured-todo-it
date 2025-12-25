import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ItemCategory, CATEGORY_CONFIG } from '@/types/item';
import { CATEGORY_DISPLAY_NAMES } from '@/types/task';

interface CategorySelectorProps {
  value: ItemCategory | '';
  onChange: (value: ItemCategory) => void;
  hasError?: boolean;
  required?: boolean;
  label?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  hasError = false,
  required = true,
  label = 'Catégorie'
}) => {
  return (
    <div>
      <Label className="text-sm text-foreground mb-2 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
          <Button
            key={cat}
            type="button"
            variant={value === cat ? "default" : "outline"}
            onClick={() => onChange(cat as ItemCategory)}
            className={`
              flex items-center justify-center space-x-2 p-3 text-sm transition-all
              ${hasError ? 'border-destructive' : ''}
            `}
          >
            <div className={`w-2 h-2 rounded-full bg-category-${config.cssName}`} />
            <span className="font-medium">{CATEGORY_DISPLAY_NAMES[cat as ItemCategory]}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
