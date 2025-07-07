
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
  // Protection contre les catégories inconnues
  const getCategoryConfig = () => {
    try {
      const config = CATEGORY_CONFIG[event.task.category];
      if (!config) {
        console.warn('Catégorie inconnue:', event.task.category, event.task);
        return { cssName: 'default', borderPattern: 'border-l-4 border-l-gray-400' };
      }
      return config;
    } catch (error) {
      console.warn('Erreur configuration catégorie:', error, event.task);
      return { cssName: 'default', borderPattern: 'border-l-4 border-l-gray-400' };
    }
  };

  const categoryConfig = getCategoryConfig();
  
  const resolvedCategoryColor = React.useMemo(() => {
    try {
      return cssVarRGB(`--color-${categoryConfig.cssName}`);
    } catch (error) {
      console.warn('Erreur couleur catégorie:', error);
      return 'rgb(107, 114, 128)'; // gray-500 par défaut
    }
  }, [categoryConfig.cssName]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  const inlineStyles = React.useMemo(() => ({
    backgroundColor: `${resolvedCategoryColor}26`, // 15% d'opacité
    borderLeftColor: resolvedCategoryColor,
    minHeight: '24px',
    ...style
  }), [resolvedCategoryColor, style]);

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
