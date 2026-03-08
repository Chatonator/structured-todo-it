import React, { useState } from 'react';
import { Plus, X, Search, Clock, LinkIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CategoryBadge } from '@/components/primitives/badges/CategoryBadge';
import { ContextBadge } from '@/components/primitives/badges/ContextBadge';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Task, TaskContext } from '@/types/task';

export interface TaskLinkerProps {
  mode: 'single' | 'multi';
  max?: number;
  selectedTasks: Task[];
  filteredAvailableTasks: Task[];
  search: string;
  contextFilter: TaskContext | 'all';
  canSelectMore: boolean;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onSearchChange: (search: string) => void;
  onContextFilterChange: (context: TaskContext | 'all') => void;
  placeholder?: string;
  variant?: 'popover' | 'inline';
  className?: string;
}

const CONTEXT_OPTIONS: { value: TaskContext | 'all'; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'Pro', label: '💼 Pro' },
  { value: 'Perso', label: '🏠 Perso' },
];

// ─── Selected task chip ───
const SelectedChip: React.FC<{ task: Task; onRemove: (id: string) => void }> = ({ task, onRemove }) => (
  <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    <div className="flex-1 min-w-0 flex items-center gap-2">
      <span className="text-sm truncate">{task.name}</span>
      <ContextBadge context={task.context} size="sm" showLabel={false} />
      {task.estimatedTime > 0 && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
          <Clock className="w-3 h-3" />
          {formatDuration(task.estimatedTime)}
        </span>
      )}
    </div>
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(task.id)}>
      <X className="w-3.5 h-3.5" />
    </Button>
  </div>
);

// ─── Task row inside the selector ───
const TaskRow: React.FC<{ task: Task; onSelect: (id: string) => void }> = ({ task, onSelect }) => (
  <button
    className="w-full text-left p-2.5 rounded-md hover:bg-accent transition-colors flex items-center gap-2"
    onClick={() => onSelect(task.id)}
  >
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium truncate">{task.name}</div>
      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
        {task.estimatedTime > 0 && (
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatDuration(task.estimatedTime)}
          </span>
        )}
      </div>
    </div>
    <ContextBadge context={task.context} size="sm" showLabel={false} />
    <CategoryBadge category={task.category} size="sm" />
  </button>
);

// ─── Selector content (shared between popover and inline) ───
const SelectorContent: React.FC<{
  tasks: Task[];
  search: string;
  contextFilter: TaskContext | 'all';
  onSelect: (id: string) => void;
  onSearchChange: (s: string) => void;
  onContextFilterChange: (c: TaskContext | 'all') => void;
  onDone?: () => void;
}> = ({ tasks, search, contextFilter, onSelect, onSearchChange, onContextFilterChange, onDone }) => (
  <div className="flex flex-col">
    {/* Search */}
    <div className="p-2 border-b space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Rechercher une tâche..."
          className="h-8 pl-8 text-sm"
        />
      </div>
      {/* Context filters */}
      <div className="flex gap-1">
        {CONTEXT_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={contextFilter === opt.value ? 'default' : 'ghost'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onContextFilterChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
    {/* Task list */}
    <ScrollArea className="max-h-64">
      <div className="p-1">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3 text-center">Aucune tâche trouvée</p>
        ) : (
          tasks.map(t => (
            <TaskRow key={t.id} task={t} onSelect={id => { onSelect(id); onDone?.(); }} />
          ))
        )}
      </div>
    </ScrollArea>
  </div>
);

// ─── Main component ───
export const TaskLinker: React.FC<TaskLinkerProps> = ({
  mode,
  selectedTasks,
  filteredAvailableTasks,
  search,
  contextFilter,
  canSelectMore,
  onSelect,
  onDeselect,
  onSearchChange,
  onContextFilterChange,
  placeholder = 'Lier une tâche...',
  variant = 'popover',
  className,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    if (mode === 'single') setOpen(false);
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Selected chips */}
      {selectedTasks.map(task => (
        <SelectedChip key={task.id} task={task} onRemove={onDeselect} />
      ))}

      {/* Add button / selector */}
      {canSelectMore && (
        variant === 'popover' ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-2 border-dashed text-muted-foreground">
                <Plus className="w-4 h-4" />
                {placeholder}
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="center">
              <SelectorContent
                tasks={filteredAvailableTasks}
                search={search}
                contextFilter={contextFilter}
                onSelect={handleSelect}
                onSearchChange={onSearchChange}
                onContextFilterChange={onContextFilterChange}
                onDone={mode === 'single' ? () => setOpen(false) : undefined}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <div className="rounded-lg border">
            <SelectorContent
              tasks={filteredAvailableTasks}
              search={search}
              contextFilter={contextFilter}
              onSelect={handleSelect}
              onSearchChange={onSearchChange}
              onContextFilterChange={onContextFilterChange}
            />
          </div>
        )
      )}
    </div>
  );
};

export default TaskLinker;
