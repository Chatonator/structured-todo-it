import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ItemCategory, eisenhowerFromCategory, categoryFromEisenhower, getCategoryDisplayName } from '@/types/item';
import { CategoryBadge } from '@/components/primitives/badges/CategoryBadge';

interface EisenhowerSelectorProps {
  value: ItemCategory | '';
  onChange: (value: ItemCategory) => void;
  hasError?: boolean;
  required?: boolean;
  label?: string;
}

export const EisenhowerSelector: React.FC<EisenhowerSelectorProps> = ({
  value,
  onChange,
  hasError = false,
  required = true,
  label = 'Catégorie'
}) => {
  const flags = eisenhowerFromCategory((value || 'Autres') as ItemCategory);

  const handleToggle = (flag: 'isImportant' | 'isUrgent') => {
    const newFlags = {
      ...flags,
      [flag]: !flags[flag]
    };
    onChange(categoryFromEisenhower(newFlags));
  };

  const resultCategory = (value || 'Autres') as ItemCategory;

  return (
    <div>
      <Label className="text-sm text-foreground mb-2 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className={`space-y-3 p-3 rounded-lg border ${hasError ? 'border-destructive' : 'border-border'} bg-card`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Important</span>
          <Switch
            checked={flags.isImportant}
            onCheckedChange={() => handleToggle('isImportant')}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Urgent</span>
          <Switch
            checked={flags.isUrgent}
            onCheckedChange={() => handleToggle('isUrgent')}
          />
        </div>
        <div className="pt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">→</span>
          <CategoryBadge category={resultCategory} size="sm" />
        </div>
      </div>
    </div>
  );
};
