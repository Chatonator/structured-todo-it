import React, { useCallback, useMemo } from 'react';
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
    const newH = vals[0];
    const newTotal = newH * 60 + minutes;
    onChange(Math.max(newTotal, 0));
  }, [minutes, onChange]);

  const handleMinutesChange = useCallback((vals: number[]) => {
    const newM = vals[0];
    const newTotal = hours * 60 + newM;
    onChange(Math.max(newTotal, 0));
  }, [hours, onChange]);

  const handlePreset = useCallback((preset: number) => {
    onChange(preset);
  }, [onChange]);

  const isPresetActive = useMemo(() => {
    return PRESETS.find(p => p.value === totalMinutes)?.value;
  }, [totalMinutes]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          Durée estimée
        </Label>
        <span className={cn(
          'text-sm font-semibold tabular-nums transition-colors',
          totalMinutes > 0 ? 'text-primary' : 'text-muted-foreground'
        )}>
          {totalMinutes > 0 ? formatDuration(totalMinutes) : '—'}
        </span>
      </div>

      {/* Presets */}
      <div className="flex gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handlePreset(p.value)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 border',
              isPresetActive === p.value
                ? 'bg-primary text-primary-foreground border-primary'
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
        <div className="flex justify-between text-[9px] text-muted-foreground/50 px-0.5">
          <span>0</span>
          <span>2</span>
          <span>4</span>
          <span>6</span>
          <span>8</span>
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
        <div className="flex justify-between text-[9px] text-muted-foreground/50 px-0.5">
          <span>0</span>
          <span>15</span>
          <span>30</span>
          <span>45</span>
          <span>55</span>
        </div>
      </div>

      {hasError && totalMinutes === 0 && (
        <p className="text-[10px] text-destructive">Requis</p>
      )}
    </div>
  );
};

export default DurationPicker;
