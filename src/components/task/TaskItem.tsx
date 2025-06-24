
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
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Image de drag améliorée
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `📅 ${task.name}`;
    dragImage.className = 'drag-preview';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.background = categoryConfig.cssColor;
    dragImage.style.color = 'white';
    dragImage.style.padding = '12px 16px';
    dragImage.style.borderRadius = '8px';
    dragImage.style.fontSize = '14px';
    dragImage.style.fontWeight = '600';
    dragImage.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    dragImage.style.transform = 'rotate(2deg) scale(1.05)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    if (task.level === 0) {
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
        draggable={!task.isCompleted}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group flex items-start gap-2 p-3 border rounded-lg 
          transition-all duration-300 mb-1 text-sm task-item
          ${categoryConfig.borderPattern} ${levelConfig.bgColor}
          ${!task.isCompleted ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
          ${isDragging ? 'dragging opacity-30 scale-95 rotate-2' : ''}
          ${isDragOver && !isDragging ? 'drop-zone-active transform scale-102' : ''}
          ${dragIndex === taskIndex && !isDragging ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300' : ''}
          ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-blue-500 border-l-8' : 'border-l-8'}
          ${isPinned ? 'task-pinned border-l-yellow-500 border-l-8' : ''}
          ${isHovered && !isDragging ? 'shadow-lg transform -translate-y-0.5' : 'hover:shadow-md'}
          bg-theme-background
        `}
        style={{
          borderLeftColor: !isSelected && !isPinned ? categoryConfig.cssColor : undefined,
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

        {/* Indicateur de drag pour les tâches actives */}
        {!task.isCompleted && isHovered && !isDragging && (
          <div className="absolute right-2 top-2 text-blue-500 opacity-70 animate-pulse">
            <div className="flex items-center gap-1 text-xs font-medium">
              📅 <span>Glisser</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
