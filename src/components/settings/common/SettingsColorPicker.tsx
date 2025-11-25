import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SettingsColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const SettingsColorPicker: React.FC<SettingsColorPickerProps> = ({
  id,
  label,
  value,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border border-border"
          style={{ backgroundColor: value }}
        />
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 h-8 cursor-pointer"
        />
      </div>
    </div>
  );
};
