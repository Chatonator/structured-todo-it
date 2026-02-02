import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ListTodo, ChevronLeft, ChevronRight, User, Folder, Users, Clock } from 'lucide-react';
import { Task } from '@/types/task';
import { Project } from '@/types/project';
import { TaskDeck, TaskDeckData } from './TaskDeck';
import { formatDuration } from '@/lib/formatters';

interface TaskDeckPanelProps {
  tasks: Task[];
  projects?: Project[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

/**
 * Panneau latéral avec tâches groupées en decks
 * Remplace UnscheduledTasksPanel avec une meilleure organisation
 */
export const TaskDeckPanel: React.FC<TaskDeckPanelProps> = ({
  tasks,
  projects = [],
  onTaskClick,
  className
}) => {
  const [search, setSearch] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filtrer par recherche
  const filteredTasks = useMemo(() => {
    if (!search) return tasks;
    const searchLower = search.toLowerCase();
    return tasks.filter(t => t.name.toLowerCase().includes(searchLower));
  }, [tasks, search]);

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

    const result: TaskDeckData[] = [];

    // Deck tâches libres
    if (freeTasks.length > 0) {
      result.push({
        id: 'free-tasks',
        name: 'Tâches libres',
        icon: <User className="w-4 h-4" />,
        color: 'bg-muted/30',
        tasks: freeTasks.sort((a, b) => {
          const priorityMap: Record<string, number> = {
            'Le plus important': 4,
            'Important': 3,
            'Peut attendre': 2,
            "Si j'ai le temps": 1
          };
          return (priorityMap[b.subCategory || ''] || 0) - (priorityMap[a.subCategory || ''] || 0);
        }),
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
        tasks: projectTasks.sort((a, b) => {
          const priorityMap: Record<string, number> = {
            'Le plus important': 4,
            'Important': 3,
            'Peut attendre': 2,
            "Si j'ai le temps": 1
          };
          return (priorityMap[b.subCategory || ''] || 0) - (priorityMap[a.subCategory || ''] || 0);
        }),
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
        tasks: teamTasks.sort((a, b) => {
          const priorityMap: Record<string, number> = {
            'Le plus important': 4,
            'Important': 3,
            'Peut attendre': 2,
            "Si j'ai le temps": 1
          };
          return (priorityMap[b.subCategory || ''] || 0) - (priorityMap[a.subCategory || ''] || 0);
        }),
        totalTime: teamTasks.reduce((sum, t) => sum + t.estimatedTime, 0)
      });
    }

    return result;
  }, [filteredTasks, projects]);

  // Stats globales
  const totalTasks = filteredTasks.length;
  const totalTime = filteredTasks.reduce((sum, t) => sum + t.estimatedTime, 0);

  return (
    <div className={cn(
      "flex flex-col bg-card border rounded-xl overflow-hidden transition-all duration-200",
      isCollapsed ? "w-12" : "w-72",
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
            <div className="flex items-center gap-2 flex-1">
              <ListTodo className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">À planifier</span>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {totalTasks}
            </span>
          </>
        )}
      </div>

      {/* Content */}
      {!isCollapsed ? (
        <>
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Decks list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {decks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucune tâche</p>
                  <p className="text-xs mt-1">
                    {search ? 'Essayez une autre recherche' : 'Toutes vos tâches sont planifiées !'}
                  </p>
                </div>
              ) : (
                decks.map(deck => (
                  <TaskDeck
                    key={deck.id}
                    deck={deck}
                    onTaskClick={onTaskClick}
                    defaultOpen={deck.tasks.length <= 5}
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
              </span>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{formatDuration(totalTime)}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Collapsed state */
        <div className="flex-1 flex flex-col items-center justify-center py-4 gap-3">
          <ListTodo className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold">{totalTasks}</span>
            <span className="text-[10px] text-muted-foreground [writing-mode:vertical-lr]">
              tâches
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDeckPanel;
