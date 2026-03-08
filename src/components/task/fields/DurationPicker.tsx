import React, { useCallback, useMemo, useRef } from 'react';
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

const PRESETS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h+' },
];

function formatDuration(totalMinutes: number): { main: string; sub: string } {
  if (totalMinutes === 0) return { main: '0', sub: 'min' };
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return { main: `${m}`, sub: 'min' };
  if (m === 0) return { main: `${h}`, sub: h > 1 ? 'heures' : 'heure' };
  return { main: `${h}h${m.toString().padStart(2, '0')}`, sub: '' };
}

/** Color intensity based on duration */
function getDurationColor(minutes: number): string {
  if (minutes === 0) return 'text-muted-foreground';
  if (minutes <= 30) return 'text-primary';
  if (minutes <= 90) return 'text-primary';
  if (minutes <= 180) return 'text-category-envie';
  return 'text-category-obligation';
}

function getProgressPercent(minutes: number): number {
  return Math.min((minutes / 480) * 100, 100);
}

const DurationPicker: React.FC<DurationPickerProps> = ({ value, onChange, hasError = false }) => {
  const totalMinutes = Number(value) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHoursChange = useCallback((vals: number[]) => {
    onChange(Math.max(vals[0] * 60 + minutes, 0));
  }, [minutes, onChange]);

  const handleMinutesChange = useCallback((vals: number[]) => {
    onChange(Math.max(hours * 60 + vals[0], 0));
  }, [hours, onChange]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    const newVal = Math.max(0, Math.min(480, totalMinutes + delta));
    onChange(newVal);
  }, [totalMinutes, onChange]);

  const isPresetActive = useMemo(() => {
    return PRESETS.find(p => p.value === totalMinutes)?.value;
  }, [totalMinutes]);

  const formatted = formatDuration(totalMinutes);
  const colorClass = getDurationColor(totalMinutes);
  const progress = getProgressPercent(totalMinutes);

  return (
    <div
      ref={containerRef}
      className="space-y-3 select-none"
      onWheel={handleWheel}
    >
      {/* Header with large display */}
      <div className="flex items-end justify-between">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          Durée estimée
        </Label>
        <div className={cn('flex items-baseline gap-1 transition-colors duration-300', colorClass)}>
          <span className="text-2xl font-bold tabular-nums leading-none transition-all duration-300">
            {totalMinutes > 0 ? formatted.main : '—'}
          </span>
          {formatted.sub && totalMinutes > 0 && (
            <span className="text-xs font-medium opacity-70">{formatted.sub}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            totalMinutes <= 90 ? 'bg-primary' : totalMinutes <= 180 ? 'bg-category-envie' : 'bg-category-obligation'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Presets */}
      <div className="flex gap-1 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={cn(
              'px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 border',
              isPresetActive === p.value
                ? 'bg-primary text-primary-foreground border-primary scale-105'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
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
      </div>

      {/* Scroll hint */}
      <p className="text-[9px] text-muted-foreground/50 text-center">
        Molette pour ajuster ±5min
      </p>

      {hasError && totalMinutes === 0 && (
        <p className="text-[10px] text-destructive">Requis</p>
      )}
    </div>
  );
};

export default DurationPicker;
