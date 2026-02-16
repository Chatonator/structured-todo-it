import React from 'react';
import { Label } from '@/components/ui/label';
import { ItemCategory, eisenhowerFromCategory, categoryFromEisenhower, getCategoryDisplayName } from '@/types/item';
import { getCategoryClasses } from '@/lib/styling';
import { cn } from '@/lib/utils';

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
  const resultCategory = (value || 'Autres') as ItemCategory;

  const handleToggle = (flag: 'isImportant' | 'isUrgent') => {
    const newFlags = { ...flags, [flag]: !flags[flag] };
    onChange(categoryFromEisenhower(newFlags));
  };

  return (
    <div>
      <Label className="text-sm text-foreground mb-2 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className={cn(
        'rounded-lg border bg-card transition-colors',
        hasError ? 'border-destructive' : 'border-border'
      )}>
        <div className="flex">
          <ToggleButton
            label="Important"
            emoji="⭐"
            checked={flags.isImportant}
            onToggle={() => handleToggle('isImportant')}
            activeClass="bg-category-envie/15 text-category-envie border-category-envie/30"
          />
          <div className="w-px bg-border" />
          <ToggleButton
            label="Urgent"
            emoji="⚡"
            checked={flags.isUrgent}
            onToggle={() => handleToggle('isUrgent')}
            activeClass="bg-category-quotidien/15 text-category-quotidien border-category-quotidien/30"
          />
        </div>
        <div className={cn(
          'px-3 py-1.5 border-t text-xs font-medium flex items-center gap-1.5 transition-colors',
          getCategoryClasses(resultCategory, 'badge'),
          'rounded-b-lg'
        )}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'currentColor' }} />
          {getCategoryDisplayName(resultCategory)}
        </div>
      </div>
    </div>
  );
};

interface ToggleButtonProps {
  label: string;
  emoji: string;
  checked: boolean;
  onToggle: () => void;
  activeClass: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ label, emoji, checked, onToggle, activeClass }) => (
  <button
    type="button"
    onClick={onToggle}
    className={cn(
      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer select-none',
      'first:rounded-tl-lg last:rounded-tr-lg',
      checked
        ? activeClass
        : 'text-muted-foreground hover:bg-accent/50'
    )}
  >
    <span className={cn('transition-transform duration-200', checked && 'scale-110')}>{emoji}</span>
    <span>{label}</span>
  </button>
);
