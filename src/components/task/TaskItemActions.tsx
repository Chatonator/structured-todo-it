
import React from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Divide, CheckSquare, X, Edit } from 'lucide-react';
import TaskProjectMenu from './TaskProjectMenu';

interface TaskItemActionsProps {
  task: Task;
  canHaveSubTasks: boolean;
  isVisible: boolean;
  onCreateSubTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleCompletion: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onAssignToProject?: (taskId: string, projectId: string) => Promise<boolean>;
  onConvertToProject?: (task: Task) => void;
}

const TaskItemActions: React.FC<TaskItemActionsProps> = ({
  task,
  canHaveSubTasks,
  isVisible,
  onCreateSubTask,
  onEditTask,
  onToggleCompletion,
  onRemoveTask,
  onAssignToProject,
  onConvertToProject
}) => {
  return (
    <div 
      className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
    >
      {/* Menu projet - seulement pour les tâches principales sans projet */}
      {task.level === 0 && !task.projectId && onAssignToProject && onConvertToProject && (
        <TaskProjectMenu
          task={task}
          onAssignToProject={onAssignToProject}
          onConvertToProject={onConvertToProject}
        />
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
