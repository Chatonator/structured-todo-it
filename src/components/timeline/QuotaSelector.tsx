import React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock } from 'lucide-react';

interface QuotaSelectorProps {
  value: number; // in minutes
  onChange: (minutes: number) => void;
  className?: string;
}

// Available quota options in minutes
const QUOTA_OPTIONS = [
  { value: 0, label: '0h' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
  { value: 300, label: '5h' },
  { value: 360, label: '6h' },
  { value: 480, label: '8h' },
  { value: 600, label: '10h' },
];

export const QuotaSelector: React.FC<QuotaSelectorProps> = ({
  value,
  onChange,
  className
}) => {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger className={cn("w-20 h-7 text-xs", className)}>
        <Clock className="w-3 h-3 mr-1" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {QUOTA_OPTIONS.map(option => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default QuotaSelector;
