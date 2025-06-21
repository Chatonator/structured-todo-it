import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, TASK_LEVELS } from '@/types/task';
import { Clock, X, ArrowUpDown, GripVertical, ChevronDown, ChevronRight, Divide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskModal from './TaskModal';

interface TaskListProps {
  tasks: Task[];
  mainTasks: Task[];
  onRemoveTask: (taskId: string) => void;
  onReorderTasks: (startIndex: number, endIndex: number) => void;
  onSortTasks: (sortBy: 'name' | 'duration' | 'category') => void;
  onToggleExpansion: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  canHaveSubTasks: (task: Task) => boolean;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks,
  mainTasks,
  onRemoveTask, 
  onReorderTasks, 
  onSortTasks,
  onToggleExpansion,
  onAddTask,
  getSubTasks,
  calculateTotalTime,
  canHaveSubTasks
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);

  // Formater la durée pour l'affichage
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Formater la date de création
  const formatCreatedAt = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
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
    const levelConfig = TASK_LEVELS[task.level];
    const subTasks = getSubTasks(task.id);
    const hasSubTasks = subTasks.length > 0;
    const totalTime = calculateTotalTime(task);

    return (
      <div key={task.id} className={levelConfig.indent}>
        <div
          draggable={task.level === 0} // Seules les tâches principales sont déplaçables
          onDragStart={(e) => task.level === 0 && handleDragStart(e, mainTasks.findIndex(t => t.id === task.id))}
          onDragOver={task.level === 0 ? handleDragOver : undefined}
          onDrop={(e) => task.level === 0 && handleDrop(e, mainTasks.findIndex(t => t.id === task.id))}
          className={`
            group flex items-center p-2 border border-gray-200 rounded-md 
            hover:shadow-sm transition-all mb-1 text-xs
            ${categoryConfig.pattern} ${levelConfig.bgColor}
            ${task.level === 0 ? 'cursor-move' : ''}
            ${draggedIndex === mainTasks.findIndex(t => t.id === task.id) ? 'opacity-50' : ''}
            ${task.isCompleted ? 'opacity-60 bg-gray-100' : ''}
          `}
        >
          {/* Bouton d'expansion */}
          {hasSubTasks && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(task.id)}
              className="h-5 w-5 p-0 mr-1 text-gray-500"
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

          {/* Icône de catégorie */}
          <div className="mr-1 text-xs">
            {categoryConfig.icon}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h3 className="text-xs font-medium text-gray-900 truncate">
                {task.name}
              </h3>
              {subCategoryConfig && (
                <span className={`
                  inline-flex items-center px-1 py-0.5 rounded text-xs font-medium
                  ${subCategoryConfig.color}
                `}>
                  {subCategoryConfig.icon}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1 mt-0.5 text-xs text-gray-500">
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
                className="h-5 w-5 p-0 text-blue-500 hover:text-blue-700"
                title="Diviser"
              >
                <Divide className="w-2 h-2" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveTask(task.id)}
              className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
            >
              <X className="w-2 h-2" />
            </Button>
          </div>
        </div>

        {/* Sous-tâches */}
        {hasSubTasks && task.isExpanded && (
          <div className="ml-3 mt-1">
            {subTasks.map(subTask => renderTask(subTask, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (mainTasks.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-400 mb-2">
          <Clock className="w-6 h-6 mx-auto mb-2" />
        </div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">Aucune tâche</h3>
        <p className="text-xs text-gray-400">Créez votre première tâche !</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* En-tête compact avec tri */}
      <div className="flex items-center justify-between pb-2 border-b">
        <h2 className="text-sm font-semibold text-gray-800">
          Tâches ({tasks.length})
        </h2>
        <Select onValueChange={(value) => onSortTasks(value as 'name' | 'duration' | 'category')}>
          <SelectTrigger className="w-20 h-6 text-xs">
            <ArrowUpDown className="w-2 h-2" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="duration">Durée</SelectItem>
            <SelectItem value="category">Catégorie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des tâches */}
      <div className="space-y-1">
        {mainTasks.map(task => renderTask(task))}
      </div>

      {/* Modale pour sous-tâches */}
      <TaskModal
        isOpen={isSubTaskModalOpen}
        onClose={() => {
          setIsSubTaskModalOpen(false);
          setSelectedParentTask(null);
        }}
        onAddTask={onAddTask}
        parentTask={selectedParentTask || undefined}
      />
    </div>
  );
};

export default TaskList;
