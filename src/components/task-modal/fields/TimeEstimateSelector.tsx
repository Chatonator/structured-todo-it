import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIME_OPTIONS } from '@/types/task';

interface TimeEstimateSelectorProps {
  value: number | '';
  onChange: (value: number) => void;
  hasError?: boolean;
}

export const TimeEstimateSelector: React.FC<TimeEstimateSelectorProps> = ({
  value,
  onChange,
  hasError = false
}) => {
  return (
    <div>
      <Select 
        value={value.toString()} 
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger className={`h-9 text-sm ${hasError ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Temps estimé..." />
        </SelectTrigger>
        <SelectContent>
          {TIME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
