import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { RecurrenceInterval, RECURRENCE_OPTIONS } from '@/types/task';

interface RecurrenceSectionProps {
  isRecurring: boolean;
  recurrenceInterval?: RecurrenceInterval;
  onRecurringChange: (isRecurring: boolean) => void;
  onIntervalChange: (interval: RecurrenceInterval) => void;
  index: number;
}

export const RecurrenceSection: React.FC<RecurrenceSectionProps> = ({
  isRecurring,
  recurrenceInterval,
  onRecurringChange,
  onIntervalChange,
  index
}) => {
  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <Label className="text-sm text-foreground">Récurrence (optionnelle)</Label>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`recurring-${index}`}
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
          />
          <label htmlFor={`recurring-${index}`} className="text-sm text-foreground flex items-center">
            <RefreshCw className="w-4 h-4 mr-1" />
            Tâche récurrente
          </label>
        </div>
        
        {isRecurring && (
          <Select
            value={recurrenceInterval || ''}
            onValueChange={(value) => onIntervalChange(value as RecurrenceInterval)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Fréquence de récurrence..." />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
