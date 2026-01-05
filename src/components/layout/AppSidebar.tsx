import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, ListTodo, Dumbbell, Briefcase, Users, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Task } from '@/types/task';
import { Habit, HabitStreak } from '@/types/habit';
import { Project } from '@/types/project';
import QuickAddTask from '@/components/task/QuickAddTask';
import SidebarTaskItem from '@/components/layout/SidebarTaskItem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ProjectTaskForSidebar {
  task: Task;
  projectName: string;
  projectIcon?: string;
}

interface TeamTask {
  id: string;
  name: string;
  isCompleted: boolean;
  category: string;
  estimatedTime: number;
}

interface AppSidebarProps {
  // Tasks
  tasks: Task[];
  mainTasks: Task[];
  pinnedTasks: string[];
  selectedTasks: string[];
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  canHaveSubTasks: (task: Task) => boolean;
  onToggleSelection: (taskId: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onAddTask: (task: any) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  // Habits
  sidebarShowHabits: boolean;
  todayHabits: Habit[];
  habitCompletions: Record<string, boolean>;
  habitStreaks: Record<string, HabitStreak>;
  onToggleHabit: (habitId: string) => Promise<boolean | void>;
  // Projects
  sidebarShowProjects: boolean;
  projects: Project[];
  projectTasks: ProjectTaskForSidebar[];
  onToggleProjectTask: (taskId: string) => void;
  // Team
  sidebarShowTeamTasks: boolean;
  teamTasks: TeamTask[];
  onToggleTeamTask: (taskId: string) => void;
}

/**
 * Nouvelle sidebar utilisant les composants Shadcn
 */
const AppSidebar: React.FC<AppSidebarProps> = ({
  tasks,
  mainTasks,
  pinnedTasks,
  selectedTasks,
  getSubTasks,
  calculateTotalTime,
  canHaveSubTasks,
  onToggleSelection,
  onToggleExpansion,
  onToggleCompletion,
  onTogglePinTask,
  onRemoveTask,
  onAddTask,
  onUpdateTask,
  sidebarShowHabits,
  todayHabits,
  habitCompletions,
  habitStreaks,
  onToggleHabit,
  sidebarShowProjects,
  projects,
  projectTasks,
  onToggleProjectTask,
  sidebarShowTeamTasks,
  teamTasks,
  onToggleTeamTask
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  const [isExtendedView, setIsExtendedView] = useState(false);
  const [habitsOpen, setHabitsOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(true);

  // Tâches triées (épinglées en premier)
  const sortedTasks = [...mainTasks].filter(t => !t.isCompleted).sort((a, b) => {
    const aPinned = pinnedTasks.includes(a.id);
    const bPinned = pinnedTasks.includes(b.id);
    return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
  });

  const activeHabits = todayHabits || [];
  const completedHabitsCount = activeHabits.filter(h => habitCompletions[h.id]).length;
  
  const activeProjectTasks = (projectTasks || []).filter(pt => !pt.task.isCompleted);
  const activeTeamTasks = (teamTasks || []).filter(t => !t.isCompleted);

  // En mode collapsed, afficher juste les icônes
  if (isCollapsed) {
    return (
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarContent className="py-4">
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-primary/10 hover:bg-primary/20"
              onClick={() => {/* Ouvrir modal ajout */}}
            >
              <Plus className="w-5 h-5 text-primary" />
            </Button>
            
            <div className="h-px w-8 bg-sidebar-border" />
            
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <ListTodo className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {sortedTasks.length}
                </span>
              </div>
              
              {sidebarShowHabits && activeHabits.length > 0 && (
                <div className="relative">
                  <Dumbbell className="w-5 h-5 text-habit" />
                  <span className="absolute -top-1 -right-1 bg-habit text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {activeHabits.length}
                  </span>
                </div>
              )}
              
              {sidebarShowProjects && activeProjectTasks.length > 0 && (
                <div className="relative">
                  <Briefcase className="w-5 h-5 text-project" />
                  <span className="absolute -top-1 -right-1 bg-project text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {activeProjectTasks.length}
                  </span>
                </div>
              )}
              
              {sidebarShowTeamTasks && activeTeamTasks.length > 0 && (
                <div className="relative">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {activeTeamTasks.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header: Quick Add */}
      <SidebarHeader className="p-0">
        <QuickAddTask onAddTask={onAddTask} />
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar">
        {/* Section Tâches */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-3 py-2">
            <SidebarGroupLabel className="p-0">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                <span>Tâches Actives ({sortedTasks.length})</span>
              </div>
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExtendedView(!isExtendedView)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isExtendedView ? (
                <ChevronsUp className="w-4 h-4" />
              ) : (
                <ChevronsDown className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {sortedTasks.length === 0 ? (
                <div className="px-3 py-6 text-center text-muted-foreground">
                  <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune tâche active</p>
                  <p className="text-xs">Créez votre première tâche !</p>
                </div>
              ) : (
                sortedTasks.map(task => (
                  <SidebarTaskItem
                    key={task.id}
                    task={task}
                    isPinned={pinnedTasks.includes(task.id)}
                    isSelected={selectedTasks.includes(task.id)}
                    isExtendedView={isExtendedView}
                    subTasks={getSubTasks(task.id).filter(t => !t.isCompleted)}
                    totalTime={calculateTotalTime(task)}
                    canHaveSubTasks={canHaveSubTasks(task)}
                    onToggleCompletion={onToggleCompletion}
                    onToggleExpansion={onToggleExpansion}
                    onTogglePinTask={onTogglePinTask}
                    onRemoveTask={onRemoveTask}
                    onUpdateTask={onUpdateTask}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Section Habitudes */}
        {sidebarShowHabits && activeHabits.length > 0 && (
          <Collapsible open={habitsOpen} onOpenChange={setHabitsOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-2 px-2 py-2 transition-colors">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-habit" />
                      <span>Habitudes ({completedHabitsCount}/{activeHabits.length})</span>
                    </div>
                    {habitsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="px-2 pb-2">
                  {activeHabits.map(habit => {
                    const isCompleted = habitCompletions[habit.id] || false;
                    const streak = habitStreaks[habit.id];
                    return (
                      <div
                        key={habit.id}
                        className={`
                          flex items-center gap-2 p-2 rounded-lg border transition-colors
                          border-l-4 border-l-habit
                          ${isCompleted ? 'bg-habit/10 border-habit/30' : 'bg-card border-border hover:bg-sidebar-accent/50'}
                        `}
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => onToggleHabit(habit.id)}
                          className="border-habit data-[state=checked]:bg-habit"
                        />
                        <span className={`flex-1 text-sm truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {habit.icon && <span className="mr-1">{habit.icon}</span>}
                          {habit.name}
                        </span>
                        {streak && streak.currentStreak > 0 && (
                          <Badge variant="secondary" className="bg-habit/10 text-habit text-xs">
                            🔥 {streak.currentStreak}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Section Projets */}
        {sidebarShowProjects && activeProjectTasks.length > 0 && (
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-2 px-2 py-2 transition-colors">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-project" />
                      <span>Tâches Projets ({activeProjectTasks.length})</span>
                    </div>
                    {projectsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="px-2 pb-2 space-y-1">
                  {activeProjectTasks.map(({ task, projectName, projectIcon }) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-sidebar-accent/50 transition-colors border-l-4 border-l-project"
                    >
                      <Checkbox
                        checked={task.isCompleted}
                        onCheckedChange={() => onToggleProjectTask(task.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{task.name}</span>
                        <Badge variant="outline" className="text-xs mt-0.5 text-project border-project/30">
                          {projectIcon && <span className="mr-1">{projectIcon}</span>}
                          {projectName}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{task.estimatedTime}min</span>
                    </div>
                  ))}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Section Team */}
        {sidebarShowTeamTasks && activeTeamTasks.length > 0 && (
          <Collapsible open={teamOpen} onOpenChange={setTeamOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-lg mx-2 px-2 py-2 transition-colors">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>Tâches d'équipe ({activeTeamTasks.length})</span>
                    </div>
                    {teamOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="px-2 pb-2 space-y-1">
                  {activeTeamTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-sidebar-accent/50 transition-colors border-l-4 border-l-primary"
                    >
                      <Checkbox
                        checked={task.isCompleted}
                        onCheckedChange={() => onToggleTeamTask(task.id)}
                      />
                      <span className="flex-1 text-sm truncate">{task.name}</span>
                      <span className="text-xs text-muted-foreground">{task.estimatedTime}min</span>
                    </div>
                  ))}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground text-center">
          {sortedTasks.length} tâche{sortedTasks.length !== 1 ? 's' : ''} active{sortedTasks.length !== 1 ? 's' : ''}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
