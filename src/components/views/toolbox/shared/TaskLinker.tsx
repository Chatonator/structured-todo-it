import React, { useState } from 'react';
import { Plus, Search, ChevronDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskRow } from '@/components/primitives/cards/TaskRow';
import { getCategoryClasses } from '@/lib/styling';
import { cn } from '@/lib/utils';
import { Task, TaskContext, TaskCategory, SubTaskCategory, CATEGORY_DISPLAY_NAMES } from '@/types/task';

export interface TaskLinkerProps {
  mode: 'single' | 'multi';
  max?: number;
  selectedTasks: Task[];
  filteredAvailableTasks: Task[];
  filteredCount?: number;
  totalCount?: number;
  search: string;
  contextFilter: TaskContext | 'all';
  categoryFilter?: TaskCategory | 'all';
  priorityFilter?: SubTaskCategory | 'all' | 'none';
  canSelectMore: boolean;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onSearchChange: (search: string) => void;
  onContextFilterChange: (context: TaskContext | 'all') => void;
  onCategoryFilterChange?: (category: TaskCategory | 'all') => void;
  onPriorityFilterChange?: (priority: SubTaskCategory | 'all' | 'none') => void;
  placeholder?: string;
  variant?: 'popover' | 'inline';
  className?: string;
}

const CONTEXT_OPTIONS: { value: TaskContext | 'all'; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'Pro', label: '💼 Pro' },
  { value: 'Perso', label: '🏠 Perso' },
];

const CATEGORY_OPTIONS: { value: TaskCategory | 'all'; label: string; category?: TaskCategory }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'Obligation', label: 'Cruciales', category: 'Obligation' },
  { value: 'Quotidien', label: 'Régulières', category: 'Quotidien' },
  { value: 'Envie', label: 'Envies', category: 'Envie' },
  { value: 'Autres', label: 'Optionnelles', category: 'Autres' },
];

const PRIORITY_OPTIONS: { value: SubTaskCategory | 'all' | 'none'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'Le plus important', label: '🔴 Critique' },
  { value: 'Important', label: '🟠 Important' },
  { value: 'Peut attendre', label: '🟡 Peut attendre' },
  { value: "Si j'ai le temps", label: '🟢 Optionnel' },
  { value: 'none', label: '⚪ Non définie' },
];

// ─── Filter chips row ───
const FilterChips: React.FC<{
  contextFilter: TaskContext | 'all';
  categoryFilter: TaskCategory | 'all';
  priorityFilter: SubTaskCategory | 'all' | 'none';
  onContextChange: (v: TaskContext | 'all') => void;
  onCategoryChange: (v: TaskCategory | 'all') => void;
  onPriorityChange: (v: SubTaskCategory | 'all' | 'none') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}> = ({ contextFilter, categoryFilter, priorityFilter, onContextChange, onCategoryChange, onPriorityChange, showFilters, onToggleFilters }) => {
  const activeCount = [contextFilter !== 'all', categoryFilter !== 'all', priorityFilter !== 'all'].filter(Boolean).length;

  return (
    <div className="space-y-1.5">
      {/* Context row + filter toggle */}
      <div className="flex items-center gap-1">
        {CONTEXT_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={contextFilter === opt.value ? 'default' : 'ghost'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onContextChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
        <Button
          variant={showFilters ? 'secondary' : 'ghost'}
          size="sm"
          className="h-6 text-xs px-2 ml-auto gap-1"
          onClick={onToggleFilters}
        >
          <Filter className="w-3 h-3" />
          {activeCount > 0 && <Badge variant="default" className="h-4 w-4 p-0 text-[9px] flex items-center justify-center">{activeCount}</Badge>}
        </Button>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="space-y-1.5 pt-1 border-t">
          {/* Category chips */}
          <div className="flex flex-wrap gap-1">
            {CATEGORY_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={categoryFilter === opt.value ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "h-5 text-[10px] px-2",
                  categoryFilter !== opt.value && opt.category && getCategoryClasses(opt.category, 'badge')
                )}
                onClick={() => onCategoryChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          {/* Priority chips */}
          <div className="flex flex-wrap gap-1">
            {PRIORITY_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={priorityFilter === opt.value ? 'default' : 'outline'}
                size="sm"
                className="h-5 text-[10px] px-2"
                onClick={() => onPriorityChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Selector content ───
const SelectorContent: React.FC<{
  tasks: Task[];
  search: string;
  contextFilter: TaskContext | 'all';
  categoryFilter: TaskCategory | 'all';
  priorityFilter: SubTaskCategory | 'all' | 'none';
  filteredCount?: number;
  totalCount?: number;
  onSelect: (id: string) => void;
  onSearchChange: (s: string) => void;
  onContextChange: (c: TaskContext | 'all') => void;
  onCategoryChange: (c: TaskCategory | 'all') => void;
  onPriorityChange: (p: SubTaskCategory | 'all' | 'none') => void;
}> = ({ tasks, search, contextFilter, categoryFilter, priorityFilter, filteredCount, totalCount, onSelect, onSearchChange, onContextChange, onCategoryChange, onPriorityChange }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-col">
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
        <FilterChips
          contextFilter={contextFilter}
          categoryFilter={categoryFilter}
          priorityFilter={priorityFilter}
          onContextChange={onContextChange}
          onCategoryChange={onCategoryChange}
          onPriorityChange={onPriorityChange}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(v => !v)}
        />
        {filteredCount !== undefined && totalCount !== undefined && filteredCount !== totalCount && (
          <div className="text-[10px] text-muted-foreground text-right">
            {filteredCount}/{totalCount} tâches
          </div>
        )}
      </div>
      <ScrollArea className="max-h-64">
        <div className="p-1">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3 text-center">Aucune tâche trouvée</p>
          ) : (
            tasks.map(t => (
              <TaskRow key={t.id} task={t} variant="default" onClick={onSelect} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// ─── Main component ───
export const TaskLinker: React.FC<TaskLinkerProps> = ({
  mode,
  selectedTasks,
  filteredAvailableTasks,
  filteredCount,
  totalCount,
  search,
  contextFilter,
  categoryFilter = 'all',
  priorityFilter = 'all',
  canSelectMore,
  onSelect,
  onDeselect,
  onSearchChange,
  onContextFilterChange,
  onCategoryFilterChange,
  onPriorityFilterChange,
  placeholder = 'Lier une tâche...',
  variant = 'popover',
  className,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    if (mode === 'single') setOpen(false);
  };

  const noCategoryChange = onCategoryFilterChange ?? (() => {});
  const noPriorityChange = onPriorityFilterChange ?? (() => {});

  return (
    <div className={cn('w-full space-y-2', className)}>
      {selectedTasks.map(task => (
        <TaskRow key={task.id} task={task} variant="chip" onRemove={onDeselect} />
      ))}

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
                categoryFilter={categoryFilter}
                priorityFilter={priorityFilter}
                filteredCount={filteredCount}
                totalCount={totalCount}
                onSelect={handleSelect}
                onSearchChange={onSearchChange}
                onContextChange={onContextFilterChange}
                onCategoryChange={noCategoryChange}
                onPriorityChange={noPriorityChange}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <div className="rounded-lg border">
            <SelectorContent
              tasks={filteredAvailableTasks}
              search={search}
              contextFilter={contextFilter}
              categoryFilter={categoryFilter}
              priorityFilter={priorityFilter}
              filteredCount={filteredCount}
              totalCount={totalCount}
              onSelect={handleSelect}
              onSearchChange={onSearchChange}
              onContextChange={onContextFilterChange}
              onCategoryChange={noCategoryChange}
              onPriorityChange={noPriorityChange}
            />
          </div>
        )
      )}
    </div>
  );
};

export default TaskLinker;
