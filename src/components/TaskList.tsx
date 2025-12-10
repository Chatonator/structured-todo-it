import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '@/types/task';
import { Habit, HabitStreak } from '@/types/habit';
import { Project } from '@/types/project';
import { Clock, ChevronsDown, ChevronsUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import TaskModal from './TaskModal';
import TaskItem from './task/TaskItem';
import QuickAddTask from './QuickAddTask';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { SidebarHabitsSection } from './sidebar/SidebarHabitsSection';
import { SidebarProjectsSection } from './sidebar/SidebarProjectsSection';
import { SidebarTeamTasksSection } from './sidebar/SidebarTeamTasksSection';

interface TeamTaskForSidebar {
  id: string;
  name: string;
  isCompleted: boolean;
  category: string;
  estimatedTime: number;
}

interface ProjectTaskForSidebar {
  task: Task;
  projectName: string;
  projectIcon?: string;
}

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
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  canHaveSubTasks: (task: Task) => boolean;
  selectedTasks: string[];
  onToggleSelection: (taskId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  // Nouvelles props pour les sections optionnelles
  sidebarShowHabits?: boolean;
  sidebarShowProjects?: boolean;
  sidebarShowTeamTasks?: boolean;
  todayHabits?: Habit[];
  habitCompletions?: Record<string, boolean>;
  habitStreaks?: Record<string, HabitStreak>;
  onToggleHabit?: (habitId: string) => Promise<boolean | void>;
  projects?: Project[];
  projectTasks?: ProjectTaskForSidebar[];
  onToggleProjectTask?: (taskId: string) => void;
  teamTasks?: TeamTaskForSidebar[];
  onToggleTeamTask?: (taskId: string) => void;
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
  onUpdateTask,
  getSubTasks,
  calculateTotalTime,
  canHaveSubTasks,
  selectedTasks,
  onToggleSelection,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCollapsedChange,
  // Nouvelles props
  sidebarShowHabits = false,
  sidebarShowProjects = false,
  sidebarShowTeamTasks = false,
  todayHabits = [],
  habitCompletions = {},
  habitStreaks = {},
  onToggleHabit,
  projects = [],
  projectTasks = [],
  onToggleProjectTask,
  teamTasks = [],
  onToggleTeamTask
}) => {
  // États locaux
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
  const [isExtendedView, setIsExtendedView] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Notifier le parent quand l'état collapsed change
  const handleToggleCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  // Tâches actives triées avec épinglées en tête
  const mainActive = mainTasks.filter(task => !task.isCompleted);
  const localFilteredTasks = [...mainActive].sort((a, b) => {
    const aPinned = pinnedTasks.includes(a.id);
    const bPinned = pinnedTasks.includes(b.id);
    return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
  });

  // Opérations sur les tâches
  const { handleBulkComplete, handleBulkDelete } = useTaskOperations(
    onRemoveTask,
    onToggleCompletion,
    onTogglePinTask
  );


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

  // Gestion de l'édition de tâche
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setIsEditModalOpen(false);
  };

  // Gestion du drag & drop pour les sous-tâches
  const handleSubTaskReorder = (parentId: string, subTasks: Task[], startIndex: number, endIndex: number) => {
    // IMPORTANT: récupérer les IDs AVANT de modifier le tableau
    const movedTaskId = subTasks[startIndex].id;
    const targetTaskId = subTasks[endIndex].id;
    
    // Trouver les indices globaux dans le tableau complet des tâches
    const globalStartIndex = tasks.findIndex(t => t.id === movedTaskId);
    const globalEndIndex = tasks.findIndex(t => t.id === targetTaskId);
    
    if (globalStartIndex !== -1 && globalEndIndex !== -1) {
      onReorderTasks(globalStartIndex, globalEndIndex);
    }
  };

  // Rendu d'une tâche avec ses sous-tâches - ajout de data-category pour les ombres
  const renderTask = (task: Task, parentSubTasks?: Task[]): React.ReactNode => {
    const subTasks = getSubTasks(task.id).filter(t => !t.isCompleted);
    const totalTime = calculateTotalTime(task);
    const isSelected = selectedTasks.includes(task.id);
    const isPinned = pinnedTasks.includes(task.id);
    const taskIndex = parentSubTasks 
      ? parentSubTasks.findIndex(t => t.id === task.id)
      : localFilteredTasks.findIndex(t => t.id === task.id);

    const handleSubTaskDragStart = (e: React.DragEvent, index: number) => {
      if (parentSubTasks) {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
      } else {
        handleDragStart(e, index);
      }
    };

    const handleSubTaskDrop = (e: React.DragEvent, dropIndex: number) => {
      if (parentSubTasks && draggedIndex !== null) {
        e.preventDefault();
        handleSubTaskReorder(task.parentId!, parentSubTasks, draggedIndex, dropIndex);
        setDraggedIndex(null);
        setDragOverIndex(null);
      } else {
        handleDrop(e, dropIndex);
      }
    };

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
          onEditTask={handleEditTask}
          onDragStart={parentSubTasks ? handleSubTaskDragStart : handleDragStart}
          onDragOver={handleDragOver}
          onDrop={parentSubTasks ? handleSubTaskDrop : handleDrop}
          dragIndex={draggedIndex}
          taskIndex={taskIndex}
          isDragOver={dragOverIndex === taskIndex}
        />

        {/* Sous-tâches */}
        {subTasks.length > 0 && task.isExpanded && (
          <div className="mt-1 space-y-1">
            {subTasks.map(subTask => renderTask(subTask, subTasks))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-full flex">
      {/* Barre latérale repliable */}
      <div 
        className={`
          h-full border-r border-border bg-background
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-full'}
          overflow-hidden relative
        `}
      >
        {isCollapsed ? (
          /* Vue repliée - Seulement le bouton flottant */
          <div className="h-full w-full relative">
            <Button
              onClick={() => handleToggleCollapsed(false)}
              className="sticky top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50"
              title="Déplier la liste des tâches"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        ) : (
          /* Vue dépliée - Contenu complet */
          <div className="flex flex-col h-full relative">
            {/* Bouton de repli sticky - même style que le bouton de dépli */}
            <Button
              onClick={() => handleToggleCollapsed(true)}
              className="sticky top-4 right-4 ml-auto mr-4 mt-4 w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50"
              title="Replier la liste des tâches"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            {/* Bloc d'ajout rapide */}
            <QuickAddTask onAddTask={onAddTask} />

            {/* Sections optionnelles */}
            {sidebarShowHabits && todayHabits.length > 0 && onToggleHabit && (
              <SidebarHabitsSection
                habits={todayHabits}
                completions={habitCompletions}
                streaks={habitStreaks}
                onToggleHabit={onToggleHabit}
              />
            )}

            {sidebarShowProjects && projectTasks.length > 0 && onToggleProjectTask && (
              <SidebarProjectsSection 
                projectTasks={projectTasks} 
                onToggleComplete={onToggleProjectTask}
              />
            )}

            {sidebarShowTeamTasks && teamTasks.length > 0 && onToggleTeamTask && (
              <SidebarTeamTasksSection
                tasks={teamTasks}
                onToggleComplete={onToggleTeamTask}
              />
            )}

            {/* En-tête simplifié */}
            <div className="relative px-3 pb-2 pt-2 border-b border-border bg-background">
              <h2 className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wide">
                Tâches Actives ({localFilteredTasks.length})
              </h2>
            </div>

            {/* Bouton de vue étendue */}
            <div className="px-3 py-2 border-b border-border bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExtendedView(!isExtendedView)}
                className="w-full justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {isExtendedView ? (
                  <>
                    <ChevronsUp className="w-4 h-4 mr-2" />
                    Vue condensée
                  </>
                ) : (
                  <>
                    <ChevronsDown className="w-4 h-4 mr-2" />
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
                        <div className="text-muted-foreground mb-3">
                          <Clock className="w-8 h-8 mx-auto mb-2" />
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Aucune tâche active
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Créez votre première tâche !
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

            {/* Modale d'édition */}
            {isEditModalOpen && (
              <TaskModal
                key={editingTask?.id}
                isOpen
                onClose={handleCloseEditModal}
                onUpdateTask={onUpdateTask}
                editingTask={editingTask}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
