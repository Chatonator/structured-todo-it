import React, { useMemo, useState } from 'react';
import { Plus, Search, ChevronDown, Filter, ChevronRight, FolderKanban, ArrowDownAZ, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TaskRow } from '@/components/primitives/cards/TaskRow';
import { getCategoryClasses } from '@/lib/styling';
import { cn } from '@/lib/utils';
import { Task, TaskContext, TaskCategory, SubTaskCategory } from '@/types/task';
import { TaskLinkerGroup, TaskLinkerGroupBy, TaskLinkerScope, TaskLinkerSort } from './useTaskLinker';

export interface TaskLinkerProps {
  mode: 'single' | 'multi';
  max?: number;
  selectedTasks: Task[];
  filteredAvailableTasks: Task[];
  groupedAvailableTasks?: TaskLinkerGroup[];
  filteredCount?: number;
  totalCount?: number;
  search: string;
  scopeFilter?: TaskLinkerScope;
  contextFilter: TaskContext | 'all';
  categoryFilter?: TaskCategory | 'all';
  priorityFilter?: SubTaskCategory | 'all' | 'none';
  sortOption?: TaskLinkerSort;
  onSortChange?: (sort: TaskLinkerSort) => void;
  canSelectMore: boolean;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onSearchChange: (search: string) => void;
  onScopeFilterChange?: (scope: TaskLinkerScope) => void;
  onContextFilterChange: (context: TaskContext | 'all') => void;
  onCategoryFilterChange?: (category: TaskCategory | 'all') => void;
  onPriorityFilterChange?: (priority: SubTaskCategory | 'all' | 'none') => void;
  placeholder?: string;
  variant?: 'popover' | 'inline';
  className?: string;
  showGrouping?: boolean;
  showSort?: boolean;
  showScopeFilter?: boolean;
}

const SCOPE_OPTIONS: { value: TaskLinkerScope; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'free', label: 'Tâches libres' },
  { value: 'project', label: 'Projet' },
];

const CONTEXT_OPTIONS: { value: TaskContext | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous contextes' },
  { value: 'Pro', label: '💼 Pro' },
  { value: 'Perso', label: '🏠 Perso' },
];

const CATEGORY_OPTIONS: { value: TaskCategory | 'all'; label: string; category?: TaskCategory }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'Obligation', label: 'Cruciales', category: 'Obligation' },
  { value: 'Quotidien', label: 'Regulieres', category: 'Quotidien' },
  { value: 'Envie', label: 'Envies', category: 'Envie' },
  { value: 'Autres', label: 'Optionnelles', category: 'Autres' },
];

const PRIORITY_OPTIONS: { value: SubTaskCategory | 'all' | 'none'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'Le plus important', label: '🔴 Critique' },
  { value: 'Important', label: '🟠 Important' },
  { value: 'Peut attendre', label: '🟡 Peut attendre' },
  { value: "Si j'ai le temps", label: '🟢 Optionnel' },
  { value: 'none', label: '⚪ Non definie' },
];

const SORT_OPTIONS: { value: TaskLinkerSort; label: string }[] = [
  { value: 'none', label: 'Aucun tri' },
  { value: 'name', label: 'Nom' },
  { value: 'time', label: 'Duree' },
  { value: 'priority', label: 'Priorite' },
];

const PRIORITY_ORDER: Record<SubTaskCategory, number> = {
  'Le plus important': 0,
  Important: 1,
  'Peut attendre': 2,
  "Si j'ai le temps": 3,
};

function compareTasks(left: Task, right: Task, sort: TaskLinkerSort): number {
  switch (sort) {
    case 'name':
      return left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    case 'time':
      return (right.estimatedTime || 0) - (left.estimatedTime || 0) || left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    case 'priority': {
      const leftRank = left.subCategory ? PRIORITY_ORDER[left.subCategory] : 99;
      const rightRank = right.subCategory ? PRIORITY_ORDER[right.subCategory] : 99;
      return leftRank - rightRank || left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    }
    case 'none':
    default:
      return 0;
  }
}

function inferGroupBy(
  scopeFilter: TaskLinkerScope,
  contextFilter: TaskContext | 'all',
  categoryFilter: TaskCategory | 'all',
  priorityFilter: SubTaskCategory | 'all' | 'none'
): TaskLinkerGroupBy {
  if (scopeFilter === 'all') return 'scope';
  if (priorityFilter !== 'all') return 'none';
  if (contextFilter === 'all') return 'context';
  if (categoryFilter === 'all') return 'category';
  return 'none';
}

function buildGroups(tasks: Task[], groupBy: TaskLinkerGroupBy): TaskLinkerGroup[] {
  if (groupBy === 'none') {
    return [{ id: 'all', label: 'Taches', count: tasks.length, tasks }];
  }

  const groups = new Map<string, TaskLinkerGroup>();

  tasks.forEach((task) => {
    const id = groupBy === 'scope'
      ? task.projectId ? 'scope:project' : 'scope:free'
      : groupBy === 'context'
        ? `context:${task.context}`
        : `category:${task.category}`;

    const label = groupBy === 'scope'
      ? task.projectId ? 'Projet' : 'Tâches libres'
      : groupBy === 'context'
        ? task.context
        : CATEGORY_OPTIONS.find((option) => option.value === task.category)?.label || task.category;

    const existing = groups.get(id);
    if (existing) {
      existing.tasks.push(task);
      existing.count += 1;
      return;
    }

    groups.set(id, { id, label, count: 1, tasks: [task] });
  });

  return Array.from(groups.values());
}

const FilterChips: React.FC<{
  scopeFilter: TaskLinkerScope;
  contextFilter: TaskContext | 'all';
  categoryFilter: TaskCategory | 'all';
  priorityFilter: SubTaskCategory | 'all' | 'none';
  sortOption: TaskLinkerSort;
  showSort: boolean;
  showScopeFilter: boolean;
  onScopeChange: (v: TaskLinkerScope) => void;
  onContextChange: (v: TaskContext | 'all') => void;
  onCategoryChange: (v: TaskCategory | 'all') => void;
  onPriorityChange: (v: SubTaskCategory | 'all' | 'none') => void;
  onSortChange: (v: TaskLinkerSort) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}> = ({
  scopeFilter,
  contextFilter,
  categoryFilter,
  priorityFilter,
  sortOption,
  showSort,
  showScopeFilter,
  onScopeChange,
  onContextChange,
  onCategoryChange,
  onPriorityChange,
  onSortChange,
  showFilters,
  onToggleFilters,
}) => {
  const activeCount = [scopeFilter !== 'all', contextFilter !== 'all', categoryFilter !== 'all', priorityFilter !== 'all'].filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {showScopeFilter && SCOPE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={scopeFilter === opt.value ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => onScopeChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
        <Button
          variant={showFilters ? 'secondary' : 'ghost'}
          size="sm"
          className="ml-auto h-7 gap-1.5 px-2.5 text-xs"
          onClick={onToggleFilters}
        >
          <Filter className="h-3 w-3" />
          Filtres
          {activeCount > 0 && (
            <Badge variant="default" className="flex h-4 min-w-4 items-center justify-center px-1 text-[9px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {showSort && (
          <Select value={sortOption} onValueChange={(value) => onSortChange(value as TaskLinkerSort)}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <div className="flex items-center gap-1.5">
                <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Tri" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {filteredCountLabel(scopeFilter, contextFilter, categoryFilter, priorityFilter) && (
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {filteredCountLabel(scopeFilter, contextFilter, categoryFilter, priorityFilter)}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="space-y-2 rounded-lg border bg-muted/25 p-2.5">
          <div className="flex flex-wrap gap-1">
            {CONTEXT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={contextFilter === opt.value ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => onContextChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {CATEGORY_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={categoryFilter === opt.value ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-6 px-2 text-[10px]',
                  categoryFilter !== opt.value && opt.category && getCategoryClasses(opt.category, 'badge')
                )}
                onClick={() => onCategoryChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {PRIORITY_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={priorityFilter === opt.value ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-[10px]"
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

function filteredCountLabel(
  scopeFilter: TaskLinkerScope,
  contextFilter: TaskContext | 'all',
  categoryFilter: TaskCategory | 'all',
  priorityFilter: SubTaskCategory | 'all' | 'none'
): string | null {
  if (scopeFilter === 'all') return 'Range par type';
  if (priorityFilter !== 'all') return 'Vue detaillee';
  if (contextFilter === 'all') return 'Range par contexte';
  if (categoryFilter === 'all') return 'Range par categorie';
  return null;
}

const GroupSection: React.FC<{
  group: TaskLinkerGroup;
  onSelect: (id: string) => void;
}> = ({ group, onSelect }) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card/70">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-accent/20">
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <FolderKanban className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-foreground">{group.label}</span>
            <Badge variant="outline" className="ml-auto text-[10px]">
              {group.count}
            </Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-1 border-t border-border/50 p-2">
            {group.tasks.map((task) => (
              <TaskRow key={task.id} task={task} variant="default" onClick={onSelect} className="rounded-lg" />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const SelectorContent: React.FC<{
  tasks: Task[];
  groups: TaskLinkerGroup[];
  groupBy: TaskLinkerGroupBy;
  search: string;
  scopeFilter: TaskLinkerScope;
  contextFilter: TaskContext | 'all';
  categoryFilter: TaskCategory | 'all';
  priorityFilter: SubTaskCategory | 'all' | 'none';
  sortOption: TaskLinkerSort;
  filteredCount?: number;
  totalCount?: number;
  showGrouping: boolean;
  showSort: boolean;
  showScopeFilter: boolean;
  onSelect: (id: string) => void;
  onSearchChange: (s: string) => void;
  onScopeChange: (s: TaskLinkerScope) => void;
  onContextChange: (c: TaskContext | 'all') => void;
  onCategoryChange: (c: TaskCategory | 'all') => void;
  onPriorityChange: (p: SubTaskCategory | 'all' | 'none') => void;
  onSortChange: (sort: TaskLinkerSort) => void;
}> = ({
  tasks,
  groups,
  groupBy,
  search,
  scopeFilter,
  contextFilter,
  categoryFilter,
  priorityFilter,
  sortOption,
  filteredCount,
  totalCount,
  showGrouping,
  showSort,
  showScopeFilter,
  onSelect,
  onSearchChange,
  onScopeChange,
  onContextChange,
  onCategoryChange,
  onPriorityChange,
  onSortChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const useGroups = showGrouping && groupBy !== 'none' && groups.length > 1;

  return (
    <div className="flex flex-col">
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher une tâche..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <FilterChips
          scopeFilter={scopeFilter}
          contextFilter={contextFilter}
          categoryFilter={categoryFilter}
          priorityFilter={priorityFilter}
          sortOption={sortOption}
          showSort={showSort}
          showScopeFilter={showScopeFilter}
          onScopeChange={onScopeChange}
          onContextChange={onContextChange}
          onCategoryChange={onCategoryChange}
          onPriorityChange={onPriorityChange}
          onSortChange={onSortChange}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((value) => !value)}
        />
        {filteredCount !== undefined && totalCount !== undefined && filteredCount !== totalCount && (
          <div className="text-right text-[10px] text-muted-foreground">
            {filteredCount}/{totalCount} tâches visibles
          </div>
        )}
      </div>

      <ScrollArea className="max-h-72">
        <div className="p-2">
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-4 w-4 opacity-70" />
              Aucune tâche trouvée
            </div>
          ) : useGroups ? (
            <div className="space-y-2">
              {groups.map((group) => (
                <GroupSection key={group.id} group={group} onSelect={onSelect} />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} variant="default" onClick={onSelect} className="rounded-lg" />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const TaskLinker: React.FC<TaskLinkerProps> = ({
  mode,
  selectedTasks,
  filteredAvailableTasks,
  groupedAvailableTasks,
  filteredCount,
  totalCount,
  search,
  scopeFilter,
  contextFilter,
  categoryFilter = 'all',
  priorityFilter = 'all',
  sortOption,
  onSortChange,
  canSelectMore,
  onSelect,
  onDeselect,
  onSearchChange,
  onScopeFilterChange,
  onContextFilterChange,
  onCategoryFilterChange,
  onPriorityFilterChange,
  placeholder = 'Lier une tâche...',
  variant = 'popover',
  className,
  showGrouping = true,
  showSort = true,
  showScopeFilter = true,
}) => {
  const [open, setOpen] = useState(false);
  const [internalSort, setInternalSort] = useState<TaskLinkerSort>('none');
  const [internalScope, setInternalScope] = useState<TaskLinkerScope>('all');

  const effectiveSort = sortOption ?? internalSort;
  const effectiveScope = scopeFilter ?? internalScope;
  const handleSortChange = onSortChange ?? setInternalSort;
  const handleScopeChange = onScopeFilterChange ?? setInternalScope;

  const sortedTasks = useMemo(
    () => [...filteredAvailableTasks].sort((left, right) => compareTasks(left, right, effectiveSort)),
    [filteredAvailableTasks, effectiveSort]
  );

  const effectiveGroupBy = useMemo(
    () => inferGroupBy(effectiveScope, contextFilter, categoryFilter, priorityFilter),
    [effectiveScope, contextFilter, categoryFilter, priorityFilter]
  );

  const effectiveGroups = useMemo(() => {
    if (groupedAvailableTasks && sortOption && onSortChange && scopeFilter && onScopeFilterChange) {
      return groupedAvailableTasks;
    }
    return buildGroups(sortedTasks, effectiveGroupBy);
  }, [groupedAvailableTasks, sortOption, onSortChange, scopeFilter, onScopeFilterChange, sortedTasks, effectiveGroupBy]);

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
            <PopoverContent className="w-[26rem] p-0" align="center">
              <SelectorContent
                tasks={sortedTasks}
                groups={effectiveGroups}
                groupBy={effectiveGroupBy}
                search={search}
                scopeFilter={effectiveScope}
                contextFilter={contextFilter}
                categoryFilter={categoryFilter}
                priorityFilter={priorityFilter}
                sortOption={effectiveSort}
                filteredCount={filteredCount}
                totalCount={totalCount}
                showGrouping={showGrouping}
                showSort={showSort}
                showScopeFilter={showScopeFilter}
                onSelect={handleSelect}
                onSearchChange={onSearchChange}
                onScopeChange={handleScopeChange}
                onContextChange={onContextFilterChange}
                onCategoryChange={noCategoryChange}
                onPriorityChange={noPriorityChange}
                onSortChange={handleSortChange}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <div className="rounded-xl border bg-card/70">
            <SelectorContent
              tasks={sortedTasks}
              groups={effectiveGroups}
              groupBy={effectiveGroupBy}
              search={search}
              scopeFilter={effectiveScope}
              contextFilter={contextFilter}
              categoryFilter={categoryFilter}
              priorityFilter={priorityFilter}
              sortOption={effectiveSort}
              filteredCount={filteredCount}
              totalCount={totalCount}
              showGrouping={showGrouping}
              showSort={showSort}
              showScopeFilter={showScopeFilter}
              onSelect={handleSelect}
              onSearchChange={onSearchChange}
              onScopeChange={handleScopeChange}
              onContextChange={onContextFilterChange}
              onCategoryChange={noCategoryChange}
              onPriorityChange={noPriorityChange}
              onSortChange={handleSortChange}
            />
          </div>
        )
      )}
    </div>
  );
};

export default TaskLinker;
