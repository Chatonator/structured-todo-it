import React, { useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface DurationPickerProps {
  /** Duration in minutes */
  value: number | '';
  onChange: (minutes: number) => void;
  hasError?: boolean;
}

const HOUR_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MINUTE_TICKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function formatDuration(totalMinutes: number): string {
  if (totalMinutes === 0) return '0min';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

const DurationPicker: React.FC<DurationPickerProps> = ({ value, onChange, hasError = false }) => {
  const totalMinutes = Number(value) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const handleHoursChange = useCallback((vals: number[]) => {
    onChange(vals[0] * 60 + minutes);
  }, [minutes, onChange]);

  const handleMinutesChange = useCallback((vals: number[]) => {
    onChange(hours * 60 + vals[0]);
  }, [hours, onChange]);

  const clickHour = useCallback((h: number) => {
    onChange(h * 60 + minutes);
  }, [minutes, onChange]);

  const clickMinute = useCallback((m: number) => {
    onChange(hours * 60 + m);
  }, [hours, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          Durée estimée <span className="text-destructive">*</span>
        </Label>
        <span className={cn(
          'text-sm font-semibold tabular-nums transition-colors',
          totalMinutes > 0 ? 'text-primary' : 'text-muted-foreground'
        )}>
          {totalMinutes > 0 ? formatDuration(totalMinutes) : '—'}
        </span>
      </div>

      {/* Hours slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Heures</span>
          <span className="tabular-nums font-medium">{hours}h</span>
        </div>
        <Slider
          value={[hours]}
          onValueChange={handleHoursChange}
          min={0}
          max={8}
          step={1}
          className="cursor-pointer"
        />
        <div className="relative h-4">
          {HOUR_TICKS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => clickHour(h)}
              className={cn(
                'absolute top-0 text-[9px] tabular-nums cursor-pointer transition-colors rounded hover:text-primary leading-none',
                h === 0 ? 'left-0 translate-x-0' : h === 8 ? 'right-0 translate-x-0' : '-translate-x-1/2',
                h === hours ? 'text-primary font-semibold' : 'text-muted-foreground/50'
              )}
              style={h === 0 || h === 8 ? undefined : { left: `${(h / 8) * 100}%` }}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Minutes slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Minutes</span>
          <span className="tabular-nums font-medium">{minutes}min</span>
        </div>
        <Slider
          value={[minutes]}
          onValueChange={handleMinutesChange}
          min={0}
          max={55}
          step={5}
          className="cursor-pointer"
        />
        <div className="flex justify-between" style={{ paddingLeft: 8, paddingRight: 8 }}>
          {MINUTE_TICKS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => clickMinute(m)}
              className={cn(
                'text-[9px] tabular-nums cursor-pointer transition-colors rounded hover:text-primary',
                m === minutes ? 'text-primary font-semibold' : 'text-muted-foreground/50'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {hasError && totalMinutes === 0 && (
        <p className="text-[10px] text-destructive">Requis</p>
      )}
    </div>
  );
};

export default DurationPicker;
