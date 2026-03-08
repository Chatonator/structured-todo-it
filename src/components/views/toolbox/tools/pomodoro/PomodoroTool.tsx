import React from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToolProps } from '../types';
import { usePomodoroTool, PomodoroPhase } from './usePomodoroTool';
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

const PomodoroTool: React.FC<ToolProps> = () => {
  const pomo = usePomodoroTool();
  const linker = useTaskLinker({ mode: 'single', storageKey: 'pomodoro' });

  // Sync linked task id to pomodoro hook
  React.useEffect(() => {
    pomo.setLinkedTaskId(linker.selectedIds[0] ?? null);
  }, [linker.selectedIds]);

  // SVG circle constants
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pomo.progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto py-4">
      {/* Cycle dots */}
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

      {/* Timer circle */}
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
            {pomo.phase === 'idle' ? '25:00' : formatTime(pomo.secondsLeft)}
          </span>
          <span className={cn(
            'text-sm font-medium mt-1',
            pomo.phase === 'focus' ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {PHASE_LABELS[pomo.phase]}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {pomo.status === 'idle' ? (
          <Button onClick={pomo.start} size="lg" className="gap-2 rounded-full px-8">
            <Play className="w-5 h-5" />
            Démarrer
          </Button>
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

      {/* Linked task via TaskLinker */}
      <div className="w-full">
        <TaskLinker
          mode="single"
          selectedTasks={linker.selectedTasks}
          filteredAvailableTasks={linker.filteredAvailableTasks}
          search={linker.filters.search}
          contextFilter={linker.filters.context}
          canSelectMore={linker.canSelectMore}
          onSelect={linker.select}
          onDeselect={linker.deselect}
          onSearchChange={linker.setSearch}
          onContextFilterChange={linker.setContextFilter}
          placeholder="Lier une tâche (optionnel)"
          variant="popover"
        />
      </div>

      {/* Sessions today */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>🔥</span>
        <span>{pomo.sessionsToday} session{pomo.sessionsToday !== 1 ? 's' : ''} aujourd'hui</span>
      </div>
    </div>
  );
};

export default PomodoroTool;
