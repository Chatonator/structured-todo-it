
import React from 'react';

interface HourLabelProps {
  hour: number;
}

export const HourLabel: React.FC<HourLabelProps> = ({ hour }) => {
  return (
    <div className="h-20 flex items-start justify-end pr-4 pt-2 text-sm font-medium text-theme-muted border-b border-theme-border bg-gradient-to-r from-theme-background to-theme-accent/10">
      <span className="bg-theme-background px-2 py-1 rounded-md shadow-sm">
        {hour}:00
      </span>
    </div>
  );
};
