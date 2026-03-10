import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  X,
  Target,
  ListTodo,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatDuration } from '@/lib/formatters';
import { getCategoryIndicatorColor } from '@/lib/styling';
import { cn } from '@/lib/utils';
import { ToolProps } from '../types';
import { useRule135Tool, TaskSlot } from './useRule135Tool';
import { Task } from '@/types/task';
import { TaskLinker } from '../../shared/TaskLinker';
import { useTaskLinker } from '../../shared/useTaskLinker';

const SLOT_CONFIG = {
  big: {
    title: 'BIG',
    subtitle: '1 tâche cruciale',
    icon: Target,
    color: 'text-system-error',
    bgColor: 'bg-system-error/10',
    borderColor: 'border-system-error/30',
    max: 1,
  },
  medium: {
    title: 'MEDIUM',
    subtitle: '3 tâches importantes',
    icon: ListTodo,
    color: 'text-system-warning',
    bgColor: 'bg-system-warning/10',
    borderColor: 'border-system-warning/30',
    max: 3,
  },
  small: {
    title: 'SMALL',
    subtitle: '5 petites tâches',
    icon: Sparkles,
    color: 'text-system-info',
    bgColor: 'bg-system-info/10',
    borderColor: 'border-system-info/30',
    max: 5,
  },
} as const;

interface TaskItemProps {
  task: Task;
  slot: TaskSlot;
  onToggle: (id: string) => void;
  onRemove: (id: string, slot: TaskSlot) => void;
}

const SlotTaskItem: React.FC<TaskItemProps> = ({ task, slot, onToggle, onRemove }) => {
  const config = SLOT_CONFIG[slot];

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border',
      config.bgColor,
      config.borderColor,
      task.isCompleted && 'opacity-60'
    )}>
      <div className={cn('w-1 self-stretch rounded-full shrink-0', getCategoryIndicatorColor(task.category))} />
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={() => onToggle(task.id)}
        className="h-5 w-5"
      />
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-medium truncate',
          task.isCompleted && 'line-through text-muted-foreground'
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

interface SlotSectionProps {
  slot: TaskSlot;
  tasks: Task[];
  allSelectedIds: string[];
  slotInfo: { filled: boolean; max: number; current: number };
  onAdd: (taskId: string, slot: TaskSlot) => void;
  onRemove: (taskId: string, slot: TaskSlot) => void;
  onToggle: (taskId: string) => void;
}

const SlotSection: React.FC<SlotSectionProps> = ({
  slot,
  tasks,
  allSelectedIds,
  slotInfo,
  onAdd,
  onRemove,
  onToggle,
}) => {
  const config = SLOT_CONFIG[slot];
  const Icon = config.icon;
  const completedCount = tasks.filter(t => t.isCompleted).length;

  const linker = useTaskLinker({
    mode: config.max === 1 ? 'single' : 'multi',
    maxSelection: config.max,
    excludeIds: allSelectedIds,
  });

  const handleSelect = (id: string) => {
    onAdd(id, slot);
  };

  return (
    <Card className={cn('border', config.borderColor)}>
      <CardHeader className={cn('py-3', config.bgColor)}>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', config.color)} />
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
          <SlotTaskItem
            key={task.id}
            task={task}
            slot={slot}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}

        {!slotInfo.filled && (
          <TaskLinker
            mode={config.max === 1 ? 'single' : 'multi'}
            max={config.max - slotInfo.current}
            selectedTasks={[]}
            filteredAvailableTasks={linker.filteredAvailableTasks}
            groupedAvailableTasks={linker.groupedAvailableTasks}
            filteredCount={linker.filteredCount}
            totalCount={linker.totalCount}
            search={linker.filters.search}
            scopeFilter={linker.filters.scope}
            contextFilter={linker.filters.context}
            categoryFilter={linker.filters.category}
            priorityFilter={linker.filters.priority}
            sortOption={linker.sort}
            canSelectMore={!slotInfo.filled}
            onSelect={handleSelect}
            onDeselect={() => {}}
            onSearchChange={linker.setSearch}
            onScopeFilterChange={linker.setScopeFilter}
            onContextFilterChange={linker.setContextFilter}
            onCategoryFilterChange={linker.setCategoryFilter}
            onPriorityFilterChange={linker.setPriorityFilter}
            onSortChange={linker.setSort}
            placeholder="Ajouter une tâche..."
            variant="popover"
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

  const allSelectedIds = [
    ...(data.selectedTasks.big ? [data.selectedTasks.big.id] : []),
    ...data.selectedTasks.medium.map(t => t.id),
    ...data.selectedTasks.small.map(t => t.id),
  ];

  return (
    <div className="space-y-6">
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

      <div className="space-y-4">
        <SlotSection
          slot="big"
          tasks={data.selectedTasks.big ? [data.selectedTasks.big] : []}
          allSelectedIds={allSelectedIds}
          slotInfo={data.slots.big}
          onAdd={actions.addTask}
          onRemove={actions.removeTask}
          onToggle={actions.toggleTaskCompletion}
        />

        <SlotSection
          slot="medium"
          tasks={data.selectedTasks.medium}
          allSelectedIds={allSelectedIds}
          slotInfo={data.slots.medium}
          onAdd={actions.addTask}
          onRemove={actions.removeTask}
          onToggle={actions.toggleTaskCompletion}
        />

        <SlotSection
          slot="small"
          tasks={data.selectedTasks.small}
          allSelectedIds={allSelectedIds}
          slotInfo={data.slots.small}
          onAdd={actions.addTask}
          onRemove={actions.removeTask}
          onToggle={actions.toggleTaskCompletion}
        />
      </div>

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
