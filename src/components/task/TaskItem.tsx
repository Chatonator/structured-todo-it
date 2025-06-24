
import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, TASK_LEVELS } from '@/types/task';
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
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  dragIndex?: number;
  taskIndex?: number;
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
  onDragStart,
  onDragOver,
  onDrop,
  dragIndex,
  taskIndex
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const categoryConfig = CATEGORY_CONFIG[task.category];
  const levelConfig = TASK_LEVELS[task.level];
  const hasSubTasks = subTasks.length > 0;
  
  const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-3' : 'ml-6';
  const isExtended = isSelected || forceExtended || isHovered;

  return (
    <div className={indentClass}>
      <div
        draggable={task.level === 0}
        onDragStart={(e) => task.level === 0 && onDragStart?.(e, taskIndex || 0)}
        onDragOver={task.level === 0 ? onDragOver : undefined}
        onDrop={(e) => task.level === 0 && onDrop?.(e, taskIndex || 0)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group flex items-start gap-2 p-3 border rounded-lg 
          hover:shadow-sm transition-all mb-1 text-sm task-item
          ${categoryConfig.borderPattern} ${levelConfig.bgColor}
          ${task.level === 0 ? 'cursor-move' : ''}
          ${dragIndex === taskIndex ? 'opacity-50' : ''}
          ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-blue-500 border-l-8' : 'border-l-8'}
          ${isPinned ? 'task-pinned border-l-yellow-500 border-l-8' : ''}
          bg-theme-background
        `}
        style={{
          borderLeftColor: !isSelected && !isPinned ? categoryConfig.cssColor : undefined
        }}
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
            onToggleCompletion={onToggleCompletion}
            onRemoveTask={onRemoveTask}
          />
        )}
      </div>
    </div>
  );
};

export default TaskItem;
