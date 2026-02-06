import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  X, 
  Target, 
  ListTodo, 
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ToolProps } from '../types';
import { useRule135Tool, TaskSlot } from './useRule135Tool';
import { Task } from '@/types/task';

const SLOT_CONFIG = {
  big: {
    title: 'BIG',
    subtitle: '1 tâche cruciale',
    icon: Target,
    color: 'text-system-error',
    bgColor: 'bg-system-error/10',
    borderColor: 'border-system-error/30'
  },
  medium: {
    title: 'MEDIUM',
    subtitle: '3 tâches importantes',
    icon: ListTodo,
    color: 'text-system-warning',
    bgColor: 'bg-system-warning/10',
    borderColor: 'border-system-warning/30'
  },
  small: {
    title: 'SMALL',
    subtitle: '5 petites tâches',
    icon: Sparkles,
    color: 'text-system-info',
    bgColor: 'bg-system-info/10',
    borderColor: 'border-system-info/30'
  }
} as const;

interface TaskItemProps {
  task: Task;
  slot: TaskSlot;
  onToggle: (id: string) => void;
  onRemove: (id: string, slot: TaskSlot) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, slot, onToggle, onRemove }) => {
  const config = SLOT_CONFIG[slot];
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      config.bgColor,
      config.borderColor,
      task.isCompleted && "opacity-60"
    )}>
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={() => onToggle(task.id)}
        className="h-5 w-5"
      />
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium truncate",
          task.isCompleted && "line-through text-muted-foreground"
        )}>
          {task.name}
        </div>
        {task.estimatedTime > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(task.estimatedTime)}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => onRemove(task.id, slot)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

interface TaskSelectorProps {
  tasks: Task[];
  slot: TaskSlot;
  onSelect: (taskId: string, slot: TaskSlot) => void;
  disabled?: boolean;
}

const TaskSelector: React.FC<TaskSelectorProps> = ({ tasks, slot, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);
  const config = SLOT_CONFIG[slot];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || tasks.length === 0}
          className={cn(
            "w-full justify-start gap-2 border-dashed",
            config.borderColor
          )}
        >
          <Plus className="w-4 h-4" />
          Ajouter une tâche...
          <ChevronDown className="w-4 h-4 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <div className="text-sm font-medium">Sélectionner une tâche</div>
          <div className="text-xs text-muted-foreground">
            {tasks.length} tâche{tasks.length > 1 ? 's' : ''} disponible{tasks.length > 1 ? 's' : ''}
          </div>
        </div>
        <ScrollArea className="h-[250px]">
          <div className="p-2 space-y-1">
            {tasks.map(task => (
              <button
                key={task.id}
                className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                onClick={() => {
                  onSelect(task.id, slot);
                  setOpen(false);
                }}
              >
                <div className="font-medium truncate text-sm">{task.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {task.estimatedTime > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(task.estimatedTime)}
                    </span>
                  )}
                  <span>{task.category}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

interface SlotSectionProps {
  slot: TaskSlot;
  tasks: Task[];
  unselectedTasks: Task[];
  slotInfo: { filled: boolean; max: number; current: number };
  onAdd: (taskId: string, slot: TaskSlot) => void;
  onRemove: (taskId: string, slot: TaskSlot) => void;
  onToggle: (taskId: string) => void;
}

const SlotSection: React.FC<SlotSectionProps> = ({
  slot,
  tasks,
  unselectedTasks,
  slotInfo,
  onAdd,
  onRemove,
  onToggle
}) => {
  const config = SLOT_CONFIG[slot];
  const Icon = config.icon;
  const completedCount = tasks.filter(t => t.isCompleted).length;

  return (
    <Card className={cn("border", config.borderColor)}>
      <CardHeader className={cn("py-3", config.bgColor)}>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", config.color)} />
            <div>
              <div className="font-bold">{config.title}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {config.subtitle}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {slotInfo.current}/{slotInfo.max}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            slot={slot}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
        
        {!slotInfo.filled && (
          <TaskSelector
            tasks={unselectedTasks}
            slot={slot}
            onSelect={onAdd}
          />
        )}

        {tasks.length > 0 && (
          <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {completedCount}/{tasks.length} terminée{completedCount > 1 ? 's' : ''}
            </span>
            <span>
              {formatDuration(tasks.reduce((sum, t) => sum + t.estimatedTime, 0))}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Rule135Tool: React.FC<ToolProps> = () => {
  const { data, actions } = useRule135Tool();

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-semibold">{formatDuration(data.stats.totalTime)}</span>
            {' '}estimé
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-semibold">{data.stats.completedCount}/{data.stats.totalCount}</span>
            {' '}tâches ({data.stats.progress}%)
          </span>
        </div>
        {data.stats.totalCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={actions.clearAll}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Slots */}
      <div className="space-y-4">
        <SlotSection
          slot="big"
          tasks={data.selectedTasks.big ? [data.selectedTasks.big] : []}
          unselectedTasks={data.unselectedTasks}
          slotInfo={data.slots.big}
          onAdd={actions.addTask}
          onRemove={actions.removeTask}
          onToggle={actions.toggleTaskCompletion}
        />

        <SlotSection
          slot="medium"
          tasks={data.selectedTasks.medium}
          unselectedTasks={data.unselectedTasks}
          slotInfo={data.slots.medium}
          onAdd={actions.addTask}
          onRemove={actions.removeTask}
          onToggle={actions.toggleTaskCompletion}
        />

        <SlotSection
          slot="small"
          tasks={data.selectedTasks.small}
          unselectedTasks={data.unselectedTasks}
          slotInfo={data.slots.small}
          onAdd={actions.addTask}
          onRemove={actions.removeTask}
          onToggle={actions.toggleTaskCompletion}
        />
      </div>

      {/* Tips */}
      <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
        <div className="text-sm font-medium mb-2">💡 Comment utiliser 1-3-5</div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>BIG</strong> : La tâche la plus importante de votre journée</li>
          <li>• <strong>MEDIUM</strong> : 3 tâches significatives mais moins critiques</li>
          <li>• <strong>SMALL</strong> : 5 petites tâches rapides (emails, admin...)</li>
          <li>• Total recommandé : ~6-8h de travail effectif</li>
        </ul>
      </div>
    </div>
  );
};

export default Rule135Tool;
