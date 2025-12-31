import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, TASK_LEVELS, CATEGORY_CSS_NAMES } from '@/types/task';
import { RecurringTaskBadge } from '@/components/RecurringTaskBadge';
import TaskItemControls from './TaskItemControls';
import TaskItemContent from './TaskItemContent';
import TaskItemActions from './TaskItemActions';

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
  
  const categoryConfig = CATEGORY_CONFIG[task.category];
  const cssName = CATEGORY_CSS_NAMES[task.category];
  const levelConfig = TASK_LEVELS[task.level];
  const hasSubTasks = subTasks.length > 0;
  
  const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-3' : 'ml-6';
  const isExtended = isSelected || forceExtended || isHovered;

  return (
    <div className={indentClass}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group flex items-start gap-2 p-3 md:p-3 border rounded-lg 
          transition-all duration-300 mb-1 text-sm md:text-sm task-item relative
          border-l-4 md:border-l-8
          min-h-[44px]
          ${isSelected ? 'bg-accent border-l-primary shadow-md ring-2 ring-primary/20' : `bg-card border-l-category-${cssName}`}
          ${isPinned && !isSelected ? 'border-l-pinned shadow-sm ring-1 ring-pinned/30' : ''}
          cursor-default
          border-border text-foreground
        `}
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
