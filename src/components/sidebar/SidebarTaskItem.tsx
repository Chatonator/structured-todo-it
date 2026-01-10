import React, { useState } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

interface SidebarTaskItemProps {
  task: Task;
  subTasks: Task[];
  totalTime: number;
  isSelected: boolean;
  isPinned: boolean;
  isRecurring?: boolean;
  canHaveSubTasks: boolean;
  onToggleSelection: (taskId: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onCreateSubTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onAssignToProject: (taskId: string, projectId: string) => Promise<boolean>;
  onToggleRecurring?: (taskId: string, taskName: string, estimatedTime: number) => void;
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
  isRecurring = false,
  canHaveSubTasks,
  onToggleSelection,
  onToggleExpansion,
  onToggleCompletion,
  onTogglePinTask,
  onRemoveTask,
  onCreateSubTask,
  onEditTask,
  onAssignToProject,
  onToggleRecurring,
}) => {
  const { projects } = useProjects();
  const hasSubTasks = subTasks.length > 0;
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // La tâche reste dépliée si hover OU si le menu est ouvert
  const isExpanded = isHovered || isMenuOpen;

  return (
    <SidebarMenuItem
      className={cn(
        'group relative flex items-center rounded-md transition-all duration-200 overflow-hidden',
        'hover:bg-sidebar-accent/60',
        'border-b border-sidebar-border/40',
        'mb-0.5 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dégradé épinglé à gauche */}
      {isPinned && (
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-amber-200/50 to-transparent dark:from-amber-600/30 dark:to-transparent pointer-events-none" />
      )}
      
      {/* Dégradé récurrent à droite */}
      {isRecurring && (
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-blue-200/40 to-transparent dark:from-blue-600/25 dark:to-transparent pointer-events-none" />
      )}

      {/* Barre de couleur catégorie - collée au bord gauche */}
      <div
        className={cn(
          'w-1 self-stretch rounded-l-md shrink-0 z-10',
          getCategoryColor(task.category)
        )}
      />

      {/* Contenu principal - layout vertical au hover */}
      <div className="flex flex-col flex-1 min-w-0 py-2 pl-2 pr-1">
        {/* Ligne du texte */}
        <div className="flex items-start gap-1 w-full">
          {/* Expand/collapse pour sous-tâches - toujours visible si a des sous-tâches */}
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

          {/* Icône épingle pour tâches épinglées - visible quand plié */}
          {isPinned && !isExpanded && (
            <Pin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          )}

          {/* Texte - priorité maximale, visible en entier au hover */}
          <p
            className={cn(
              'text-sm leading-tight flex-1 min-w-0 transition-all duration-200',
              task.isCompleted && 'line-through text-muted-foreground',
              isExpanded ? 'whitespace-normal break-words' : 'truncate'
            )}
          >
            {task.name}
          </p>

          {/* Indicateur récurrent - visible seulement si récurrent et pas en hover */}
          {isRecurring && !isExpanded && (
            <RefreshCw className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
          )}
        </div>

        {/* Métadonnées et actions - SOUS le texte, visible au hover */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1.5 transition-all duration-200',
            isExpanded ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden'
          )}
        >
          {/* Temps estimé */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Clock className="w-3 h-3" />
            <span>{formatTime(totalTime)}</span>
          </div>

          {/* Badge sous-tâches */}
          {hasSubTasks && (
            <span className="text-[10px] bg-muted px-1 rounded whitespace-nowrap">
              +{subTasks.length}
            </span>
          )}

          {/* Indicateur récurrent au hover */}
          {isRecurring && (
            <RefreshCw className="w-3 h-3 text-blue-500" />
          )}

          {/* Spacer pour pousser checkbox et menu à droite */}
          <div className="flex-1" />

          {/* Checkbox */}
          <Checkbox
            checked={task.isCompleted}
            onCheckedChange={() => onToggleCompletion(task.id)}
            className="h-4 w-4"
          />

          {/* Menu d'actions (3 points) */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
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

              {/* Option Récurrence */}
              {onToggleRecurring && (
                <DropdownMenuItem onClick={() => onToggleRecurring(task.id, task.name, totalTime)}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", isRecurring && "text-blue-500")} />
                  {isRecurring ? 'Retirer récurrence' : 'Rendre récurrent'}
                </DropdownMenuItem>
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
