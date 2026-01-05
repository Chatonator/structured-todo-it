import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  ListTodo,
  Grid3X3,
  Calendar,
  FolderKanban,
  Heart,
  Trophy,
  CheckCircle2,
  Plus,
  Settings,
  ChevronRight,
  Clock,
  Flame,
} from 'lucide-react';
import { Task } from '@/types/task';
import { Habit, HabitStreak } from '@/types/habit';
import { Project } from '@/types/project';
import QuickAddTask from '@/components/task/QuickAddTask';
import { cn } from '@/lib/utils';

// Types pour les props
interface NavigationItem {
  key: string;
  title: string;
  icon: React.ElementType;
}

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
  currentView: string;
  onViewChange: (view: string) => void;
  onOpenModal: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  // Tâches
  tasks: Task[];
  onToggleCompletion: (taskId: string) => void;
  // Habitudes (optionnel)
  showHabits?: boolean;
  todayHabits?: Habit[];
  habitCompletions?: Record<string, boolean>;
  habitStreaks?: Record<string, HabitStreak>;
  onToggleHabit?: (habitId: string) => Promise<boolean | void>;
  // Projets (optionnel)
  showProjects?: boolean;
  projects?: Project[];
  projectTasks?: ProjectTaskForSidebar[];
  onToggleProjectTask?: (taskId: string) => void;
  // Équipe (optionnel)
  showTeamTasks?: boolean;
  teamTasks?: TeamTaskForSidebar[];
  onToggleTeamTask?: (taskId: string) => void;
}

// Configuration de la navigation
const navigationItems: NavigationItem[] = [
  { key: 'home', title: 'Accueil', icon: Home },
  { key: 'tasks', title: 'Tâches', icon: ListTodo },
  { key: 'eisenhower', title: 'Eisenhower', icon: Grid3X3 },
  { key: 'timeline', title: 'Timeline', icon: Calendar },
  { key: 'projects', title: 'Projets', icon: FolderKanban },
  { key: 'habits', title: 'Habitudes', icon: Heart },
  { key: 'rewards', title: 'Récompenses', icon: Trophy },
  { key: 'completed', title: 'Terminées', icon: CheckCircle2 },
];

const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onViewChange,
  onOpenModal,
  onAddTask,
  tasks,
  onToggleCompletion,
  showHabits = false,
  todayHabits = [],
  habitCompletions = {},
  habitStreaks = {},
  onToggleHabit,
  showProjects = false,
  projects = [],
  showTeamTasks = false,
  teamTasks = [],
  onToggleTeamTask,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  // Tâches actives (non complétées, niveau 0)
  const activeTasks = tasks.filter(t => !t.isCompleted && t.level === 0 && !t.projectId).slice(0, 8);
  
  // Habitudes du jour non complétées
  const pendingHabits = todayHabits.filter(h => !habitCompletions[h.id]).slice(0, 5);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header avec logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-sm shrink-0">
            <ListTodo className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">TO-DO-IT</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar">
        {/* Navigation principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.key)}
                    isActive={currentView === item.key}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Quick Add (visible seulement quand expanded) */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Ajout rapide</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2">
                <QuickAddTask onAddTask={onAddTask} />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Bouton nouvelle tâche (mode collapsed) */}
        {isCollapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onOpenModal} tooltip="Nouvelle tâche">
                    <Plus className="h-4 w-4" />
                    <span>Nouvelle</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Tâches actives */}
        {!isCollapsed && activeTasks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>Tâches actives</span>
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {activeTasks.length}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1 px-2">
                  {activeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => onToggleCompletion(task.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
              {tasks.filter(t => !t.isCompleted && t.level === 0 && !t.projectId).length > 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onViewChange('tasks')}
                >
                  Voir toutes les tâches
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Habitudes du jour */}
        {!isCollapsed && showHabits && pendingHabits.length > 0 && onToggleHabit && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                <span>Habitudes du jour</span>
                <span className="text-xs bg-habit/10 text-habit px-1.5 py-0.5 rounded-full">
                  {pendingHabits.length}
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-1 px-2">
                  {pendingHabits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      streak={habitStreaks[habit.id]}
                      onToggle={() => onToggleHabit(habit.id)}
                    />
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Tâches d'équipe */}
        {!isCollapsed && showTeamTasks && teamTasks.length > 0 && onToggleTeamTask && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                <span>Tâches d'équipe</span>
                <span className="text-xs bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full">
                  {teamTasks.filter(t => !t.isCompleted).length}
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-1 px-2">
                  {teamTasks.filter(t => !t.isCompleted).slice(0, 5).map((task) => (
                    <TeamTaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => onToggleTeamTask(task.id)}
                    />
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Paramètres">
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pb-2">
          <SidebarTrigger className="w-full" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

// Composant TaskItem compact
interface TaskItemProps {
  task: Task;
  onToggle: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  const categoryColors: Record<string, string> = {
    Obligation: 'bg-red-500',
    Quotidien: 'bg-amber-500',
    Envie: 'bg-green-500',
    Autres: 'bg-violet-500',
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-2 rounded-lg',
        'hover:bg-sidebar-accent transition-colors cursor-pointer',
        'border border-transparent hover:border-sidebar-border'
      )}
      onClick={onToggle}
    >
      <div className={cn('w-2 h-2 rounded-full shrink-0', categoryColors[task.category] || 'bg-gray-400')} />
      <span className="text-sm truncate flex-1 text-sidebar-foreground">{task.name}</span>
      {task.estimatedTime > 0 && (
        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {task.estimatedTime}m
        </span>
      )}
    </div>
  );
};

// Composant HabitItem compact
interface HabitItemProps {
  habit: Habit;
  streak?: HabitStreak;
  onToggle: () => void;
}

const HabitItem: React.FC<HabitItemProps> = ({ habit, streak, onToggle }) => {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-2 rounded-lg',
        'hover:bg-habit/10 transition-colors cursor-pointer',
        'border border-transparent hover:border-habit/20'
      )}
      onClick={onToggle}
    >
      <Heart className="w-4 h-4 text-habit shrink-0" />
      <span className="text-sm truncate flex-1 text-sidebar-foreground">{habit.name}</span>
      {streak && streak.currentStreak > 0 && (
        <span className="text-xs text-habit flex items-center gap-1 shrink-0">
          <Flame className="h-3 w-3" />
          {streak.currentStreak}
        </span>
      )}
    </div>
  );
};

// Composant TeamTaskItem compact
interface TeamTaskItemProps {
  task: TeamTaskForSidebar;
  onToggle: () => void;
}

const TeamTaskItem: React.FC<TeamTaskItemProps> = ({ task, onToggle }) => {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-2 rounded-lg',
        'hover:bg-blue-500/10 transition-colors cursor-pointer',
        'border border-transparent hover:border-blue-500/20'
      )}
      onClick={onToggle}
    >
      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
      <span className="text-sm truncate flex-1 text-sidebar-foreground">{task.name}</span>
      {task.estimatedTime > 0 && (
        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {task.estimatedTime}m
        </span>
      )}
    </div>
  );
};

export default AppSidebar;
