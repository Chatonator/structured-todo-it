import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ListTodo, ChevronLeft, ChevronRight, User, Folder, Users, Clock, Calendar } from 'lucide-react';
import { Task, SubTaskCategory } from '@/types/task';
import { Project } from '@/types/project';
import { TimeEvent } from '@/lib/time/types';
import { TaskDeck, TaskDeckData } from './TaskDeck';
import { ScheduledEventsList } from './ScheduledEventsList';
import { TimelineFilters, TimelineTaskFilters } from './TimelineFilters';
import { formatDuration } from '@/lib/formatters';
import { getPriorityLevel } from '@/lib/styling';

interface TaskDeckPanelProps {
  tasks: Task[];
  scheduledEvents?: TimeEvent[];
  projects?: Project[];
  onTaskClick?: (task: Task) => void;
  onEventClick?: (event: TimeEvent) => void;
  onUnscheduleEvent?: (eventId: string) => void;
  onCompleteEvent?: (eventId: string) => void;
  className?: string;
}

type ShowMode = 'unscheduled' | 'scheduled';

/**
 * Panneau latéral avec tâches groupées en decks
 * Inclut toggle pour voir les tâches à planifier / déjà planifiées
 * Système de filtres avancés
 */
export const TaskDeckPanel: React.FC<TaskDeckPanelProps> = ({
  tasks,
  scheduledEvents = [],
  projects = [],
  onTaskClick,
  onEventClick,
  onUnscheduleEvent,
  onCompleteEvent,
  className
}) => {
  const [search, setSearch] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMode, setShowMode] = useState<ShowMode>('unscheduled');
  const [filters, setFilters] = useState<TimelineTaskFilters>({
    categories: [],
    contexts: [],
    priorities: []
  });

  // Build project name map
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(p => map.set(p.id, p.name));
    return map;
  }, [projects]);

  // Filtrer par recherche et filtres avancés
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(searchLower));
    }

    // Catégories
    if (filters.categories.length > 0) {
      result = result.filter(t => filters.categories.includes(t.category));
    }

    // Contextes
    if (filters.contexts.length > 0) {
      result = result.filter(t => filters.contexts.includes(t.context));
    }

    // Priorités
    if (filters.priorities.length > 0) {
      result = result.filter(t => t.subCategory && filters.priorities.includes(t.subCategory));
    }

    return result;
  }, [tasks, search, filters]);

  // Créer les decks
  const decks = useMemo((): TaskDeckData[] => {
    const freeTasks: Task[] = [];
    const teamTasks: Task[] = [];
    const projectMap = new Map<string, Task[]>();

    filteredTasks.forEach(task => {
      const isTeam = !!(task as any).teamId;
      
      if (isTeam) {
        teamTasks.push(task);
      } else if (task.projectId) {
        if (!projectMap.has(task.projectId)) {
          projectMap.set(task.projectId, []);
        }
        projectMap.get(task.projectId)!.push(task);
      } else {
        freeTasks.push(task);
      }
    });

    const sortByPriority = (a: Task, b: Task) => {
      return getPriorityLevel(b.subCategory) - getPriorityLevel(a.subCategory);
    };

    const result: TaskDeckData[] = [];

    // Deck tâches libres
    if (freeTasks.length > 0) {
      result.push({
        id: 'free-tasks',
        name: 'Tâches libres',
        icon: <User className="w-4 h-4" />,
        color: 'bg-muted/30',
        tasks: freeTasks.sort(sortByPriority),
        totalTime: freeTasks.reduce((sum, t) => sum + t.estimatedTime, 0)
      });
    }

    // Decks par projet
    projectMap.forEach((projectTasks, projectId) => {
      const project = projects.find(p => p.id === projectId);
      result.push({
        id: `project-${projectId}`,
        name: project?.name || 'Projet',
        icon: <span className="text-sm">{project?.icon || '📁'}</span>,
        color: 'bg-project/10',
        tasks: projectTasks.sort(sortByPriority),
        totalTime: projectTasks.reduce((sum, t) => sum + t.estimatedTime, 0)
      });
    });

    // Deck équipe
    if (teamTasks.length > 0) {
      result.push({
        id: 'team-tasks',
        name: 'Équipe',
        icon: <Users className="w-4 h-4" />,
        color: 'bg-primary/10',
        tasks: teamTasks.sort(sortByPriority),
        totalTime: teamTasks.reduce((sum, t) => sum + t.estimatedTime, 0)
      });
    }

    return result;
  }, [filteredTasks, projects]);

  // Stats globales
  const totalTasks = filteredTasks.length;
  const totalTime = filteredTasks.reduce((sum, t) => sum + t.estimatedTime, 0);
  const hasActiveFilters = 
    filters.categories.length > 0 || 
    filters.contexts.length > 0 || 
    filters.priorities.length > 0;

  return (
    <div className={cn(
      "flex flex-col bg-card border rounded-xl overflow-hidden transition-all duration-200",
      isCollapsed ? "w-12" : "w-80",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 p-3 border-b bg-muted/20",
        isCollapsed && "flex-col py-4 px-2"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>

        {!isCollapsed && (
          <>
            {/* Toggle À planifier / Planifiées */}
            <div className="flex gap-0.5 bg-muted/40 rounded-md p-0.5 flex-1">
              <Button
                variant={showMode === 'unscheduled' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 text-xs flex-1"
                onClick={() => setShowMode('unscheduled')}
              >
                <ListTodo className="w-3 h-3 mr-1" />
                À faire ({tasks.length})
              </Button>
              <Button
                variant={showMode === 'scheduled' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 text-xs flex-1"
                onClick={() => setShowMode('scheduled')}
              >
                <Calendar className="w-3 h-3 mr-1" />
                Planifiées ({scheduledEvents.length})
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {!isCollapsed ? (
        <>
          {/* Search & Filters */}
          <div className="p-2 space-y-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            
            {showMode === 'unscheduled' && (
              <TimelineFilters 
                filters={filters} 
                onFiltersChange={setFilters} 
              />
            )}
          </div>

          {/* Liste selon le mode */}
          {showMode === 'unscheduled' ? (
            <>
              {/* Decks list */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {decks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Aucune tâche</p>
                      <p className="text-xs mt-1">
                        {search || hasActiveFilters 
                          ? 'Essayez de modifier vos filtres' 
                          : 'Toutes vos tâches sont planifiées !'
                        }
                      </p>
                    </div>
                  ) : (
                    decks.map(deck => (
                      <TaskDeck
                        key={deck.id}
                        deck={deck}
                        onTaskClick={onTaskClick}
                        defaultOpen={deck.tasks.length <= 5}
                        projectNameMap={projectNameMap}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Footer stats */}
              <div className="p-3 border-t bg-muted/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {totalTasks} tâche{totalTasks !== 1 ? 's' : ''}
                    {hasActiveFilters && <span className="text-primary ml-1">(filtrées)</span>}
                  </span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{formatDuration(totalTime)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Scheduled events list with scroll */
            <ScrollArea className="flex-1">
              <div className="p-2">
                <ScheduledEventsList
                  events={scheduledEvents}
                  onEventClick={onEventClick}
                  onUnschedule={onUnscheduleEvent}
                  onComplete={onCompleteEvent}
                />
              </div>
            </ScrollArea>
          )}
        </>
      ) : (
        /* Collapsed state */
        <div className="flex-1 flex flex-col items-center justify-center py-4 gap-3">
          {showMode === 'unscheduled' ? (
            <>
              <ListTodo className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold">{tasks.length}</span>
                <span className="text-[10px] text-muted-foreground [writing-mode:vertical-lr]">
                  à faire
                </span>
              </div>
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold">{scheduledEvents.length}</span>
                <span className="text-[10px] text-muted-foreground [writing-mode:vertical-lr]">
                  planifiées
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskDeckPanel;
