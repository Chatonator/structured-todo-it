import React from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Divide, CheckSquare, X, Edit, Briefcase } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

interface TaskItemActionsProps {
  task: Task;
  canHaveSubTasks: boolean;
  isVisible: boolean;
  onCreateSubTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleCompletion: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onAssignToProject?: (taskId: string, projectId: string) => Promise<boolean>;
}

const TaskItemActions: React.FC<TaskItemActionsProps> = ({
  task,
  canHaveSubTasks,
  isVisible,
  onCreateSubTask,
  onEditTask,
  onToggleCompletion,
  onRemoveTask,
  onAssignToProject
}) => {
  const { activeProjects } = useProjects();
  const { toast } = useToast();
  const projects = activeProjects();

  const handleAssignToProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onAssignToProject) return;
    
    const success = await onAssignToProject(task.id, projectId);
    if (success) {
      toast({
        title: "Tâche ajoutée au projet",
        description: `"${task.name}" a été ajoutée à "${projectName}"`,
      });
    }
  };

  return (
    <div 
      className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
    >
      {/* Menu projet - seulement pour les tâches principales sans projet */}
      {task.level === 0 && !task.projectId && onAssignToProject && projects.length > 0 && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Ajouter à un projet"
            >
              <Briefcase className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Ajouter à un projet</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.map((project) => (
              <DropdownMenuItem 
                key={project.id}
                onClick={(e) => handleAssignToProject(e, project.id, project.name)}
              >
                <span className="mr-2">{project.icon || '📚'}</span>
                <span className="truncate">{project.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {canHaveSubTasks && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCreateSubTask(task)}
          className="h-6 w-6 p-0"
          title="Diviser"
        >
          <Divide className="w-3 h-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEditTask(task)}
        className="h-6 w-6 p-0"
        title="Modifier"
      >
        <Edit className="w-3 h-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggleCompletion(task.id)}
        className="h-6 w-6 p-0 text-system-success hover:text-system-success/80"
        title="Terminer"
      >
        <CheckSquare className="w-3 h-3" />
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onRemoveTask(task.id)}
        className="h-6 w-6 p-0"
        title="Supprimer"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default TaskItemActions;
