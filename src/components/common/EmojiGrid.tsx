import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EmojiGridProps {
  value: string;
  onChange: (emoji: string) => void;
  options: string[];
  label?: string;
}

export const EmojiGrid: React.FC<EmojiGridProps> = ({ value, onChange, options, label = 'Icône' }) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(emoji => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              'w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all duration-150 border',
              value === emoji
                ? 'border-primary bg-primary/10 scale-110 shadow-sm'
                : 'border-transparent hover:bg-accent/50'
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
