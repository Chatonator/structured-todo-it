import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ItemContext, CONTEXT_CONFIG } from '@/types/item';

interface ContextSelectorProps {
  value: ItemContext | '';
  onChange: (value: ItemContext) => void;
  hasError?: boolean;
  required?: boolean;
  label?: string;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  value,
  onChange,
  hasError = false,
  required = true,
  label = 'Contexte'
}) => {
  return (
    <div>
      <Label className="text-sm text-foreground mb-2 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(CONTEXT_CONFIG).map(([context, config]) => (
          <Button
            key={context}
            type="button"
            variant={value === context ? "default" : "outline"}
            onClick={() => onChange(context as ItemContext)}
            className={`
              flex items-center justify-center space-x-2 p-3 text-sm transition-all
              ${hasError ? 'border-destructive' : ''}
            `}
          >
            <span className="font-medium">{config.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
