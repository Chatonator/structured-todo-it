import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TaskCategory, CATEGORY_CONFIG, getCategoryDisplayName } from '@/types/task';

interface CategorySelectorProps {
  value: TaskCategory | '';
  onChange: (value: TaskCategory) => void;
  hasError?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  hasError = false
}) => {
  return (
    <div>
      <Label className="text-sm text-foreground mb-2 block">
        Catégorie
      </Label>
      <div className="grid grid-cols-2 gap-1">
        {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
          <Button
            key={cat}
            type="button"
            variant={value === cat ? "default" : "outline"}
            onClick={() => onChange(cat as TaskCategory)}
            className={`flex items-center space-x-1 p-2 text-xs transition-all bg-category-${config.cssName}/10 border-category-${config.cssName}/20 hover:bg-category-${config.cssName}/20`}
          >
            <div className={`w-2 h-2 rounded-full bg-category-${config.cssName}`} />
            <span className="font-medium truncate">{getCategoryDisplayName(cat as TaskCategory)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
