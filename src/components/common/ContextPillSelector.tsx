import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ContextPillSelectorProps {
  value: string;
  onChange: (value: 'Pro' | 'Perso') => void;
}

export const ContextPillSelector: React.FC<ContextPillSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Contexte</Label>
      <div className="flex gap-2">
        {(['Pro', 'Perso'] as const).map((ctx) => {
          const isSelected = value === ctx;
          const isPro = ctx === 'Pro';
          return (
            <button
              key={ctx}
              type="button"
              onClick={() => onChange(ctx)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                isSelected
                  ? isPro
                    ? 'bg-context-pro/15 border-context-pro text-context-pro shadow-sm'
                    : 'bg-context-perso/15 border-context-perso text-context-perso shadow-sm'
                  : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <span>{isPro ? '💼' : '🏠'}</span>
              <span>{ctx}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
