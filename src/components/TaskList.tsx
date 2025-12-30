import React, { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Habit, HabitStreak } from '@/types/habit';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import TaskModal from './TaskModal';
import QuickAddTask from './QuickAddTask';
import { useProjects } from '@/hooks/useProjects';
import { ProjectModal } from './projects/ProjectModal';
import { useDragDrop } from '@/contexts/DragDropContext';

// Sous-composants de la sidebar
import SidebarCollapseButton from './sidebar/SidebarCollapseButton';
import NewProjectDropZone from './sidebar/NewProjectDropZone';
import SidebarTasksSection from './sidebar/SidebarTasksSection';
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
  // Props pour les sections optionnelles
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
  // Sections optionnelles
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [taskToConvert, setTaskToConvert] = useState<Task | null>(null);
  const [isDragOverNewProject, setIsDragOverNewProject] = useState(false);

  // Hooks
  const { assignTaskToProject, createProject } = useProjects();
  const { draggedTask, registerHandlers } = useDragDrop();

  // Tâches actives (exclure celles assignées à un projet)
  const activeTasks = mainTasks.filter(task => !task.isCompleted && !task.projectId);

  // Notifier le parent quand l'état collapsed change
  const handleToggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
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

  // Assigner une tâche à un projet (avec sous-tâches si niveau 0)
  const handleAssignToProject = async (taskId: string, projectId: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const success = await assignTaskToProject(taskId, projectId);
    
    if (success && task.level === 0) {
      const assignSubtasksRecursively = async (parentId: string) => {
        const subTasks = getSubTasks(parentId);
        for (const subTask of subTasks) {
          await assignTaskToProject(subTask.id, projectId);
          await assignSubtasksRecursively(subTask.id);
        }
      };
      await assignSubtasksRecursively(taskId);
    }
    
    return success;
  };

  // Gestion de la conversion en projet
  const handleConvertToProject = (task: Task) => {
    setTaskToConvert(task);
    setShowProjectModal(true);
  };

  // Handler pour conversion depuis le drag & drop
  const handleConvertFromDrag = (draggedTask: { id: string; name: string; level: number }) => {
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
  useEffect(() => {
    registerHandlers(handleAssignToProject, handleConvertFromDrag);
  });

  // Handlers pour la zone de drop "nouveau projet"
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
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOverNewProject(false);
    }
  };

  const handleNewProjectDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverNewProject(false);
    
    let taskData = { id: '', name: '', level: 0 };
    
    // Récupérer les données JSON
    try {
      const jsonData = e.dataTransfer.getData('text/plain');
      if (jsonData) {
        const parsed = JSON.parse(jsonData);
        if (parsed.id && parsed.name !== undefined) {
          taskData = { id: parsed.id, name: parsed.name, level: parsed.level || 0 };
        }
      }
    } catch {
      // Fallback sur le contexte
      if (draggedTask) {
        taskData = { id: draggedTask.id, name: draggedTask.name, level: draggedTask.level };
      }
    }
    
    // Ouvrir le modal si on a les données
    if (taskData.name) {
      const minimalTask: Task = {
        id: taskData.id,
        name: taskData.name,
        level: taskData.level as 0 | 1 | 2,
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

  // Création de projet depuis une tâche
  const handleCreateProjectFromTask = async (data: any) => {
    if (!taskToConvert) return;
    
    const taskId = taskToConvert.id;
    const realTask = tasks.find(t => t.id === taskId);
    const taskLevel = realTask?.level ?? taskToConvert.level;
    
    // Collecter toutes les sous-tâches récursivement
    const collectAllSubTasks = (parentId: string): Task[] => {
      const directChildren = tasks.filter(t => t.parentId === parentId);
      const allDescendants: Task[] = [];
      for (const child of directChildren) {
        allDescendants.push(child);
        allDescendants.push(...collectAllSubTasks(child.id));
      }
      return allDescendants;
    };
    
    const allSubTasksToAssign = taskLevel === 0 ? collectAllSubTasks(taskId) : [];
    
    // Créer le projet
    const project = await createProject(
      data.name || taskToConvert.name,
      data.description,
      data.icon,
      data.color
    );
    
    if (project) {
      // Assigner les sous-tâches au projet
      for (const subTask of allSubTasksToAssign) {
        if (onUpdateTask) {
          await onUpdateTask(subTask.id, {
            projectId: project.id,
            projectStatus: 'todo',
            level: 0,
            parentId: undefined,
          });
        } else {
          await assignTaskToProject(subTask.id, project.id);
        }
      }
      
      // Supprimer la tâche principale (elle est devenue le projet)
      onRemoveTask(taskId);
    }
    
    setShowProjectModal(false);
    setTaskToConvert(null);
  };

  return (
    <div className="relative h-full flex min-h-0">
      {/* Sidebar repliable */}
      <div 
        className={`
          h-full min-h-0 border-r border-border bg-background
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-full'}
          overflow-hidden relative
        `}
      >
        {isCollapsed ? (
          /* Vue repliée */
          <div className="h-full w-full relative">
            <div className="sticky top-4 left-1/2 -translate-x-1/2 flex justify-center">
              <SidebarCollapseButton 
                isCollapsed={true} 
                onToggle={handleToggleCollapsed} 
              />
            </div>
          </div>
        ) : (
          /* Vue dépliée */
          <div className="flex flex-col h-full relative">
            {/* Bouton de repli */}
            <div className="shrink-0 flex justify-end px-4 pt-4">
              <SidebarCollapseButton 
                isCollapsed={false} 
                onToggle={handleToggleCollapsed} 
              />
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
              <div className="flex flex-col">
                {/* Ajout rapide */}
                <QuickAddTask onAddTask={onAddTask} />

                {/* Zone de drop nouveau projet */}
                <NewProjectDropZone
                  isDragOver={isDragOverNewProject}
                  hasActiveDrag={!!draggedTask}
                  onDragOver={handleNewProjectDragOver}
                  onDragEnter={handleNewProjectDragEnter}
                  onDragLeave={handleNewProjectDragLeave}
                  onDrop={handleNewProjectDrop}
                />

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

                {/* Section des tâches */}
                <SidebarTasksSection
                  tasks={activeTasks}
                  pinnedTasks={pinnedTasks}
                  selectedTasks={selectedTasks}
                  getSubTasks={getSubTasks}
                  calculateTotalTime={calculateTotalTime}
                  canHaveSubTasks={canHaveSubTasks}
                  onToggleSelection={onToggleSelection}
                  onToggleExpansion={onToggleExpansion}
                  onToggleCompletion={onToggleCompletion}
                  onTogglePinTask={onTogglePinTask}
                  onRemoveTask={onRemoveTask}
                  onCreateSubTask={handleCreateSubTasks}
                  onEditTask={handleEditTask}
                  onAssignToProject={handleAssignToProject}
                  onConvertToProject={handleConvertToProject}
                  onReorderTasks={onReorderTasks}
                  allTasks={tasks}
                />
              </div>
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
