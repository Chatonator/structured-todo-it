import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  Circle,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { EnrichedTask } from '@/hooks/view-data/useObservatoryViewData';
import { TaskCategory } from '@/types/task';

// ============= Types =============
export interface TaskGroup {
  id: string;
  name: string;
  tasks: EnrichedTask[];
  totalTime: number;
  completedCount: number;
  subGroups?: TaskGroup[];
}

interface TaskFoldersProps {
  groups: TaskGroup[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onRestore?: (taskId: string) => void;
  onTaskClick?: (task: EnrichedTask) => void;
  showCompleted?: boolean;
}

// ============= Helpers =============
const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
};

const getCategoryColor = (category: TaskCategory): string => {
  const colors: Record<TaskCategory, string> = {
    'Obligation': 'bg-destructive/10 text-destructive',
    'Quotidien': 'bg-primary/10 text-primary',
    'Envie': 'bg-accent/30 text-accent-foreground',
    'Autres': 'bg-muted text-muted-foreground',
  };
  return colors[category] || colors['Autres'];
};

const getContextColor = (context: string): string => {
  return context === 'Pro' 
    ? 'bg-secondary text-secondary-foreground'
    : 'bg-accent/30 text-accent-foreground';
};

// ============= TaskRow Component =============
interface TaskRowProps {
  task: EnrichedTask;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onRestore?: (taskId: string) => void;
  onClick?: (task: EnrichedTask) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ 
  task, 
  onComplete, 
  onDelete, 
  onRestore,
  onClick 
}) => {
  return (
    <div 
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
        "hover:bg-accent/50 cursor-pointer",
        task.isCompleted && "opacity-60"
      )}
      onClick={() => onClick?.(task)}
    >
      {/* Completion toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete(task.id);
        }}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
      >
        {task.isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-primary" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </button>

      {/* Task name */}
      <span className={cn(
        "flex-1 text-sm truncate",
        task.isCompleted && "line-through text-muted-foreground"
      )}>
        {task.name}
      </span>

      {/* Time estimate */}
      <span className="text-xs text-muted-foreground shrink-0">
        {formatTime(task.estimatedTime)}
      </span>

      {/* Category badge */}
      <Badge 
        variant="secondary" 
        className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0", getCategoryColor(task.category))}
      >
        {task.category.slice(0, 3)}
      </Badge>

      {/* Context badge */}
      <Badge 
        variant="secondary" 
        className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0", getContextColor(task.context))}
      >
        {task.context}
      </Badge>

      {/* Age indicator for zombies */}
      {task.isZombie && (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
          {task.ageLabel}
        </Badge>
      )}

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          {task.isCompleted && onRestore ? (
            <DropdownMenuItem onClick={() => onRestore(task.id)}>
              <RotateCcw className="w-3 h-3 mr-2" />
              Restaurer
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem 
            onClick={() => onDelete(task.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ============= SubFolder Component =============
interface SubFolderProps {
  group: TaskGroup;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onRestore?: (taskId: string) => void;
  onTaskClick?: (task: EnrichedTask) => void;
}

const SubFolder: React.FC<SubFolderProps> = ({ 
  group, 
  onComplete, 
  onDelete, 
  onRestore,
  onTaskClick 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
          "hover:bg-accent/30 text-sm"
        )}>
          {isOpen ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          <Tag className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium text-foreground/80">{group.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
            {group.tasks.length}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTime(group.totalTime)}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-5 border-l border-border/50 pl-2 mt-1">
          {group.tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              onRestore={onRestore}
              onClick={onTaskClick}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============= FolderCard Component =============
interface FolderCardProps {
  group: TaskGroup;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onRestore?: (taskId: string) => void;
  onTaskClick?: (task: EnrichedTask) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({ 
  group, 
  onComplete, 
  onDelete, 
  onRestore,
  onTaskClick 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasSubGroups = group.subGroups && group.subGroups.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 transition-colors",
            "hover:bg-accent/20"
          )}>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <FolderKanban className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">{group.name}</span>
            
            {/* Stats badges */}
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline" className="text-xs">
                {group.tasks.length} tâches
              </Badge>
              {group.completedCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                  {group.completedCount} terminées
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(group.totalTime)}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-2 pb-3 space-y-1">
            {hasSubGroups ? (
              // Render sub-groups (categories)
              group.subGroups!.map(subGroup => (
                <SubFolder
                  key={subGroup.id}
                  group={subGroup}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onTaskClick={onTaskClick}
                />
              ))
            ) : (
              // Render tasks directly
              group.tasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onClick={onTaskClick}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// ============= Main TaskFolders Component =============
export const TaskFolders: React.FC<TaskFoldersProps> = ({ 
  groups, 
  onComplete, 
  onDelete, 
  onRestore,
  onTaskClick 
}) => {
  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Aucune tâche à afficher</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(group => (
        <FolderCard
          key={group.id}
          group={group}
          onComplete={onComplete}
          onDelete={onDelete}
          onRestore={onRestore}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
};

export default TaskFolders;
