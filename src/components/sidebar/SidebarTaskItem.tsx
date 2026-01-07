import React from 'react';
import { Task } from '@/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import {
  MoreHorizontal,
  Check,
  Edit,
  Split,
  FolderPlus,
  Pin,
  PinOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

interface SidebarTaskItemProps {
  task: Task;
  subTasks: Task[];
  totalTime: number;
  isSelected: boolean;
  isPinned: boolean;
  canHaveSubTasks: boolean;
  onToggleSelection: (taskId: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onCreateSubTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onAssignToProject: (taskId: string, projectId: string) => Promise<boolean>;
}

const getCategoryColor = (category: Task['category']) => {
  switch (category) {
    case 'Obligation':
      return 'bg-category-obligation';
    case 'Quotidien':
      return 'bg-category-quotidien';
    case 'Envie':
      return 'bg-category-envie';
    case 'Autres':
      return 'bg-category-autres';
    default:
      return 'bg-muted';
  }
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h${mins}` : `${hours}h`;
};

const SidebarTaskItem: React.FC<SidebarTaskItemProps> = ({
  task,
  subTasks,
  totalTime,
  isSelected,
  isPinned,
  canHaveSubTasks,
  onToggleSelection,
  onToggleExpansion,
  onToggleCompletion,
  onTogglePinTask,
  onRemoveTask,
  onCreateSubTask,
  onEditTask,
  onAssignToProject,
}) => {
  const { projects } = useProjects();
  const hasSubTasks = subTasks.length > 0;

  return (
    <SidebarMenuItem
      className={cn(
        'group relative flex items-start rounded-md transition-all duration-200',
        'hover:bg-sidebar-accent/60',
        'border-b border-sidebar-border/40',
        'mb-0.5 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)]',
        isPinned && 'bg-amber-50/50 dark:bg-amber-900/10'
      )}
    >
      {/* Barre de couleur catégorie - collée au bord gauche */}
      <div
        className={cn(
          'w-1 self-stretch rounded-l-md shrink-0',
          getCategoryColor(task.category)
        )}
      />

      {/* Contenu principal - plus de place pour le texte */}
      <div className="flex items-start gap-1 flex-1 min-w-0 py-2 pl-2 pr-1">
        {/* Expand/collapse pour sous-tâches - plus compact */}
        {hasSubTasks && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 mt-0.5"
            onClick={() => onToggleExpansion(task.id)}
          >
            {task.isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* Texte et métadonnées - priorité au texte */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm leading-tight',
              task.isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.name}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{formatTime(totalTime)}</span>
            {hasSubTasks && (
              <span className="text-[10px] bg-muted px-1 rounded">
                +{subTasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions - visible seulement au hover */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Checkbox au hover seulement */}
          <Checkbox
            checked={task.isCompleted}
            onCheckedChange={() => onToggleCompletion(task.id)}
            className="h-4 w-4"
          />

          {/* Menu d'actions (3 points) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
              <DropdownMenuItem onClick={() => onToggleCompletion(task.id)}>
                <Check className="w-4 h-4 mr-2 text-green-600" />
                {task.isCompleted ? 'Rouvrir' : 'Terminer'}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onEditTask(task)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>

              {canHaveSubTasks && (
                <DropdownMenuItem onClick={() => onCreateSubTask(task)}>
                  <Split className="w-4 h-4 mr-2" />
                  Diviser en sous-tâches
                </DropdownMenuItem>
              )}

              {projects.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Ajouter au projet
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-popover z-50">
                    {projects.map(project => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => onAssignToProject(task.id, project.id)}
                      >
                        {project.icon} {project.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

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

              <DropdownMenuSeparator />

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
      </div>
    </SidebarMenuItem>
  );
};

export default SidebarTaskItem;
