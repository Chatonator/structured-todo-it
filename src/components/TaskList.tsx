import React, { useState } from 'react';
import { Task } from '@/types/task';
import { Clock, ChevronsDown, ChevronsUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import TaskModal from './TaskModal';
import TaskItem from './task/TaskItem';
import TaskListHeader from './task/TaskListHeader';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { TaskListActions } from './task/TaskListActions';

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
  backups?: Array<{
    id: string;
    name: string;
    createdAt: Date;
    tasks: any[];
  }>;
  onSaveBackup?: (name: string) => void;
  onLoadBackup?: (backupId: string) => void;
  onDeleteBackup?: (backupId: string) => void;
  onExportCSV?: () => void;
  onImportCSV?: (file: File) => Promise<void>;
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
  onRedo,
  backups = [],
  onSaveBackup,
  onLoadBackup,
  onDeleteBackup,
  onExportCSV,
  onImportCSV
}) => {
  // États locaux
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
  const [isExtendedView, setIsExtendedView] = useState(false);

  // Filtres locaux – on place les tâches épinglées en tête avant filtrage/recherche
  const mainActive = mainTasks.filter(task => !task.isCompleted);
  const preOrdered = [...mainActive].sort((a, b) => {
    const aPinned = pinnedTasks.includes(a.id);
    const bPinned = pinnedTasks.includes(b.id);
    return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
  });

  const {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    filteredTasks: localFilteredTasks
  } = useTaskFilters(preOrdered);

  // Opérations sur les tâches
  const { handleBulkComplete, handleBulkDelete } = useTaskOperations(
    onRemoveTask,
    onToggleCompletion,
    onTogglePinTask
  );

  // État local pour le tri
  const [sortBy, setSortBy] = useState<'name' | 'duration' | 'category'>('name');

  const handleSort = (newSortBy: 'name' | 'duration' | 'category') => {
    setSortBy(newSortBy);
    onSortTasks(newSortBy);
  };

  // Gestion du drag & drop améliorée
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setDragOverIndex(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderTasks(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Gestion de la création de sous-tâches
  const handleCreateSubTasks = (parentTask: Task) => {
    setSelectedParentTask(parentTask);
    setIsSubTaskModalOpen(true);
  };

  // Rendu d'une tâche avec ses sous-tâches - ajout de data-category pour les ombres
  const renderTask = (task: Task): React.ReactNode => {
    const subTasks = getSubTasks(task.id).filter(t => !t.isCompleted);
    const totalTime = calculateTotalTime(task);
    const isSelected = selectedTasks.includes(task.id);
    const isPinned = pinnedTasks.includes(task.id);
    const taskIndex = localFilteredTasks.findIndex(t => t.id === task.id);

    return (
      <div 
        key={task.id}
        onDragEnter={() => handleDragEnter(taskIndex)}
        onDragLeave={handleDragLeave}
        data-category={task.category}
		className={`task-item ${isPinned ? 'task-pinned' : ''}`}
      >
        <TaskItem
          task={task}
          subTasks={subTasks}
          totalTime={totalTime}
          isSelected={isSelected}
          isPinned={isPinned}
          canHaveSubTasks={canHaveSubTasks(task)}
          forceExtended={isExtendedView}
          onToggleSelection={onToggleSelection}
          onToggleExpansion={onToggleExpansion}
          onToggleCompletion={onToggleCompletion}
          onTogglePinTask={onTogglePinTask}
          onRemoveTask={onRemoveTask}
          onCreateSubTask={handleCreateSubTasks}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          dragIndex={draggedIndex}
          taskIndex={taskIndex}
          isDragOver={dragOverIndex === taskIndex}
        />

        {/* Sous-tâches */}
        {subTasks.length > 0 && task.isExpanded && (
          <div className="mt-1 space-y-1">
            {subTasks.map(subTask => renderTask(subTask))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* En-tête avec contrôles */}
      <TaskListHeader
        tasksCount={localFilteredTasks.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        sortBy={sortBy}
        onSortChange={handleSort}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
      />

      {/* Actions de sauvegarde et export */}
      {(onSaveBackup || onExportCSV) && (
        <TaskListActions
          backups={backups}
          onSaveBackup={onSaveBackup || (() => {})}
          onLoadBackup={onLoadBackup || (() => {})}
          onDeleteBackup={onDeleteBackup || (() => {})}
          onExportCSV={onExportCSV || (() => {})}
          onImportCSV={onImportCSV || (async () => {})}
        />
      )}

      {/* Bouton de vue étendue */}
      <div className="px-2 py-1 border-b border-theme-border bg-theme-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExtendedView(!isExtendedView)}
          className="w-full justify-start text-xs text-theme-muted hover:text-theme-foreground"
        >
          {isExtendedView ? (
            <>
              <ChevronsUp className="w-3 h-3 mr-2" />
              Vue condensée
            </>
          ) : (
            <>
              <ChevronsDown className="w-3 h-3 mr-2" />
              Vue étendue
            </>
          )}
        </Button>
      </div>

      {/* Liste des tâches avec scrollbar améliorée */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full custom-scrollbar">
          <div className="p-2 space-y-1">
            {localFilteredTasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-3">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {searchQuery || categoryFilter !== 'all' ? 'Aucune tâche trouvée' : 'Aucune tâche active'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {searchQuery || categoryFilter !== 'all' ? 'Modifiez vos filtres' : 'Créez votre première tâche !'}
                  </p>
                </div>
              </div>
            ) : (
              localFilteredTasks.map(task => renderTask(task))
            )}
          </div>
        </ScrollArea>
      </div>

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
