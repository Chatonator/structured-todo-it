
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { CalendarView, CALENDAR_VIEWS } from '@/types/task';

interface CalendarToolbarProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  viewTitle: string;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentView,
  onViewChange,
  viewTitle,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday
}) => {
  const viewButtons = [
    { key: CALENDAR_VIEWS.DAY, label: 'Jour' },
    { key: CALENDAR_VIEWS.WEEK, label: 'Semaine' },
    { key: CALENDAR_VIEWS.MONTH, label: 'Mois' },
    { key: CALENDAR_VIEWS.THREE_MONTHS, label: '3 Mois' },
    { key: CALENDAR_VIEWS.SIX_MONTHS, label: '6 Mois' }
  ];

  return (
    <div className="flex items-center justify-between mb-6 bg-card p-4 rounded-lg border border-border">
      {/* Navigation temporelle */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onNavigatePrevious}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNavigateToday}>
          <Calendar className="w-4 h-4 mr-2" />
          Aujourd'hui
        </Button>
        <Button variant="outline" size="sm" onClick={onNavigateNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Titre de la période */}
      <h2 className="text-xl font-semibold text-foreground">
        {viewTitle}
      </h2>

      {/* Sélecteur de vue */}
      <div className="flex bg-accent rounded-lg p-1">
        {viewButtons.map(({ key, label }) => (
          <Button
            key={key}
            variant={currentView === key ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange(key)}
            className="px-3 py-1"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
