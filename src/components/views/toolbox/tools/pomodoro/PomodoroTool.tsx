import React, { useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ToolProps } from '../types';
import { usePomodoroTool, PomodoroPhase, PRESETS } from './usePomodoroTool';
import { TaskLinker } from '../../shared/TaskLinker';
import { useTaskLinker } from '../../shared/useTaskLinker';

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  idle: 'Prêt',
  focus: 'Focus',
  shortBreak: 'Pause courte',
  longBreak: 'Pause longue',
};

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  idle: 'stroke-muted-foreground',
  focus: 'stroke-destructive',
  shortBreak: 'stroke-primary',
  longBreak: 'stroke-accent-foreground',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getActivePreset(config: { focusMinutes: number; shortBreakMinutes: number; longBreakMinutes: number; cyclesBeforeLong: number }): string | null {
  for (const [key, preset] of Object.entries(PRESETS)) {
    if (preset.focusMinutes === config.focusMinutes && preset.shortBreakMinutes === config.shortBreakMinutes && preset.longBreakMinutes === config.longBreakMinutes && preset.cyclesBeforeLong === config.cyclesBeforeLong) return key;
  }
  return null;
}

const PomodoroTool: React.FC<ToolProps> = () => {
  const pomo = usePomodoroTool();
  const linker = useTaskLinker({ mode: 'single', storageKey: 'pomodoro' });
  const [showSettings, setShowSettings] = useState(false);

  React.useEffect(() => {
    pomo.setLinkedTaskId(linker.selectedIds[0] ?? null);
  }, [linker.selectedIds]);

  const activePreset = getActivePreset(pomo.config);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pomo.progress / 100) * circumference;
  const idleDisplay = `${pomo.config.focusMinutes.toString().padStart(2, '0')}:00`;

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto py-4">
      <div className="flex items-center gap-2">
        {Array.from({ length: pomo.cyclesBeforeLong }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full border-2 transition-colors',
              i < pomo.cycleIndex
                ? 'bg-destructive border-destructive'
                : pomo.phase === 'focus' && i === pomo.cycleIndex
                  ? 'border-destructive bg-destructive/30'
                  : 'border-muted-foreground/40 bg-transparent'
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          {pomo.cycleIndex}/{pomo.cyclesBeforeLong}
        </span>
      </div>

      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" className="stroke-muted" strokeWidth="6" />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            className={cn('transition-all duration-500', PHASE_COLORS[pomo.phase])}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="flex flex-col items-center z-10">
          <span className="text-4xl font-mono font-bold text-foreground tabular-nums">
            {pomo.phase === 'idle' ? idleDisplay : formatTime(pomo.secondsLeft)}
          </span>
          <span className={cn(
            'text-sm font-medium mt-1',
            pomo.phase === 'focus' ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {PHASE_LABELS[pomo.phase]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {pomo.status === 'idle' ? (
          <>
            <Button onClick={() => setShowSettings(s => !s)} variant="ghost" size="icon" className="rounded-full h-12 w-12">
              <Settings2 className="w-5 h-5" />
            </Button>
            <Button onClick={pomo.start} size="lg" className="gap-2 rounded-full px-8">
              <Play className="w-5 h-5" />
              Démarrer
            </Button>
          </>
        ) : (
          <>
            {pomo.status === 'running' ? (
              <Button onClick={pomo.pause} variant="outline" size="icon" className="rounded-full h-12 w-12">
                <Pause className="w-5 h-5" />
              </Button>
            ) : (
              <Button onClick={pomo.resume} size="icon" className="rounded-full h-12 w-12">
                <Play className="w-5 h-5" />
              </Button>
            )}
            <Button onClick={pomo.skip} variant="outline" size="icon" className="rounded-full h-12 w-12">
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button onClick={pomo.reset} variant="ghost" size="icon" className="rounded-full h-12 w-12">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {pomo.status === 'idle' && showSettings && (
        <div className="w-full rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant={activePreset === key ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => pomo.setConfig({ focusMinutes: preset.focusMinutes, shortBreakMinutes: preset.shortBreakMinutes, longBreakMinutes: preset.longBreakMinutes, cyclesBeforeLong: preset.cyclesBeforeLong })}
              >
                <div className="flex flex-col items-center">
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-[10px] opacity-70">{preset.description}</span>
                </div>
              </Button>
            ))}
            <Button
              variant={activePreset === null ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => pomo.setConfig({ ...pomo.config })}
              disabled={activePreset === null}
            >
              <div className="flex flex-col items-center">
                <span className="font-medium">Perso</span>
                <span className="text-[10px] opacity-70">Libre</span>
              </div>
            </Button>
          </div>

          <div className="space-y-3">
            <SliderRow label="Focus" value={pomo.config.focusMinutes} min={5} max={60} onChange={v => pomo.setConfig({ ...pomo.config, focusMinutes: v })} />
            <SliderRow label="Pause courte" value={pomo.config.shortBreakMinutes} min={1} max={15} onChange={v => pomo.setConfig({ ...pomo.config, shortBreakMinutes: v })} />
            <SliderRow label="Pause longue" value={pomo.config.longBreakMinutes} min={5} max={30} onChange={v => pomo.setConfig({ ...pomo.config, longBreakMinutes: v })} />
          </div>
        </div>
      )}

      <div className="w-full">
        <TaskLinker
          mode="single"
          selectedTasks={linker.selectedTasks}
          filteredAvailableTasks={linker.filteredAvailableTasks}
          groupedAvailableTasks={linker.groupedAvailableTasks}
          search={linker.filters.search}
          scopeFilter={linker.filters.scope}
          contextFilter={linker.filters.context}
          sortOption={linker.sort}
          canSelectMore={linker.canSelectMore}
          onSelect={linker.select}
          onDeselect={linker.deselect}
          onSearchChange={linker.setSearch}
          onScopeFilterChange={linker.setScopeFilter}
          onContextFilterChange={linker.setContextFilter}
          onSortChange={linker.setSort}
          placeholder="Lier une tâche (optionnel)"
          variant="popover"
        />
      </div>

    </div>
  );
};

function SliderRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={([v]) => onChange(v)} className="flex-1" />
      <span className="text-sm font-mono text-foreground w-12 text-right">{value} min</span>
    </div>
  );
}

export default PomodoroTool;
