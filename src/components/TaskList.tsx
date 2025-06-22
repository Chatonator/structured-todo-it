import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG, TASK_LEVELS } from '@/types/task';
import { Clock, X, ArrowUpDown, GripVertical, ChevronDown, ChevronRight, Divide, CheckSquare, Square, Plus, Pin, PinOff, Undo, Redo, Filter, SortAsc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
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
  const [localSearch, setLocalSearch] = useState('');
  const [localCategoryFilter, setLocalCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'duration' | 'category'>('name');

  // Filtrer les tâches non terminées seulement
  const activeTasks = mainTasks.filter(task => !task.isCompleted);
  
  // Appliquer les filtres locaux
  const filteredActiveTasks = activeTasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(localSearch.toLowerCase());
    const matchesCategory = localCategoryFilter === 'all' || task.category === localCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  const handleSort = (newSortBy: 'name' | 'duration' | 'category') => {
    setSortBy(newSortBy);
    onSortTasks(newSortBy);
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
    const subTasks = getSubTasks(task.id).filter(t => !t.isCompleted); // Exclure les sous-tâches terminées
    const hasSubTasks = subTasks.length > 0;
    const totalTime = calculateTotalTime(task);
    const isSelected = selectedTasks.includes(task.id);
    const isPinned = pinnedTasks.includes(task.id);

    const indentClass = task.level === 0 ? 'ml-0' : task.level === 1 ? 'ml-3' : 'ml-6';

    return (
      <div key={task.id} className={indentClass}>
        <div
          draggable={task.level === 0}
          onDragStart={(e) => task.level === 0 && handleDragStart(e, activeTasks.findIndex(t => t.id === task.id))}
          onDragOver={task.level === 0 ? handleDragOver : undefined}
          onDrop={(e) => task.level === 0 && handleDrop(e, activeTasks.findIndex(t => t.id === task.id))}
          className={`
            group flex items-center gap-2 p-2 border rounded-lg 
            hover:shadow-sm transition-all mb-1 text-sm task-item
            ${categoryConfig.borderPattern} ${levelConfig.bgColor}
            ${task.level === 0 ? 'cursor-move' : ''}
            ${draggedIndex === activeTasks.findIndex(t => t.id === task.id) ? 'opacity-50' : ''}
            ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-theme-border'}
            ${isPinned ? 'task-pinned' : ''}
            bg-theme-background
          `}
        >
          {/* Contrôles à gauche */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Épinglage */}
            {task.level === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePinTask(task.id)}
                className="h-5 w-5 p-0 text-gray-500 hover:text-yellow-600"
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

            {/* Expansion */}
            {hasSubTasks && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleExpansion(task.id)}
                className="h-5 w-5 p-0 text-gray-500"
              >
                {task.isExpanded ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
              </Button>
            )}

            {/* Poignée */}
            {task.level === 0 && (
              <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Indicateurs visuels */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-gray-600">{levelConfig.symbol}</span>
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: categoryConfig.cssColor }}
            />
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Titre de la tâche */}
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate task-name text-theme-foreground text-sm">
                {task.name}
              </h3>
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
            
            {/* Informations secondaires */}
            <div className="flex items-center gap-3 text-xs text-theme-muted">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(totalTime)}</span>
              </div>
              {hasSubTasks && (
                <span className="bg-theme-accent px-1.5 py-0.5 rounded">
                  {subTasks.length} sous-tâche{subTasks.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions à droite */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {canHaveSubTasks(task) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreateSubTasks(task)}
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
        </div>

        {/* Sous-tâches */}
        {hasSubTasks && task.isExpanded && (
          <div className="mt-1 space-y-1">
            {subTasks.map(subTask => renderTask(subTask, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (filteredActiveTasks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <Clock className="w-8 h-8 mx-auto mb-2" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {localSearch || localCategoryFilter !== 'all' ? 'Aucune tâche trouvée' : 'Aucune tâche active'}
            </h3>
            <p className="text-xs text-gray-400">
              {localSearch || localCategoryFilter !== 'all' ? 'Modifiez vos filtres' : 'Créez votre première tâche !'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* En-tête avec contrôles améliorés */}
      <div className="p-3 border-b border-theme-border bg-theme-accent space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-theme-foreground">
            Tâches Actives ({filteredActiveTasks.length})
          </h2>
          
          {/* Historique */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600 disabled:opacity-50"
              title="Annuler (Ctrl+Z)"
            >
              <Undo className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600 disabled:opacity-50"
              title="Refaire (Ctrl+Y)"
            >
              <Redo className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Recherche locale */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Rechercher dans les tâches..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="text-xs h-8 pr-8 border-theme-border bg-theme-background text-theme-foreground"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearch('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Filtres et tri */}
        <div className="flex items-center gap-2">
          <Select value={localCategoryFilter} onValueChange={setLocalCategoryFilter}>
            <SelectTrigger className="h-7 text-xs flex-1 border-theme-border bg-theme-background text-theme-foreground">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-theme-background border-theme-border">
              <SelectItem value="all" className="text-theme-foreground">Toutes catégories</SelectItem>
              {Object.keys(CATEGORY_CONFIG).map((category) => (
                <SelectItem key={category} value={category} className="text-theme-foreground">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSort}>
            <SelectTrigger className="h-7 text-xs flex-1 border-theme-border bg-theme-background text-theme-foreground">
              <SortAsc className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-theme-background border-theme-border">
              <SelectItem value="name" className="text-theme-foreground">Nom</SelectItem>
              <SelectItem value="duration" className="text-theme-foreground">Durée</SelectItem>
              <SelectItem value="category" className="text-theme-foreground">Catégorie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des tâches avec scroll personnalisé */}
      <ScrollArea className="flex-1 task-list-scroll">
        <div className="p-2 space-y-1">
          {filteredActiveTasks.map(task => renderTask(task))}
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
