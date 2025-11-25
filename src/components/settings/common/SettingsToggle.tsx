import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SettingsToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5 flex-1">
        <Label htmlFor={id} className="text-base cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};
