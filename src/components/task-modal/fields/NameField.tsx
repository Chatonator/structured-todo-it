import React from 'react';
import { Input } from '@/components/ui/input';

interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

export const NameField: React.FC<NameFieldProps> = ({
  value,
  onChange,
  hasError = false,
  placeholder = 'Nom de la tâche...'
}) => {
  return (
    <div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`text-sm ${hasError ? 'border-destructive' : ''}`}
      />
    </div>
  );
};
