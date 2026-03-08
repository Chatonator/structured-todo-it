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
const HOUR_LANDMARKS = [
  { hour: 6, label: '6h' },
  { hour: 9, label: '9h' },
  { hour: 12, label: '12h' },
  { hour: 14, label: '14h' },
  { hour: 18, label: '18h' },
  { hour: 21, label: '21h' },
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

function getBlockLabel(hour: number): string {
  if (hour < 12) return '🌅 Matin';
  if (hour < 18) return '☀️ Après-midi';
  return '🌙 Soir';
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

      {/* Time selector */}
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        {/* Header with display */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Heure</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-semibold tabular-nums transition-colors',
              hasTime ? 'text-primary' : 'text-muted-foreground'
            )}>
              {hasTime ? `${displayTime(hour, minute)} · ${getBlockLabel(hour)}` : '—'}
            </span>
            {hasTime && (
              <button type="button" onClick={clearTime} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hours slider with landmarks */}
        <div className="space-y-1">
          <Slider
            value={[hour]}
            onValueChange={handleHourSlider}
            min={6}
            max={22}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between px-0.5">
            {HOUR_LANDMARKS.map((lm) => (
              <button
                key={lm.hour}
                type="button"
                onClick={() => setTime(lm.hour, minute)}
                className={cn(
                  'text-[9px] tabular-nums cursor-pointer transition-colors px-0.5 rounded hover:text-primary',
                  lm.hour === hour ? 'text-primary font-semibold' : 'text-muted-foreground/50'
                )}
              >
                {lm.label}
              </button>
            ))}
          </div>
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
