import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SubTaskCategory, SUB_CATEGORY_CONFIG } from '@/types/task';

interface PrioritySelectorProps {
  value: SubTaskCategory | '';
  onChange: (value: SubTaskCategory) => void;
  hasError?: boolean;
  label?: string;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  hasError = false,
  label = 'Priorité'
}) => {
  return (
    <div>
      <Label className={`text-sm mb-2 block ${hasError ? 'text-destructive' : 'text-foreground'}`}>
        {label} {hasError && <span className="text-destructive">*</span>}
      </Label>
      <div className="grid grid-cols-2 gap-1">
        {Object.entries(SUB_CATEGORY_CONFIG).map(([subCat, config]) => (
          <Button
            key={subCat}
            type="button"
            variant={value === subCat ? "default" : "outline"}
            onClick={() => onChange(subCat as SubTaskCategory)}
            className="flex items-center space-x-1 p-2 text-xs transition-all"
          >
            <span className="font-medium truncate">{subCat}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
