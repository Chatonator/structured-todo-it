
import React from 'react';
import { CalendarEvent, CATEGORY_CONFIG } from '@/types/task';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cssVarRGB } from '@/utils/colors';

interface CalendarEventProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  onClick?: (event: CalendarEvent) => void;
}

export const CalendarEventComponent: React.FC<CalendarEventProps> = ({
  event,
  style,
  onClick
}) => {
  const categoryConfig = CATEGORY_CONFIG[event.task.category];
  
  // Remplacé useMemo par une constante simple
  const resolvedCategoryColor = cssVarRGB(`--color-${categoryConfig.cssName}`);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  // Remplacé useMemo par une constante simple - styles inline avec couleurs résolues
  const inlineStyles = {
    backgroundColor: `${resolvedCategoryColor}26`, // 15% d'opacité
    borderLeftColor: resolvedCategoryColor,
    ...style
  };

  return (
    <div
      className={`
        p-2 rounded-md border-l-4 cursor-pointer
        hover:shadow-md transition-shadow
        bg-theme-background text-theme-foreground
        ${categoryConfig.borderPattern}
      `}
      style={inlineStyles}
      onClick={() => onClick?.(event)}
    >
      <div className="font-medium text-sm line-clamp-2 mb-1">
        {event.task.name}
      </div>
      <div className="flex items-center gap-2 text-xs text-theme-muted">
        <Clock className="w-3 h-3" />
        <span>{format(event.startTime, 'HH:mm')}</span>
        <span>•</span>
        <span>{formatDuration(event.duration)}</span>
      </div>
    </div>
  );
};
