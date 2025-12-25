import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TIME_OPTIONS } from '@/types/item';

interface TimeEstimateSelectorProps {
  value: number | '';
  onChange: (value: number) => void;
  hasError?: boolean;
  required?: boolean;
  label?: string;
}

export const TimeEstimateSelector: React.FC<TimeEstimateSelectorProps> = ({
  value,
  onChange,
  hasError = false,
  required = true,
  label = 'Temps estimé'
}) => {
  return (
    <div>
      <Label className="text-sm text-foreground mb-2 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select 
        value={value.toString()} 
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger className={`h-10 text-sm ${hasError ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Sélectionner une durée..." />
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
