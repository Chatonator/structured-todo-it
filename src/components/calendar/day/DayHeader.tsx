
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayHeaderProps {
  currentDate: Date;
  eventsCount: number;
}

export const DayHeader: React.FC<DayHeaderProps> = ({ currentDate, eventsCount }) => {
  return (
    <div className="p-4 border-b border-border bg-card">
      <h2 className="text-xl font-semibold text-foreground">
        {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        {eventsCount} événement{eventsCount !== 1 ? 's' : ''} planifié{eventsCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
};
