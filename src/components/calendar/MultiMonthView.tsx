import React from 'react';
import { addMonths, startOfMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarEvent } from '@/types/task';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface MultiMonthViewProps {
  currentDate: Date;
  months: number; // 1, 3, 6
  events: CalendarEvent[];
  onDayClick?: (date: Date) => void;
}

export const MultiMonthView: React.FC<MultiMonthViewProps> = ({ currentDate, months, events, onDayClick }) => {
  const startMonth = startOfMonth(currentDate);

  // Jours ayant des événements (pour habiller le calendrier)
  const eventDates = React.useMemo(() => events.map(e => new Date(e.startTime)), [events]);

  return (
    <div className="h-full overflow-auto p-4">
      <div className={cn('rounded-lg border border-theme-border bg-theme-background p-2')}>
        <Calendar
          mode="single"
          month={startMonth}
          numberOfMonths={months}
          onDayClick={(date) => onDayClick?.(date)}
          showOutsideDays
          locale={fr}
          modifiers={{
            hasEvent: (date) => eventDates.some(d => isSameDay(d, date))
          }}
          modifiersClassNames={{
            hasEvent: 'relative after:content-[\'.\'] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:text-primary'
          }}
          className={cn('pointer-events-auto')}
        />
      </div>
    </div>
  );
};

export default MultiMonthView;
