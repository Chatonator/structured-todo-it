import React, { useState } from 'react';
import { Task } from '@/types/task';
import TaskItemControls from './TaskItemControls';
import TaskItemContent from './TaskItemContent';
import TaskItemActions from './TaskItemActions';
import { cn } from '@/lib/utils';
import { getCategoryClasses } from '@/lib/styling';

interface TaskItemProps {
  task: Task;
  subTasks: Task[];
  totalTime: number;
  isSelected: boolean;
  isPinned: boolean;
  canHaveSubTasks: boolean;
  forceExtended?: boolean;
  onToggleSelection: (taskId: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onCreateSubTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onAssignToProject?: (taskId: string, projectId: string) => Promise<boolean>;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  subTasks,
  totalTime,
  isSelected,
  isPinned,
  canHaveSubTasks,
  forceExtended = false,
  onToggleSelection,
  onToggleExpansion,
  onToggleCompletion,
  onTogglePinTask,
  onRemoveTask,
  onCreateSubTask,
  onEditTask,
  onAssignToProject
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const hasSubTasks = subTasks.length > 0;
  
  const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-3' : 'ml-6';
  const isExtended = isSelected || forceExtended || isHovered;

  return (
    <div className={indentClass}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'group relative mb-1 flex min-h-[44px] cursor-default items-start gap-2 rounded-lg border p-3 text-sm text-foreground transition-all duration-300 md:border-l-8 md:p-3 md:text-sm',
          'task-item border-border border-l-4',
          isSelected
            ? 'bg-accent border-l-primary shadow-md ring-2 ring-primary/20'
            : cn('bg-card', getCategoryClasses(task.category, 'border')),
          isPinned && !isSelected && 'border-l-pinned shadow-sm ring-1 ring-pinned/30'
        )}
        data-category={task.category}
      >
        {/* Contrôles à gauche */}
        <TaskItemControls
          task={task}
          hasSubTasks={hasSubTasks}
          isSelected={isSelected}
          isPinned={isPinned}
          isExtended={isExtended}
          onToggleSelection={onToggleSelection}
          onToggleExpansion={onToggleExpansion}
          onTogglePinTask={onTogglePinTask}
        />

        {/* Contenu principal */}
        <TaskItemContent
          task={task}
          subTasks={subTasks}
          totalTime={totalTime}
          isExtended={isExtended}
        />

        {/* Actions à droite */}
        {isExtended && (
          <TaskItemActions
            task={task}
            canHaveSubTasks={canHaveSubTasks}
            isVisible={isExtended}
            onCreateSubTask={onCreateSubTask}
            onEditTask={onEditTask}
            onToggleCompletion={onToggleCompletion}
            onRemoveTask={onRemoveTask}
            onAssignToProject={onAssignToProject}
          />
        )}
      </div>
    </div>
  );
};

export default TaskItem;
