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
import { Search, Clock, ListTodo, ChevronDown, ChevronUp, Folder, User, Users } from 'lucide-react';
import { Task, TaskCategory } from '@/types/task';
import { DraggableTask } from './DraggableTask';
import { formatDuration } from '@/lib/formatters';
import { Project } from '@/types/project';

interface UnscheduledTasksPanelProps {
  tasks: Task[];
  projects?: Project[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

type SortOption = 'priority' | 'duration' | 'name' | 'created';
type SourceFilter = 'all' | 'free-tasks' | 'project' | 'team';

export const UnscheduledTasksPanel: React.FC<UnscheduledTasksPanelProps> = ({
  tasks,
  projects = [],
  onTaskClick,
  className
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract unique project IDs from tasks
  const projectsWithTasks = useMemo(() => {
    const projectIds = new Set(tasks.filter(t => t.projectId).map(t => t.projectId!));
    return projects.filter(p => projectIds.has(p.id));
  }, [tasks, projects]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(searchLower));
    }

    // Filter by source
    switch (sourceFilter) {
      case 'free-tasks':
        result = result.filter(t => !t.projectId && !(t as any).teamId);
        break;
      case 'project':
        if (selectedProjectId) {
          result = result.filter(t => t.projectId === selectedProjectId);
        } else {
          result = result.filter(t => t.projectId && !(t as any).teamId);
        }
        break;
      case 'team':
        result = result.filter(t => (t as any).teamId);
        break;
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
  }, [tasks, search, sortBy, sourceFilter, selectedProjectId]);

  // Calculate total time
  const totalTime = useMemo(() => 
    filteredTasks.reduce((sum, t) => sum + t.estimatedTime, 0),
    [filteredTasks]
  );

  // Source filter label
  const getSourceLabel = () => {
    switch (sourceFilter) {
      case 'all': return 'Toutes';
      case 'free-tasks': return 'Tâches libres';
      case 'project': return selectedProjectId 
        ? projects.find(p => p.id === selectedProjectId)?.name || 'Projet'
        : 'Projets';
      case 'team': return 'Équipe';
      default: return 'Toutes';
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-card border rounded-lg overflow-hidden transition-all",
      isCollapsed ? "w-12" : "w-80",
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
              {/* Source filter */}
              <Select 
                value={sourceFilter} 
                onValueChange={(v) => {
                  setSourceFilter(v as SourceFilter);
                  if (v !== 'project') setSelectedProjectId(null);
                }}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue>
                    <span className="flex items-center gap-1">
                      {sourceFilter === 'all' && <ListTodo className="w-3 h-3" />}
                      {sourceFilter === 'free-tasks' && <User className="w-3 h-3" />}
                      {sourceFilter === 'project' && <Folder className="w-3 h-3" />}
                      {sourceFilter === 'team' && <Users className="w-3 h-3" />}
                      {getSourceLabel()}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <ListTodo className="w-3 h-3" /> Toutes
                    </span>
                  </SelectItem>
                  <SelectItem value="free-tasks">
                    <span className="flex items-center gap-2">
                      <User className="w-3 h-3" /> Tâches libres
                    </span>
                  </SelectItem>
                  <SelectItem value="project">
                    <span className="flex items-center gap-2">
                      <Folder className="w-3 h-3" /> Projets
                    </span>
                  </SelectItem>
                  <SelectItem value="team">
                    <span className="flex items-center gap-2">
                      <Users className="w-3 h-3" /> Équipe
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Project sub-filter */}
              {sourceFilter === 'project' && projectsWithTasks.length > 0 && (
                <Select 
                  value={selectedProjectId || 'all'} 
                  onValueChange={(v) => setSelectedProjectId(v === 'all' ? null : v)}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les projets</SelectItem>
                    {projectsWithTasks.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-1">
                          <span>{p.icon || '📁'}</span>
                          <span className="truncate">{p.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort */}
              {sourceFilter !== 'project' || !projectsWithTasks.length && (
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
              )}
            </div>
          </div>

          {/* Task list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">
                    {search ? 'Aucune tâche trouvée' : 'Aucune tâche à planifier'}
                  </p>
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
