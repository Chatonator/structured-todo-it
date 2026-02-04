import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays } from 'lucide-react';
import { format, startOfWeek, addDays, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HeatmapDay } from '@/hooks/view-data/useObservatoryViewData';

interface CreationHeatmapProps {
  data: HeatmapDay[];
}

export const CreationHeatmap: React.FC<CreationHeatmapProps> = ({ data }) => {
  const today = new Date();
  const weekStart = startOfWeek(subDays(today, 28), { weekStartsOn: 1 });
  
  // Generate 5 weeks of dates
  const weeks: Date[][] = [];
  for (let w = 0; w < 5; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(weekStart, w * 7 + d));
    }
    weeks.push(week);
  }

  const getDataForDate = (date: Date): HeatmapDay | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return data.find(d => d.date === dateStr);
  };

  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getColorClass = (count: number): string => {
    if (count === 0) return 'bg-muted';
    const ratio = count / maxCount;
    if (ratio < 0.2) return 'bg-primary/20';
    if (ratio < 0.4) return 'bg-primary/40';
    if (ratio < 0.6) return 'bg-primary/60';
    if (ratio < 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          Tâches créées (5 semaines)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex flex-col gap-1">
            {/* Day headers */}
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
            
            {/* Week grid */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-1">
                {week.map((date, dayIdx) => {
                  const dayData = getDataForDate(date);
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
                              ? 'bg-muted/30 text-muted-foreground/50' 
                              : getColorClass(dayData?.count || 0)
                            }
                            ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                            ${!isFuture && dayData && dayData.count > 0 ? 'text-primary-foreground' : ''}
                          `}
                        >
                          {format(date, 'd')}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">
                          {format(date, 'EEEE d MMMM', { locale: fr })}
                        </p>
                        {!isFuture && (
                          <p className="text-xs text-muted-foreground">
                            {dayData?.count || 0} tâche{(dayData?.count || 0) > 1 ? 's' : ''} créée{(dayData?.count || 0) > 1 ? 's' : ''}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-muted-foreground">Moins</span>
            <div className="w-4 h-4 rounded bg-muted" />
            <div className="w-4 h-4 rounded bg-primary/20" />
            <div className="w-4 h-4 rounded bg-primary/40" />
            <div className="w-4 h-4 rounded bg-primary/60" />
            <div className="w-4 h-4 rounded bg-primary/80" />
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-xs text-muted-foreground">Plus</span>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default CreationHeatmap;
