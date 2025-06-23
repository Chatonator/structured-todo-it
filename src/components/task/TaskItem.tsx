
import React from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG, TASK_LEVELS } from '@/types/task';
import { Clock, X, ChevronDown, ChevronRight, Divide, CheckSquare, Square, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

/**
 * Composant pour afficher une tâche individuelle
 * Sépare la logique d'affichage de la logique de liste
 */
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
  const categoryConfig = CATEGORY_CONFIG[task.category];
  const subCategoryConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
  const contextConfig = CONTEXT_CONFIG[task.context];
  const levelConfig = TASK_LEVELS[task.level];
  const hasSubTasks = subTasks.length > 0;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-3' : 'ml-6';
  const isExtended = isSelected || forceExtended;

  return (
    <div className={indentClass}>
      <div
        draggable={task.level === 0}
        onDragStart={(e) => task.level === 0 && onDragStart?.(e, taskIndex || 0)}
        onDragOver={task.level === 0 ? onDragOver : undefined}
        onDrop={(e) => task.level === 0 && onDrop?.(e, taskIndex || 0)}
        className={`
          group flex items-start gap-2 p-3 border rounded-lg 
          hover:shadow-sm transition-all mb-1 text-sm task-item
          ${categoryConfig.borderPattern} ${levelConfig.bgColor}
          ${task.level === 0 ? 'cursor-move' : ''}
          ${dragIndex === taskIndex ? 'opacity-50' : ''}
          ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20 border-l-blue-500 border-l-8' : 'border-l-6'}
          ${isPinned ? 'task-pinned border-l-yellow-500 border-l-8' : ''}
          bg-theme-background
        `}
      >
        {/* Contrôles à gauche */}
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          {/* Épinglage - seulement pour les tâches principales */}
          {task.level === 0 && (isExtended || isSelected || forceExtended) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTogglePinTask(task.id)}
              className="h-5 w-5 p-0 text-gray-500 hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Épingler"
            >
              {isPinned ? 
                <PinOff className="w-3 h-3 text-yellow-600" /> : 
                <Pin className="w-3 h-3" />
              }
            </Button>
          )}

          {/* Sélection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSelection(task.id)}
            className="h-5 w-5 p-0 text-gray-500 hover:text-blue-600"
          >
            {isSelected ? 
              <CheckSquare className="w-3 h-3 text-blue-600" /> : 
              <Square className="w-3 h-3" />
            }
          </Button>

          {/* Expansion pour les tâches avec sous-tâches */}
          {hasSubTasks && (isExtended || isSelected || forceExtended) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(task.id)}
              className="h-5 w-5 p-0 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {task.isExpanded ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
            </Button>
          )}
        </div>

        {/* Contenu principal - titre + infos conditionnelles */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Titre de la tâche - limité à 3 lignes */}
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-theme-foreground text-sm leading-tight flex-1 min-w-0 line-clamp-3 break-words">
              {task.name}
            </h3>
          </div>
          
          {/* Informations détaillées - seulement en mode étendu ou hover */}
          {(isExtended || isSelected || forceExtended) && (
            <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity group-hover:delay-200" 
                 style={{ opacity: isSelected || forceExtended ? 1 : undefined }}>
              <div className="flex items-center gap-3 text-xs text-theme-muted">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(totalTime)}</span>
                </div>
                {hasSubTasks && (
                  <span className="bg-theme-accent px-1.5 py-0.5 rounded">
                    {subTasks.length} tâche{subTasks.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* Badges - plus compacts */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Badge contexte */}
                <span className={`
                  inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                  ${contextConfig.color} dark:${contextConfig.colorDark}
                `}>
                  {task.context}
                </span>
                {/* Badge priorité */}
                {subCategoryConfig && (
                  <span className={`
                    inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                    ${subCategoryConfig.color} dark:${subCategoryConfig.colorDark}
                  `}>
                    {subCategoryConfig.priority}★
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions à droite - seulement en mode étendu ou hover */}
        {(isExtended || isSelected || forceExtended) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
               style={{ opacity: isSelected || forceExtended ? 1 : undefined }}>
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
        )}
      </div>
    </div>
  );
};

export default TaskItem;
