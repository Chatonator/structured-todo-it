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
      {/* Bouton fixé au milieu du viewport - toujours visible */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50",
          "w-5 h-10 rounded-r-md",
          "bg-sidebar-accent/90 hover:bg-sidebar-accent border border-l-0 border-sidebar-border",
          "flex items-center justify-center",
          "text-sidebar-foreground/60 hover:text-sidebar-foreground",
          "transition-all duration-200 shadow-md",
          isCollapsed ? "left-0" : "left-[16rem]"
        )}
        aria-label={isCollapsed ? "Déplier" : "Replier"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Sidebar - utilise offcanvas pour disparaître complètement */}
      <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
          {/* Header avec logo */}
          <SidebarHeader className="border-b border-sidebar-border p-2">
            <div className="flex items-center gap-2 w-full">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <ListTodo className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">TO-DO-IT</span>
            </div>
          </SidebarHeader>

          <SidebarContent className="custom-scrollbar">
            {/* Quick Add */}
            <SidebarQuickAdd onAddTask={onAddTask} isCollapsed={false} />

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

            {/* Section Tâches Actives */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                <span>Tâches Actives ({sortedTasks.length})</span>
              </SidebarGroupLabel>
              
              <SidebarGroupContent>
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
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
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
