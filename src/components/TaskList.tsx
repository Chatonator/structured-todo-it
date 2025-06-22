
import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG, TASK_LEVELS } from '@/types/task';
import { Clock, X, ArrowUpDown, GripVertical, ChevronDown, ChevronRight, Divide, CheckSquare, Square, Plus, Pin, PinOff, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import TaskModal from './TaskModal';

interface TaskListProps {
  tasks: Task[];
  mainTasks: Task[];
  pinnedTasks: string[];
  onRemoveTask: (taskId: string) => void;
  onReorderTasks: (startIndex: number, endIndex: number) => void;
  onSortTasks: (sortBy: 'name' | 'duration' | 'category') => void;
  onToggleExpansion: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  canHaveSubTasks: (task: Task) => boolean;
  selectedTasks: string[];
  onToggleSelection: (taskId: string) => void;
  // Historique
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks,
  mainTasks,
  pinnedTasks,
  onRemoveTask, 
  onReorderTasks, 
  onSortTasks,
  onToggleExpansion,
  onToggleCompletion,
  onTogglePinTask,
  onAddTask,
  getSubTasks,
  calculateTotalTime,
  canHaveSubTasks,
  selectedTasks,
  onToggleSelection,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderTasks(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleCreateSubTasks = (parentTask: Task) => {
    setSelectedParentTask(parentTask);
    setIsSubTaskModalOpen(true);
  };

  const renderTask = (task: Task, depth: number = 0): React.ReactNode => {
    const categoryConfig = CATEGORY_CONFIG[task.category];
    const subCategoryConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
    const contextConfig = CONTEXT_CONFIG[task.context];
    const levelConfig = TASK_LEVELS[task.level];
    const subTasks = getSubTasks(task.id);
    const hasSubTasks = subTasks.length > 0;
    const totalTime = calculateTotalTime(task);
    const isSelected = selectedTasks.includes(task.id);
    const isPinned = pinnedTasks.includes(task.id);

    // Réduction de l'indentation pour optimiser l'espace
    const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-2' : 'ml-4';

    return (
      <div key={task.id} className={indentClass}>
        <div
          draggable={task.level === 0}
          onDragStart={(e) => task.level === 0 && handleDragStart(e, mainTasks.findIndex(t => t.id === task.id))}
          onDragOver={task.level === 0 ? handleDragOver : undefined}
          onDrop={(e) => task.level === 0 && handleDrop(e, mainTasks.findIndex(t => t.id === task.id))}
          className={`
            group flex items-center p-2 border rounded-md 
            hover:shadow-sm transition-all mb-1 text-xs task-item
            ${categoryConfig.borderPattern} ${levelConfig.bgColor}
            ${task.level === 0 ? 'cursor-move' : ''}
            ${draggedIndex === mainTasks.findIndex(t => t.id === task.id) ? 'opacity-50' : ''}
            ${task.isCompleted ? 'opacity-60 bg-gray-100 dark:bg-gray-800' : ''}
            ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-theme-border'}
            ${isPinned ? 'task-pinned' : ''}
            bg-theme-background
          `}
        >
          {/* Bouton d'épinglage (seulement pour les tâches principales) */}
          {task.level === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTogglePinTask(task.id)}
              className="h-4 w-4 p-0 mr-1 text-gray-500 hover:text-yellow-600"
              title="Épingler"
            >
              {isPinned ? 
                <PinOff className="w-3 h-3 text-yellow-600" /> : 
                <Pin className="w-3 h-3" />
              }
            </Button>
          )}

          {/* Bouton de sélection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSelection(task.id)}
            className="h-4 w-4 p-0 mr-1 text-gray-500 hover:text-blue-600"
          >
            {isSelected ? 
              <CheckSquare className="w-3 h-3 text-blue-600" /> : 
              <Square className="w-3 h-3" />
            }
          </Button>

          {/* Bouton d'expansion */}
          {hasSubTasks && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(task.id)}
              className="h-4 w-4 p-0 mr-1 text-gray-500"
            >
              {task.isExpanded ? 
                <ChevronDown className="w-2 h-2" /> : 
                <ChevronRight className="w-2 h-2" />
              }
            </Button>
          )}

          {/* Poignée de glissement */}
          {task.level === 0 && (
            <div className="mr-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-2 h-2" />
            </div>
          )}

          {/* Symbole de niveau */}
          <div className="mr-1 text-gray-600 font-bold text-xs">
            {levelConfig.symbol}
          </div>

          {/* Indicateur de catégorie coloré */}
          <div 
            className="w-2 h-2 rounded-full mr-2" 
            style={{ backgroundColor: categoryConfig.cssColor }}
          />

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 mb-0.5">
              <h3 className={`text-xs font-medium truncate task-name ${task.isCompleted ? 'line-through text-theme-muted' : 'text-theme-foreground'}`}>
                {task.name}
              </h3>
              {/* Badge contexte */}
              <span className={`
                inline-flex items-center px-1 py-0.5 rounded text-xs font-medium
                ${contextConfig.color} dark:${contextConfig.colorDark}
              `}>
                {task.context}
              </span>
            </div>
            
            {subCategoryConfig && (
              <div className="mb-0.5">
                <span className={`
                  inline-flex items-center px-1 py-0.5 rounded text-xs font-medium
                  ${subCategoryConfig.color} dark:${subCategoryConfig.colorDark}
                `}>
                  {subCategoryConfig.priority}★
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-1 text-xs text-theme-muted">
              <Clock className="w-2 h-2" />
              <span>{formatDuration(totalTime)}</span>
              {hasSubTasks && <span>({subTasks.length})</span>}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canHaveSubTasks(task) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreateSubTasks(task)}
                className="h-4 w-4 p-0 text-blue-500 hover:text-blue-700"
                title="Diviser"
              >
                <Divide className="w-2 h-2" />
              </Button>
            )}
            {/* Bouton Terminer */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleCompletion(task.id)}
              className="h-4 w-4 p-0 text-green-500 hover:text-green-700"
              title="Terminer"
            >
              <CheckSquare className="w-2 h-2" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveTask(task.id)}
              className="h-4 w-4 p-0 text-gray-400 hover:text-red-500"
            >
              <X className="w-2 h-2" />
            </Button>
          </div>
        </div>

        {/* Sous-tâches */}
        {hasSubTasks && task.isExpanded && (
          <div className="mt-1">
            {subTasks.map(subTask => renderTask(subTask, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (mainTasks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-4">
            <div className="text-gray-400 mb-2">
              <Clock className="w-6 h-6 mx-auto mb-2" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Aucune tâche</h3>
            <p className="text-xs text-gray-400">Créez votre première tâche !</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* En-tête avec tri, actions et historique */}
      <div className="flex items-center justify-between pb-2 border-b bg-theme-background px-1">
        <h2 className="text-sm font-semibold text-theme-foreground">
          Tâches ({tasks.length})
        </h2>
        <div className="flex items-center space-x-1">
          {/* Boutons historique */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 disabled:opacity-50"
            title="Annuler (Ctrl+Z)"
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 disabled:opacity-50"
            title="Refaire (Ctrl+Y)"
          >
            <Redo className="w-3 h-3" />
          </Button>
          
          <Select onValueChange={(value) => onSortTasks(value as 'name' | 'duration' | 'category')}>
            <SelectTrigger className="w-16 h-6 text-xs border-theme-border bg-theme-background text-theme-foreground">
              <ArrowUpDown className="w-2 h-2" />
            </SelectTrigger>
            <SelectContent className="bg-theme-background border-theme-border z-50">
              <SelectItem value="name" className="text-theme-foreground">Nom</SelectItem>
              <SelectItem value="duration" className="text-theme-foreground">Durée</SelectItem>
              <SelectItem value="category" className="text-theme-foreground">Catégorie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des tâches avec scroll */}
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-1">
          {mainTasks.map(task => renderTask(task))}
        </div>
      </ScrollArea>

      {/* Modale pour sous-tâches */}
      {selectedParentTask && (
        <TaskModal
          isOpen={isSubTaskModalOpen}
          onClose={() => {
            setIsSubTaskModalOpen(false);
            setSelectedParentTask(null);
          }}
          onAddTask={(taskData) => {
            onAddTask({
              ...taskData,
              parentId: selectedParentTask.id,
              level: (selectedParentTask.level + 1) as 0 | 1 | 2
            });
            setIsSubTaskModalOpen(false);
            setSelectedParentTask(null);
          }}
          parentTask={selectedParentTask}
        />
      )}
    </div>
  );
};

export default TaskList;
