
import React from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckSquare, Square, Pin, PinOff } from 'lucide-react';

interface TaskItemControlsProps {
  task: Task;
  hasSubTasks: boolean;
  isSelected: boolean;
  isPinned: boolean;
  isExtended: boolean;
  onToggleSelection: (taskId: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
}

const TaskItemControls: React.FC<TaskItemControlsProps> = ({
  task,
  hasSubTasks,
  isSelected,
  isPinned,
  isExtended,
  onToggleSelection,
  onToggleExpansion,
  onTogglePinTask
}) => {
  return (
    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
      {/* Épinglage - seulement pour les tâches principales */}
      {task.level === 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTogglePinTask(task.id)}
          className="h-5 w-5 p-0 text-foreground/60 hover:text-foreground"
          title={isPinned ? "Retirer l'épingle" : "Épingler"}
          aria-label={isPinned ? "Retirer l'épingle" : "Épingler"}
        >
          {isPinned ? (
            <PinOff className="w-3 h-3" style={{ color: `rgb(var(--color-pinned))` }} />
          ) : (
            <Pin className="w-3 h-3" />
          )}
        </Button>
      )}

      {/* Sélection */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggleSelection(task.id)}
        className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
      >
        {isSelected ? 
          <CheckSquare className="w-3 h-3 text-primary" /> : 
          <Square className="w-3 h-3" />
        }
      </Button>

      {/* Expansion pour les tâches avec sous-tâches */}
      {hasSubTasks && isExtended && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleExpansion(task.id)}
          className={`h-5 w-5 p-0 text-muted-foreground transition-opacity duration-200 ${
            isExtended ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {task.isExpanded ? 
            <ChevronDown className="w-3 h-3" /> : 
            <ChevronRight className="w-3 h-3" />
          }
        </Button>
      )}
    </div>
  );
};

export default TaskItemControls;
