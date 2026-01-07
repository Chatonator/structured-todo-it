import React, { useState } from 'react';
import { Task } from '@/types/task';
import { Habit, HabitStreak } from '@/types/habit';
import { Project } from '@/types/project';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { ListTodo, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import SidebarQuickAdd from './SidebarQuickAdd';
import SidebarTaskItem from './SidebarTaskItem';
import { SidebarHabitsSection } from './SidebarHabitsSection';
import { SidebarProjectsSection } from './SidebarProjectsSection';
import { SidebarTeamTasksSection } from './SidebarTeamTasksSection';
import TaskModal from '@/components/task/TaskModal';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

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

interface AppSidebarProps {
  tasks: Task[];
  mainTasks: Task[];
  pinnedTasks: string[];
  onRemoveTask: (taskId: string) => void;
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

const AppSidebar: React.FC<AppSidebarProps> = ({
  tasks,
  mainTasks,
  pinnedTasks,
  onRemoveTask,
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
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { assignTaskToProject } = useProjects();

  // États modaux
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Tâches actives (exclure celles assignées à un projet)
  const activeTasks = mainTasks.filter(task => !task.isCompleted && !task.projectId);

  // Tri avec épinglées en tête
  const sortedTasks = [...activeTasks].sort((a, b) => {
    const aPinned = pinnedTasks.includes(a.id);
    const bPinned = pinnedTasks.includes(b.id);
    return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
  });

  // Gestion de la création de sous-tâches
  const handleCreateSubTask = (parentTask: Task) => {
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

  // Rendu récursif d'une tâche avec ses sous-tâches
  const renderTask = (task: Task, level: number = 0): React.ReactNode => {
    const subTasks = getSubTasks(task.id).filter(t => !t.isCompleted);
    const totalTime = calculateTotalTime(task);
    const isSelected = selectedTasks.includes(task.id);
    const isPinned = pinnedTasks.includes(task.id);

    return (
      <div key={task.id} style={{ marginLeft: level > 0 ? `${level * 8}px` : 0 }}>
        <SidebarTaskItem
          task={task}
          subTasks={subTasks}
          totalTime={totalTime}
          isSelected={isSelected}
          isPinned={isPinned}
          canHaveSubTasks={canHaveSubTasks(task)}
          onToggleSelection={onToggleSelection}
          onToggleExpansion={onToggleExpansion}
          onToggleCompletion={onToggleCompletion}
          onTogglePinTask={onTogglePinTask}
          onRemoveTask={onRemoveTask}
          onCreateSubTask={handleCreateSubTask}
          onEditTask={handleEditTask}
          onAssignToProject={handleAssignToProject}
        />

        {/* Sous-tâches */}
        {subTasks.length > 0 && task.isExpanded && (
          <div className="mt-0.5">
            {subTasks.map(subTask => renderTask(subTask, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border relative">
        {/* Header avec logo */}
        <SidebarHeader className="border-b border-sidebar-border p-2">
          <div className="flex items-center justify-center">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center cursor-pointer" onClick={toggleSidebar}>
                    <ListTodo className="w-4 h-4 text-primary-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Déplier la sidebar</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <ListTodo className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sidebar-foreground">TO-DO-IT</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Bouton collapse subtil - au milieu de la sidebar, dépasse légèrement */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-50",
            "w-5 h-10 rounded-r-md",
            "bg-sidebar-accent/80 hover:bg-sidebar-accent border border-l-0 border-sidebar-border",
            "flex items-center justify-center",
            "text-sidebar-foreground/60 hover:text-sidebar-foreground",
            "transition-all duration-200 shadow-sm",
            isCollapsed ? "-right-5" : "-right-5"
          )}
          aria-label={isCollapsed ? "Déplier" : "Replier"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>

        <SidebarContent className="custom-scrollbar">
          {/* Quick Add - caché en mode collapsed */}
          {!isCollapsed && <SidebarQuickAdd onAddTask={onAddTask} isCollapsed={isCollapsed} />}

          {/* Sections optionnelles */}
          {sidebarShowHabits && todayHabits.length > 0 && onToggleHabit && !isCollapsed && (
            <SidebarHabitsSection
              habits={todayHabits}
              completions={habitCompletions}
              streaks={habitStreaks}
              onToggleHabit={onToggleHabit}
            />
          )}

          {sidebarShowProjects && projectTasks.length > 0 && onToggleProjectTask && !isCollapsed && (
            <SidebarProjectsSection 
              projectTasks={projectTasks} 
              onToggleComplete={onToggleProjectTask}
            />
          )}

          {sidebarShowTeamTasks && teamTasks.length > 0 && onToggleTeamTask && !isCollapsed && (
            <SidebarTeamTasksSection
              tasks={teamTasks}
              onToggleComplete={onToggleTeamTask}
            />
          )}

          {/* Section Tâches Actives */}
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                <span>Tâches Actives ({sortedTasks.length})</span>
              </SidebarGroupLabel>
            )}
            
            <SidebarGroupContent>
              {isCollapsed ? (
                // Mode collapsed: afficher juste les pastilles de couleur
                <div className="flex flex-col items-center gap-1 py-2">
                  {sortedTasks.slice(0, 6).map(task => (
                    <Tooltip key={task.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-125',
                            task.category === 'Obligation' ? 'bg-category-obligation' :
                            task.category === 'Quotidien' ? 'bg-category-quotidien' :
                            task.category === 'Envie' ? 'bg-category-envie' :
                            'bg-category-autres'
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        {task.name}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {sortedTasks.length > 6 && (
                    <span className="text-[10px] text-muted-foreground mt-1">+{sortedTasks.length - 6}</span>
                  )}
                </div>
              ) : (
                // Mode expanded: liste complète
                <SidebarMenu>
                  {sortedTasks.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Aucune tâche active</p>
                      <p className="text-xs">Créez votre première tâche !</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {sortedTasks.map(task => renderTask(task))}
                    </div>
                  )}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer supprimé - bouton collapse déplacé sur le côté */}
      </Sidebar>

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
    </>
  );
};

export default AppSidebar;
