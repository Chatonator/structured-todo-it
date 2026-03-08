import React, { useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, LinkIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { cn } from '@/lib/utils';
import { ToolProps } from '../types';
import { usePomodoroTool, PomodoroPhase } from './usePomodoroTool';

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
  const { tasks } = useViewDataContext();

  const activeTasks = useMemo(
    () => tasks.filter(t => !t.isCompleted).slice(0, 30),
    [tasks]
  );

  const linkedTask = useMemo(
    () => (pomo.linkedTaskId ? tasks.find(t => t.id === pomo.linkedTaskId) : null),
    [pomo.linkedTaskId, tasks]
  );

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
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth="6"
          />
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

      {/* Linked task */}
      <div className="w-full rounded-lg border bg-card p-3">
        {linkedTask ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{linkedTask.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => pomo.setLinkedTaskId(null)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
                <LinkIcon className="w-4 h-4" />
                Lier une tâche (optionnel)
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="center">
              <ScrollArea className="max-h-60">
                <div className="p-1">
                  {activeTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 text-center">Aucune tâche</p>
                  ) : (
                    activeTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => pomo.setLinkedTaskId(task.id)}
                        className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-accent truncate"
                      >
                        {task.name}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
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
