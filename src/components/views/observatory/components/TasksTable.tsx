import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Check,
  Trash2,
  RotateCcw,
  Table as TableIcon,
  Ghost,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  EnrichedTask, 
  TabFilter, 
  SortField, 
  SortDirection 
} from '@/hooks/view-data/useObservatoryViewData';
import { TaskTableRow } from './TaskTableRow';
import { cn } from '@/lib/utils';

interface TasksTableProps {
  tasks: EnrichedTask[];
  activeTab: TabFilter;
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  selectedTasks: Set<string>;
  stats: {
    total: number;
    active: number;
    completed: number;
    zombie: number;
  };
  onTabChange: (tab: TabFilter) => void;
  onSort: (field: SortField) => void;
  onSearch: (query: string) => void;
  onToggleSelection: (taskId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onRestore: (taskId: string) => void;
  hideTabBar?: boolean;
}

const SortableHeader: React.FC<{
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ field, currentField, direction, onSort, children, className }) => {
  const isActive = field === currentField;
  
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 font-medium text-xs uppercase tracking-wide hover:text-foreground transition-colors",
        isActive ? 'text-foreground' : 'text-muted-foreground',
        className
      )}
    >
      {children}
      {isActive ? (
        direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
};

export const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  activeTab,
  sortField,
  sortDirection,
  searchQuery,
  selectedTasks,
  stats,
  onTabChange,
  onSort,
  onSearch,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onComplete,
  onDelete,
  onRestore,
  hideTabBar = false,
}) => {
  const hasSelection = selectedTasks.size > 0;
  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;

  const tabConfig = [
    { value: 'active', label: 'Actives', count: stats.active, icon: Clock },
    { value: 'completed', label: 'Terminées', count: stats.completed, icon: CheckCircle2 },
    { value: 'zombie', label: 'Zombies', count: stats.zombie, icon: Ghost },
    { value: 'recent', label: 'Récentes', count: null, icon: Sparkles },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-primary" />
            Toutes les tâches
          </CardTitle>
          
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        {!hideTabBar && (
          <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabFilter)} className="mt-3">
            <TabsList className="h-8">
              {tabConfig.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 gap-1.5">
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count !== null && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                      {tab.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Bulk actions */}
        {hasSelection && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-muted/50 rounded-lg">
            <span className="text-xs text-muted-foreground">
              {selectedTasks.size} sélectionnée{selectedTasks.size > 1 ? 's' : ''}
            </span>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClearSelection}>
              Désélectionner
            </Button>
            {activeTab !== 'completed' && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs text-primary"
                onClick={() => selectedTasks.forEach(id => onComplete(id))}
              >
                <Check className="w-3 h-3 mr-1" />
                Terminer
              </Button>
            )}
            {activeTab === 'completed' && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs"
                onClick={() => selectedTasks.forEach(id => onRestore(id))}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Restaurer
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b bg-muted/30 rounded-t-lg">
          <div className="col-span-1 flex items-center">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => allSelected ? onClearSelection() : onSelectAll()}
            />
          </div>
          <div className="col-span-3">
            <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Nom
            </SortableHeader>
          </div>
          <div className="col-span-2 hidden sm:block">
            <SortableHeader field="category" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Catégorie
            </SortableHeader>
          </div>
          <div className="col-span-1 hidden md:block">
            <SortableHeader field="context" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Ctx
            </SortableHeader>
          </div>
          <div className="col-span-1">
            <SortableHeader field="age" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Âge
            </SortableHeader>
          </div>
          <div className="col-span-1 hidden lg:block">
            <SortableHeader field="estimatedTime" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Durée
            </SortableHeader>
          </div>
          <div className="col-span-2 hidden lg:block">
            <SortableHeader field="project" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Projet
            </SortableHeader>
          </div>
          <div className="col-span-1 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Actions
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <TableIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune tâche trouvée</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskTableRow
                key={task.id}
                task={task}
                isSelected={selectedTasks.has(task.id)}
                onToggleSelection={onToggleSelection}
                onComplete={onComplete}
                onDelete={onDelete}
                onRestore={onRestore}
                showRestore={activeTab === 'completed'}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>{tasks.length} tâche{tasks.length > 1 ? 's' : ''}</span>
          <span>Total: {stats.total}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksTable;
