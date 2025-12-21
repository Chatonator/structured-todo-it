import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '@/types/task';
import { Habit, HabitStreak } from '@/types/habit';
import { Project } from '@/types/project';
import { Clock, ChevronsDown, ChevronsUp, ChevronRight, ChevronLeft, FolderPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import TaskModal from './TaskModal';
import TaskItem from './task/TaskItem';
import QuickAddTask from './QuickAddTask';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { SidebarHabitsSection } from './sidebar/SidebarHabitsSection';
import { SidebarProjectsSection } from './sidebar/SidebarProjectsSection';
import { SidebarTeamTasksSection } from './sidebar/SidebarTeamTasksSection';
import { useProjects } from '@/hooks/useProjects';
import { ProjectModal } from './projects/ProjectModal';
import { useDragDrop } from '@/contexts/DragDropContext';

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
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [taskToConvert, setTaskToConvert] = useState<Task | null>(null);
  const [isDragOverNewProject, setIsDragOverNewProject] = useState(false);

  // Hook pour les projets
  const { assignTaskToProject, createProject } = useProjects();
  
  // Hook pour le drag & drop global vers projets
  const { draggedTask, registerHandlers } = useDragDrop();

  // Notifier le parent quand l'état collapsed change
  const handleToggleCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  // Tâches actives triées avec épinglées en tête (exclure celles assignées à un projet)
  const mainActive = mainTasks.filter(task => !task.isCompleted && !task.projectId);
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

  // Assigner une tâche à un projet
  // Si c'est une tâche principale (level 0), on déplace aussi ses sous-tâches
  // Si c'est une sous-tâche, on ne déplace que cette sous-tâche
  const handleAssignToProject = async (taskId: string, projectId: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    // D'abord assigner la tâche principale (elle devient une tâche de niveau 0 dans le projet)
    const success = await assignTaskToProject(taskId, projectId);
    
    if (success) {
      // Si c'est une tâche principale (pas une sous-tâche), déplacer aussi les sous-tâches
      if (task.level === 0) {
        const assignSubtasksRecursively = async (parentId: string) => {
          const subTasks = getSubTasks(parentId);
          for (const subTask of subTasks) {
            await assignTaskToProject(subTask.id, projectId);
            await assignSubtasksRecursively(subTask.id);
          }
        };
        await assignSubtasksRecursively(taskId);
      }
      // Si c'est une sous-tâche, seule cette sous-tâche est déplacée (rien de plus à faire)
    }
    
    return success;
  };

  // Gestion de la conversion en projet
  // La tâche devient le projet (hérite du nom)
  // Si tâche principale : ses sous-tâches deviennent les tâches du projet
  // Si sous-tâche : seule cette sous-tâche devient le projet (sans tâches)
  const handleConvertToProject = (task: Task) => {
    setTaskToConvert(task);
    setShowProjectModal(true);
  };

  // Handler pour conversion depuis le drag & drop (reçoit un objet simplifié)
  // Ne pas dépendre de tasks.find() car la liste peut ne pas être à jour
  const handleConvertFromDrag = (draggedTask: { id: string; name: string; level: number }) => {
    // Créer un objet Task minimal pour le modal
    const minimalTask: Task = {
      id: draggedTask.id,
      name: draggedTask.name,
      level: draggedTask.level as 0 | 1 | 2,
      category: 'Autres',
      estimatedTime: 30,
      context: 'Pro',
      isCompleted: false,
      isExpanded: false,
      createdAt: new Date(),
    };
    
    setTaskToConvert(minimalTask);
    setShowProjectModal(true);
  };

  // Enregistrer les handlers pour le drag & drop global vers projets
  // Utiliser useEffect sans dépendances pour toujours avoir les dernières versions
  useEffect(() => {
    registerHandlers(handleAssignToProject, handleConvertFromDrag);
  });

  // Handlers pour la zone de drop "nouveau projet" dans la sidebar
  const handleNewProjectDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleNewProjectDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverNewProject(true);
  };

  const handleNewProjectDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOverNewProject(false);
    }
  };

  const handleNewProjectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverNewProject(false);
    
    let taskName = '';
    let taskId = '';
    let taskLevel = 0;
    
    // Essayer de récupérer les données JSON depuis text/plain
    try {
      const jsonData = e.dataTransfer.getData('text/plain');
      if (jsonData) {
        const taskData = JSON.parse(jsonData);
        if (taskData.id && taskData.name !== undefined) {
          taskName = taskData.name;
          taskId = taskData.id;
          taskLevel = taskData.level || 0;
        }
      }
    } catch (err) {
      // JSON parse failed, try fallback
    }
    
    // Fallback sur le contexte
    if (!taskName && draggedTask) {
      taskName = draggedTask.name;
      taskId = draggedTask.id;
      taskLevel = draggedTask.level;
    }
    
    // Si on a un nom de tâche, ouvrir le modal
    if (taskName) {
      const minimalTask: Task = {
        id: taskId,
        name: taskName,
        level: taskLevel as 0 | 1 | 2,
        category: 'Autres',
        estimatedTime: 30,
        context: 'Pro',
        isCompleted: false,
        isExpanded: false,
        createdAt: new Date(),
      };
      setTaskToConvert(minimalTask);
      setShowProjectModal(true);
    }
  };

  const handleCreateProjectFromTask = async (data: any) => {
    if (!taskToConvert) return;
    
    const taskId = taskToConvert.id;
    const realTask = tasks.find(t => t.id === taskId);
    const taskLevel = realTask?.level ?? taskToConvert.level;
    
    // Fonction locale pour collecter TOUTES les sous-tâches depuis le tableau tasks COMPLET
    // (ne pas utiliser getSubTasks qui peut être filtré)
    const collectAllSubTasks = (parentId: string): Task[] => {
      const directChildren = tasks.filter(t => t.parentId === parentId);
      const allDescendants: Task[] = [];
      for (const child of directChildren) {
        allDescendants.push(child);
        allDescendants.push(...collectAllSubTasks(child.id));
      }
      return allDescendants;
    };
    
    // Collecter les sous-tâches seulement si c'est une tâche principale
    const allSubTasksToAssign = taskLevel === 0 ? collectAllSubTasks(taskId) : [];
    
    console.log('[TaskList] Tâche à convertir:', { id: taskId, name: taskToConvert.name, level: taskLevel });
    console.log('[TaskList] Sous-tâches collectées:', allSubTasksToAssign.map(t => ({ id: t.id, name: t.name, level: t.level, parentId: t.parentId })));
    
    // Créer le projet
    const project = await createProject(
      data.name || taskToConvert.name,
      data.description,
      data.icon,
      data.color
    );
    
    if (project) {
      console.log('[TaskList] Projet créé:', project.id, '- Assignation de', allSubTasksToAssign.length, 'sous-tâches');
      
      // Assigner les sous-tâches au projet en une seule opération par tâche
      for (const subTask of allSubTasksToAssign) {
        console.log('[TaskList] Assignation sous-tâche:', subTask.id, subTask.name, '-> projectId:', project.id);
        
        if (onUpdateTask) {
          await onUpdateTask(subTask.id, {
            projectId: project.id,
            projectStatus: 'todo',
            level: 0,
            parentId: undefined,
          });
        } else {
          // Fallback DB direct
          await assignTaskToProject(subTask.id, project.id);
        }
      }
      
      // Supprimer la tâche principale (elle est devenue le projet)
      onRemoveTask(taskId);
    }
    
    setShowProjectModal(false);
    setTaskToConvert(null);
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
          onAssignToProject={handleAssignToProject}
          onConvertToProject={handleConvertToProject}
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

            {/* Zone de drop pour créer un nouveau projet */}
            <div
              className={`
                mx-3 my-2 border-2 border-dashed rounded-lg p-3 flex items-center justify-center gap-2
                transition-all duration-200 min-h-[60px]
                ${isDragOverNewProject 
                  ? 'border-primary bg-primary/10 scale-105' 
                  : draggedTask 
                    ? 'border-primary/50 bg-accent/50' 
                    : 'border-border bg-card/50'
                }
              `}
              onDragOver={handleNewProjectDragOver}
              onDragEnter={handleNewProjectDragEnter}
              onDragLeave={handleNewProjectDragLeave}
              onDrop={handleNewProjectDrop}
            >
              <FolderPlus className={`w-5 h-5 ${isDragOverNewProject ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${isDragOverNewProject ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {isDragOverNewProject ? 'Relâcher pour créer' : draggedTask ? 'Déposer ici' : 'Glisser une tâche ici'}
              </span>
            </div>

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

            {/* Modale de création de projet depuis une tâche */}
            <ProjectModal
              open={showProjectModal}
              onClose={() => {
                setShowProjectModal(false);
                setTaskToConvert(null);
              }}
              onSave={handleCreateProjectFromTask}
              initialName={taskToConvert?.name}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
