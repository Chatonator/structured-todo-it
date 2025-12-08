import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays } from 'lucide-react';
import { format, startOfWeek, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MonthlyDay {
  date: string;
  count: number;
  total: number;
  rate: number;
}

interface HabitCalendarHeatmapProps {
  monthlyData: MonthlyDay[];
}

const HabitCalendarHeatmap: React.FC<HabitCalendarHeatmapProps> = ({ monthlyData }) => {
  const today = new Date();
  const weekStart = startOfWeek(subDays(today, 28), { weekStartsOn: 1 });
  
  // Générer 5 semaines de données
  const weeks: Date[][] = [];
  for (let w = 0; w < 5; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(weekStart, w * 7 + d));
    }
    weeks.push(week);
  }

  const getDataForDate = (date: Date): MonthlyDay | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return monthlyData.find(d => d.date === dateStr);
  };

  const getColorClass = (rate: number): string => {
    if (rate === 0) return 'bg-muted';
    if (rate < 25) return 'bg-habit/20';
    if (rate < 50) return 'bg-habit/40';
    if (rate < 75) return 'bg-habit/60';
    if (rate < 100) return 'bg-habit/80';
    return 'bg-habit';
  };

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-habit" />
          Calendrier des 5 dernières semaines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex flex-col gap-1">
            {/* En-têtes des jours */}
            <div className="flex gap-1 mb-1">
              {dayLabels.map((day, i) => (
                <div
                  key={i}
                  className="w-8 h-4 flex items-center justify-center text-xs text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grille des semaines */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-1">
                {week.map((date, dayIdx) => {
                  const data = getDataForDate(date);
                  const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                  const isFuture = date > today;
                  
                  return (
                    <Tooltip key={dayIdx}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            w-8 h-8 rounded-md flex items-center justify-center text-xs
                            transition-all duration-200 cursor-default
                            ${isFuture 
                              ? 'bg-muted/30' 
                              : getColorClass(data?.rate || 0)
                            }
                            ${isToday ? 'ring-2 ring-habit ring-offset-1 ring-offset-background' : ''}
                          `}
                        >
                          {format(date, 'd')}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">
                          {format(date, 'EEEE d MMMM', { locale: fr })}
                        </p>
                        {!isFuture && data && (
                          <p className="text-xs text-muted-foreground">
                            {data.count}/{data.total} habitudes ({data.rate}%)
                          </p>
                        )}
                        {!isFuture && !data && (
                          <p className="text-xs text-muted-foreground">
                            Aucune donnée
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Légende */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-muted-foreground">Moins</span>
            <div className="w-4 h-4 rounded bg-muted" />
            <div className="w-4 h-4 rounded bg-habit/20" />
            <div className="w-4 h-4 rounded bg-habit/40" />
            <div className="w-4 h-4 rounded bg-habit/60" />
            <div className="w-4 h-4 rounded bg-habit/80" />
            <div className="w-4 h-4 rounded bg-habit" />
            <span className="text-xs text-muted-foreground">Plus</span>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default HabitCalendarHeatmap;
