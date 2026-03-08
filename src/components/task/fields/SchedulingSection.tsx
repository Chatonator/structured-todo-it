import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SchedulingSectionProps {
  scheduledDate?: Date;
  scheduledTime?: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

const MINUTE_TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const TIME_BLOCKS = [
  { label: '🌅 Matin', hours: [6, 7, 8, 9, 10, 11] },
  { label: '☀️ Après-midi', hours: [12, 13, 14, 15, 16, 17] },
  { label: '🌙 Soir', hours: [18, 19, 20, 21] },
];

function parseTime(time?: string): { hour: number; minute: number } {
  if (!time) return { hour: 9, minute: 0 };
  const [h, m] = time.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function displayTime(hour: number, minute: number): string {
  if (minute === 0) return `${hour}h`;
  return `${hour}h${String(minute).padStart(2, '0')}`;
}

export const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  scheduledDate,
  scheduledTime,
  onDateChange,
  onTimeChange
}) => {
  const { hour, minute } = parseTime(scheduledTime);
  const hasTime = !!scheduledTime;

  const setTime = useCallback((h: number, m: number) => {
    onTimeChange(formatTime(h, m));
  }, [onTimeChange]);

  const handleHourSlider = useCallback((vals: number[]) => {
    setTime(vals[0], minute);
  }, [minute, setTime]);

  const handleMinuteSlider = useCallback((vals: number[]) => {
    setTime(hour, vals[0]);
  }, [hour, setTime]);

  const clickHour = useCallback((h: number) => {
    setTime(h, minute);
  }, [minute, setTime]);

  const clickMinute = useCallback((m: number) => {
    setTime(hour, m);
  }, [hour, setTime]);

  const clearTime = useCallback(() => {
    onTimeChange('');
  }, [onTimeChange]);

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <Label className="text-sm text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Planification (optionnelle)
      </Label>

      {/* Date picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !scheduledDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {scheduledDate ? format(scheduledDate, "EEEE d MMMM", { locale: fr }) : "Choisir une date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={scheduledDate}
            onSelect={onDateChange}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Time selector – visual sliders */}
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        {/* Header with display */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Heure</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-semibold tabular-nums transition-colors',
              hasTime ? 'text-primary' : 'text-muted-foreground'
            )}>
              {hasTime ? displayTime(hour, minute) : '—'}
            </span>
            {hasTime && (
              <button type="button" onClick={clearTime} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Time blocks */}
        <div className="space-y-2">
          {TIME_BLOCKS.map((block) => (
            <div key={block.label} className="space-y-1">
              <span className="text-[10px] text-muted-foreground">{block.label}</span>
              <div className="flex gap-1">
                {block.hours.map((h) => {
                  const isActive = hasTime && hour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => clickHour(h)}
                      className={cn(
                        'flex-1 text-xs py-1.5 rounded-md border transition-all tabular-nums',
                        isActive
                          ? 'bg-primary/15 border-primary text-primary font-semibold'
                          : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      )}
                    >
                      {h}h
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Minutes slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Minutes</span>
            <span className="tabular-nums font-medium">{minute}min</span>
          </div>
          <Slider
            value={[minute]}
            onValueChange={handleMinuteSlider}
            min={0}
            max={55}
            step={5}
            className="cursor-pointer"
          />
          <div className="flex justify-between px-0.5">
            {MINUTE_TICKS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => clickMinute(m)}
                className={cn(
                  'text-[9px] tabular-nums cursor-pointer transition-colors px-0.5 rounded hover:text-primary',
                  m === minute ? 'text-primary font-semibold' : 'text-muted-foreground/50'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
