
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
  isDragOver?: boolean;
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
  taskIndex,
  isDragOver = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const categoryConfig = CATEGORY_CONFIG[task.category];
  const levelConfig = TASK_LEVELS[task.level];
  const hasSubTasks = subTasks.length > 0;
  
  const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-3' : 'ml-6';
  const isExtended = isSelected || forceExtended || isHovered;

  const handleDragStart = (e: React.DragEvent) => {
    if (task.level === 0) {
      setIsDragging(true);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
      // Créer une image de drag personnalisée
      const dragImage = document.createElement('div');
      dragImage.innerHTML = task.name;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.background = categoryConfig.cssColor;
      dragImage.style.color = 'white';
      dragImage.style.padding = '8px 12px';
      dragImage.style.borderRadius = '6px';
      dragImage.style.fontSize = '14px';
      dragImage.style.fontWeight = '500';
      dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
      
      onDragStart?.(e, taskIndex || 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (task.level === 0) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver?.(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (task.level === 0) {
      e.preventDefault();
      onDrop?.(e, taskIndex || 0);
    }
  };

  return (
    <div className={indentClass}>
      <div
        draggable={task.level === 0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group flex items-start gap-2 p-3 border rounded-lg 
          transition-all duration-200 mb-1 text-sm task-item
          ${categoryConfig.borderPattern} ${levelConfig.bgColor}
          ${task.level === 0 ? 'cursor-move' : ''}
          ${isDragging ? 'opacity-30 scale-95 rotate-2 shadow-2xl' : ''}
          ${isDragOver && !isDragging ? 'transform scale-102 shadow-lg border-blue-400' : ''}
          ${dragIndex === taskIndex && !isDragging ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300' : ''}
          ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-blue-500 border-l-8' : 'border-l-8'}
          ${isPinned ? 'task-pinned border-l-yellow-500 border-l-8' : ''}
          ${isHovered && !isDragging ? 'shadow-md transform translateY-0.5' : 'hover:shadow-sm'}
          bg-theme-background
        `}
        style={{
          borderLeftColor: !isSelected && !isPinned ? categoryConfig.cssColor : undefined,
          transform: isDragging ? 'rotate(3deg) scale(0.95)' : undefined
        }}
      >
        {/* Indicateur de drop zone */}
        {isDragOver && !isDragging && (
          <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none animate-pulse" />
        )}

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
        {isExtended && !isDragging && (
          <TaskItemActions
            task={task}
            canHaveSubTasks={canHaveSubTasks}
            isVisible={isExtended}
            onCreateSubTask={onCreateSubTask}
            onToggleCompletion={onToggleCompletion}
            onRemoveTask={onRemoveTask}
          />
        )}

        {/* Icône de drag visible au hover */}
        {task.level === 0 && isHovered && !isDragging && (
          <div className="absolute right-2 top-2 text-gray-400 opacity-60">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h.01a1 1 0 010 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h.01a1 1 0 010 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h.01a1 1 0 010 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h.01a1 1 0 010 2H4a1 1 0 01-1-1zM7 4a1 1 0 011-1h.01a1 1 0 010 2H8a1 1 0 01-1-1zM7 8a1 1 0 011-1h.01a1 1 0 010 2H8a1 1 0 01-1-1zM7 12a1 1 0 011-1h.01a1 1 0 010 2H8a1 1 0 01-1-1zM7 16a1 1 0 011-1h.01a1 1 0 010 2H8a1 1 0 01-1-1z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
