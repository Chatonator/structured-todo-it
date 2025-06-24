
import React from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Divide, CheckSquare, X } from 'lucide-react';

interface TaskItemActionsProps {
  task: Task;
  canHaveSubTasks: boolean;
  isVisible: boolean;
  onCreateSubTask: (task: Task) => void;
  onToggleCompletion: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
}

const TaskItemActions: React.FC<TaskItemActionsProps> = ({
  task,
  canHaveSubTasks,
  isVisible,
  onCreateSubTask,
  onToggleCompletion,
  onRemoveTask
}) => {
  return (
    <div 
      className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
    >
      {canHaveSubTasks && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCreateSubTask(task)}
          className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
          title="Diviser"
        >
          <Divide className="w-3 h-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggleCompletion(task.id)}
        className="h-6 w-6 p-0 text-green-500 hover:text-green-700"
        title="Terminer"
      >
        <CheckSquare className="w-3 h-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemoveTask(task.id)}
        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
        title="Supprimer"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default TaskItemActions;
