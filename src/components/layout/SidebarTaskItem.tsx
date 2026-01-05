import React from 'react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pin, PinOff, Trash2, Clock, ChevronRight } from 'lucide-react';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface SidebarTaskItemProps {
  task: Task;
  isPinned: boolean;
  isSelected: boolean;
  isExtendedView: boolean;
  subTasks: Task[];
  totalTime: number;
  canHaveSubTasks: boolean;
  onToggleCompletion: (taskId: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

/**
 * Item de tâche pour la sidebar avec actions dans dropdown
 */
const SidebarTaskItem: React.FC<SidebarTaskItemProps> = ({
  task,
  isPinned,
  isSelected,
  isExtendedView,
  subTasks,
  totalTime,
  canHaveSubTasks,
  onToggleCompletion,
  onToggleExpansion,
  onTogglePinTask,
  onRemoveTask,
  onUpdateTask
}) => {
  const hasSubTasks = subTasks.length > 0;

  // Map category to border color class
  const getCategoryBorderClass = () => {
    switch (task.category) {
      case 'Obligation': return 'border-l-red-500';
      case 'Quotidien': return 'border-l-amber-500';
      case 'Envie': return 'border-l-green-500';
      case 'Autres': return 'border-l-violet-500';
      default: return 'border-l-primary';
    }
  };

  return (
    <SidebarMenuItem>
      <div
        className={cn(
          "group relative flex items-center gap-2 p-2 rounded-lg border transition-all duration-200",
          "border-l-4",
          getCategoryBorderClass(),
          isPinned 
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700" 
            : "bg-card border-border hover:bg-sidebar-accent/50",
          "hover:shadow-sm"
        )}
      >
        {/* Checkbox */}
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={() => onToggleCompletion(task.id)}
          className="shrink-0"
        />
        
        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {/* Toggle sous-tâches */}
            {hasSubTasks && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleExpansion(task.id)}
                className="h-5 w-5 p-0 shrink-0"
              >
                <ChevronRight className={cn(
                  "w-3 h-3 transition-transform",
                  task.isExpanded && "rotate-90"
                )} />
              </Button>
            )}
            
            <span className={cn(
              "text-sm truncate",
              task.isCompleted && "line-through text-muted-foreground"
            )}>
              {task.name}
            </span>
          </div>
          
          {/* Vue étendue: infos supplémentaires */}
          {isExtendedView && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {totalTime}min
              </span>
              {hasSubTasks && (
                <span>{subTasks.length} sous-tâche{subTasks.length > 1 ? 's' : ''}</span>
              )}
              {isPinned && (
                <Pin className="w-3 h-3 text-amber-500" />
              )}
            </div>
          )}
        </div>

        {/* Temps (vue condensée) */}
        {!isExtendedView && (
          <span className="text-xs text-muted-foreground shrink-0">
            {task.estimatedTime}min
          </span>
        )}

        {/* Menu actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onTogglePinTask(task.id)}>
              {isPinned ? (
                <>
                  <PinOff className="w-4 h-4 mr-2" />
                  Désépingler
                </>
              ) : (
                <>
                  <Pin className="w-4 h-4 mr-2" />
                  Épingler
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onRemoveTask(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sous-tâches (si expandées) */}
      {hasSubTasks && task.isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {subTasks.map(subTask => (
            <div
              key={subTask.id}
              className={cn(
                "flex items-center gap-2 p-1.5 rounded-md border-l-2 text-sm",
                getCategoryBorderClass().replace('border-l-4', ''),
                "bg-muted/30 hover:bg-muted/50 transition-colors"
              )}
            >
              <Checkbox
                checked={subTask.isCompleted}
                onCheckedChange={() => onToggleCompletion(subTask.id)}
                className="h-4 w-4"
              />
              <span className={cn(
                "flex-1 truncate",
                subTask.isCompleted && "line-through text-muted-foreground"
              )}>
                {subTask.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {subTask.estimatedTime}min
              </span>
            </div>
          ))}
        </div>
      )}
    </SidebarMenuItem>
  );
};

export default SidebarTaskItem;
