
import React, { useState, useMemo } from 'react';
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
  onEditTask,
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
  const cssName = CATEGORY_CSS_NAMES[task.category];
  const levelConfig = TASK_LEVELS[task.level];
  const hasSubTasks = subTasks.length > 0;
  
  const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-3' : 'ml-6';
  const isExtended = isSelected || forceExtended || isHovered;


  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Image de drag avec classes Tailwind inlines
    const dragImage = document.createElement('div');
    dragImage.className = 'fixed opacity-0 pointer-events-none';
    dragImage.innerHTML = `
      <div class="bg-primary text-white px-4 py-3 rounded-lg text-sm font-semibold shadow-2xl transform rotate-2 scale-105 flex items-center gap-2 min-w-[200px]">
        <span class="text-base">${task.level > 0 ? '📋' : '📅'}</span>
        <span>${task.name}</span>
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 100, 25);
    setTimeout(() => document.body.removeChild(dragImage), 100);
    
    // Permettre le drag pour toutes les tâches (y compris sous-tâches)
    onDragStart?.(e, taskIndex || 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Permettre le drop pour toutes les tâches
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    // Permettre le drop pour toutes les tâches
    e.preventDefault();
    onDrop?.(e, taskIndex || 0);
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
          group flex items-start gap-2 p-3 md:p-3 border rounded-lg 
          transition-all duration-300 mb-1 text-sm md:text-sm task-item relative
          border-l-4 md:border-l-8
          min-h-[44px]
          ${isSelected ? 'bg-accent border-l-primary shadow-md ring-2 ring-primary/20' : `bg-card border-l-category-${cssName}`}
          ${isPinned && !isSelected ? 'border-l-pinned shadow-sm ring-1 ring-pinned/30' : ''}
          ${!task.isCompleted ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-default'}
          ${isDragging ? 'opacity-30 scale-95 rotate-2 z-50' : ''}
          ${isDragOver && !isDragging ? 'scale-102' : ''}
          ${dragIndex === taskIndex && !isDragging ? 'bg-accent border-primary' : ''}
          border-border text-foreground
        `}
        data-category={task.category}
      >
        {/* Indicateur de drop zone */}
        {isDragOver && !isDragging && (
          <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg pointer-events-none animate-pulse bg-accent/20" />
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
            onEditTask={onEditTask}
            onToggleCompletion={onToggleCompletion}
            onRemoveTask={onRemoveTask}
          />
        )}

        {/* SUPPRIMÉ : Indicateur de drag "Glisser vers calendrier" */}
      </div>
    </div>
  );
};

export default TaskItem;
