
import React, { useState, useMemo } from 'react';
import { Task, CATEGORY_CONFIG, TASK_LEVELS, CATEGORY_CSS_NAMES } from '@/types/task';
import TaskItemControls from './TaskItemControls';
import TaskItemContent from './TaskItemContent';
import TaskItemActions from './TaskItemActions';
import { cssVarRGB } from '@/utils/colors';

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
  const cssName = CATEGORY_CSS_NAMES[task.category];
  const levelConfig = TASK_LEVELS[task.level];
  const hasSubTasks = subTasks.length > 0;
  
  const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-3' : 'ml-6';
  const isExtended = isSelected || forceExtended || isHovered;

  // Mémorisation des couleurs résolues avec fallback
  const resolvedCategoryColor = useMemo(() => {
    const color = cssVarRGB(`--color-${cssName}`);
    console.log(`Couleur résolue pour ${task.category}:`, color);
    return color;
  }, [cssName]);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Image de drag améliorée avec plus de style
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `
      <div style="
        background: ${resolvedCategoryColor};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        transform: rotate(2deg) scale(1.05);
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 200px;
      ">
        <span style="font-size: 16px;">📅</span>
        <span>${task.name}</span>
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 100, 25);
    setTimeout(() => document.body.removeChild(dragImage), 100);
    
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

  // Styles inline avec couleurs résolues
  const inlineStyles = useMemo(() => ({
    borderLeftColor: !isSelected && !isPinned ? resolvedCategoryColor : undefined,
    boxShadow: isHovered && !isDragging 
      ? `0 8px 25px -5px ${resolvedCategoryColor}40, 0 4px 6px -2px ${resolvedCategoryColor}1A`
      : isDragging 
      ? `0 20px 40px -10px ${resolvedCategoryColor}99`
      : `0 1px 3px 0 ${resolvedCategoryColor}33`
  }), [resolvedCategoryColor, isHovered, isDragging, isSelected, isPinned]);

  // Construction des classes CSS harmonisées
  const borderColorClass = isSelected 
    ? 'border-l-primary' 
    : isPinned 
    ? 'border-l-system-warning' 
    : 'border-l-8'; // On force la taille avec une couleur inline

  const backgroundClass = isSelected 
    ? 'bg-accent' 
    : levelConfig.bgColor === 'bg-white' 
    ? 'bg-background' 
    : levelConfig.bgColor === 'bg-gray-50' 
    ? 'bg-accent' 
    : 'bg-muted';

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
          transition-all duration-300 mb-1 text-sm task-item relative
          ${borderColorClass} ${backgroundClass}
          ${!task.isCompleted ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
          ${isDragging ? 'opacity-30 scale-95 rotate-2 z-50' : ''}
          ${isDragOver && !isDragging ? 'scale-102 ring-2 ring-primary' : ''}
          ${dragIndex === taskIndex && !isDragging ? 'bg-accent border-primary' : ''}
          border-border
        `}
        data-category={task.category}
        style={inlineStyles}
      >
        {/* Indicateur de drop zone */}
        {isDragOver && !isDragging && (
          <div className="absolute inset-0 bg-drop-zone-light border-2 border-dashed border-drop-zone rounded-lg pointer-events-none animate-pulse" />
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
          <div className="absolute right-2 top-2 text-primary opacity-70 animate-bounce">
            <div className="flex items-center gap-1 text-xs font-medium bg-background border border-border px-2 py-1 rounded-full shadow-md">
              <span className="text-sm">📅</span>
              <span>Glisser vers calendrier</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
