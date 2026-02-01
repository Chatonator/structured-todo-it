import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Clock, ListTodo, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, TaskCategory } from '@/types/task';
import { DraggableTask } from './DraggableTask';
import { formatDuration } from '@/lib/formatters';

interface UnscheduledTasksPanelProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

type SortOption = 'priority' | 'duration' | 'name' | 'created';
type FilterCategory = 'all' | TaskCategory;

export const UnscheduledTasksPanel: React.FC<UnscheduledTasksPanelProps> = ({
  tasks,
  onTaskClick,
  className
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(searchLower));
    }

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityMap = {
            'Le plus important': 4,
            'Important': 3,
            'Peut attendre': 2,
            "Si j'ai le temps": 1
          };
          const aPriority = a.subCategory ? priorityMap[a.subCategory] || 0 : 0;
          const bPriority = b.subCategory ? priorityMap[b.subCategory] || 0 : 0;
          return bPriority - aPriority;
        }
        case 'duration':
          return a.estimatedTime - b.estimatedTime;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, search, sortBy, filterCategory]);

  // Calculate total time
  const totalTime = useMemo(() => 
    filteredTasks.reduce((sum, t) => sum + t.estimatedTime, 0),
    [filteredTasks]
  );

  return (
    <div className={cn(
      "flex flex-col bg-card border rounded-lg overflow-hidden transition-all",
      isCollapsed ? "w-12" : "w-72",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-3 border-b bg-muted/30",
        isCollapsed && "flex-col py-4"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">À planifier</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {filteredTasks.length}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* Filters */}
          <div className="p-2 space-y-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-7 text-xs"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as FilterCategory)}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="Obligation">Cruciales</SelectItem>
                  <SelectItem value="Quotidien">Régulières</SelectItem>
                  <SelectItem value="Envie">Envies</SelectItem>
                  <SelectItem value="Autres">Optionnelles</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Tri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="duration">Durée</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="created">Récent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Aucune tâche à planifier</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer stats */}
          <div className="p-2 border-t bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(totalTime)} total</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Collapsed state indicator */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <ListTodo className="w-5 h-5 text-muted-foreground mb-2" />
          <span className="text-xs font-medium writing-mode-vertical">
            {filteredTasks.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default UnscheduledTasksPanel;
