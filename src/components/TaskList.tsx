
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
            hover:shadow-sm transition-all mb-1
            ${categoryConfig.pattern} ${levelConfig.bgColor}
            ${task.level === 0 ? 'cursor-move' : ''}
            ${draggedIndex === mainTasks.findIndex(t => t.id === task.id) ? 'opacity-50' : ''}
          `}
        >
          {/* Bouton d'expansion pour les tâches avec sous-tâches */}
          {hasSubTasks && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(task.id)}
              className="h-6 w-6 p-0 mr-1 text-gray-500"
            >
              {task.isExpanded ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
            </Button>
          )}

          {/* Poignée de glissement pour les tâches principales */}
          {task.level === 0 && (
            <div className="mr-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3" />
            </div>
          )}

          {/* Symbole de niveau */}
          <div className="mr-2 text-gray-600 font-bold">
            {levelConfig.symbol}
          </div>

          {/* Icône de catégorie */}
          <div className="mr-2 text-sm">
            {categoryConfig.icon}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {task.name}
              </h3>
              <span className={`
                inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                ${categoryConfig.color} ${categoryConfig.shape}
              `}>
                {task.category}
              </span>
              {/* Affichage de la sous-catégorie pour les sous-tâches */}
              {subCategoryConfig && (
                <span className={`
                  inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                  ${subCategoryConfig.color} ${subCategoryConfig.shape}
                `}>
                  {subCategoryConfig.icon} {task.subCategory}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(totalTime)}
                {hasSubTasks && ` (${subTasks.length} sous-tâche${subTasks.length > 1 ? 's' : ''})`}
              </span>
              <span>•</span>
              <span>{formatCreatedAt(task.createdAt)}</span>
            </div>
          </div>

          {/* Bouton pour créer des sous-tâches */}
          {canHaveSubTasks(task) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateSubTasks(task)}
              className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-all mr-1"
              title="Diviser en sous-tâches"
            >
              <Divide className="w-3 h-3" />
            </Button>
          )}

          {/* Bouton de suppression */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveTask(task.id)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Affichage des sous-tâches */}
        {hasSubTasks && task.isExpanded && (
          <div className="ml-4 mt-1">
            {subTasks.map(subTask => renderTask(subTask, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (mainTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <Clock className="w-8 h-8 mx-auto mb-2" />
        </div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">Aucune tâche</h3>
        <p className="text-xs text-gray-400">Créez votre première tâche !</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* En-tête avec tri */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Tâches ({tasks.length})
        </h2>
        <Select onValueChange={(value) => onSortTasks(value as 'name' | 'duration' | 'category')}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Par nom</SelectItem>
            <SelectItem value="duration">Par durée</SelectItem>
            <SelectItem value="category">Par catégorie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des tâches principales */}
      {mainTasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Clock className="w-8 h-8 mx-auto mb-2" />
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Aucune tâche</h3>
          <p className="text-xs text-gray-400">Créez votre première tâche !</p>
        </div>
      ) : (
        <div className="space-y-1">
          {mainTasks.map(task => renderTask(task))}
        </div>
      )}

      {/* Statistiques compactes */}
      {tasks.length > 0 && (
        <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Temps total projet : {formatDuration(mainTasks.reduce((sum, task) => sum + calculateTotalTime(task), 0))}
            </span>
            <div className="flex space-x-2">
              {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                const count = tasks.filter(task => task.category === category).length;
                if (count === 0) return null;
                
                return (
                  <span key={category} className="flex items-center space-x-1">
                    <span>{config.icon}</span>
                    <span className="text-gray-600">{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modale pour créer des sous-tâches */}
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
