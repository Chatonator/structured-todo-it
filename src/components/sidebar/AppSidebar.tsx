import React, { useState } from 'react';
import { Task } from '@/types/task';
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

import SidebarQuickAdd from './SidebarQuickAdd';
import SidebarSearchFilter from './SidebarSearchFilter';
import SidebarSortSelector from './SidebarSortSelector';
import SidebarTaskRenderer from './SidebarTaskRenderer';
import { SidebarHabitsSection } from './SidebarHabitsSection';
import { SidebarProjectsSection } from './SidebarProjectsSection';
import { SidebarTeamTasksSection } from './SidebarTeamTasksSection';
import TaskModal from '@/components/task/TaskModal';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useSidebarFilters, useSidebarProjectActions } from './hooks';
import { cn } from '@/lib/utils';
import { canAddSubTask } from '@/utils/taskValidation';
import { useToast } from '@/hooks/use-toast';

const AppSidebar: React.FC = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { toast } = useToast();

  const {
    tasks, mainTasks, pinnedTasks, recurringTaskIds, taskSchedules,
    onRemoveTask, onToggleExpansion, onToggleCompletion, onTogglePinTask,
    onAddTask, onUpdateTask, onSetRecurring, onRemoveRecurring, onScheduleTask,
    getSubTasks, calculateTotalTime, canHaveSubTasks,
    selectedTasks, onToggleSelection,
    sidebarShowHabits, sidebarShowTeamTasks,
    todayHabits, habitCompletions, habitStreaks, onToggleHabit,
    sidebarProjectTasks, onToggleProjectTask,
    teamTasks, onToggleTeamTask
  } = useSidebarContext();

  // Extracted hooks
  const activeTasks = mainTasks.filter(task => !task.isCompleted && !task.projectId);
  const { searchQuery, setSearchQuery, filters, setFilters, sortConfig, setSortConfig, sortedTasks } =
    useSidebarFilters(activeTasks, pinnedTasks, recurringTaskIds);
  const { handleAssignToProject, handleCreateProjectFromTask } =
    useSidebarProjectActions(tasks, getSubTasks);

  // Modal state
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleCreateSubTask = (parentTask: Task) => {
    const siblingCount = tasks.filter(t => t.parentId === parentTask.id).length;
    const check = canAddSubTask(parentTask.level, siblingCount);
    if (!check.allowed) {
      toast({ title: 'Limite atteinte', description: check.reason, variant: 'destructive', duration: 3000 });
      return;
    }
    setSelectedParentTask(parentTask);
    setIsSubTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setIsEditModalOpen(false);
  };

  return (
    <>
      {/* Toggle button */}
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
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border p-2">
          <div className="flex items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <ListTodo className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">TO-DO-IT</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="custom-scrollbar">
          <div className="px-2 py-2 space-y-2 border-b border-sidebar-border">
            <SidebarQuickAdd onAddTask={onAddTask} isCollapsed={false} />
            <div className="flex items-center gap-1">
              <SidebarSearchFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={filters}
                onFiltersChange={setFilters}
              />
              <SidebarSortSelector sortConfig={sortConfig} onSortChange={setSortConfig} />
            </div>
          </div>

          {sidebarShowHabits && todayHabits.length > 0 && onToggleHabit && (
            <SidebarHabitsSection
              habits={todayHabits}
              completions={habitCompletions}
              streaks={habitStreaks}
              onToggleHabit={onToggleHabit}
            />
          )}

          {sidebarProjectTasks.length > 0 && onToggleProjectTask && (
            <SidebarProjectsSection
              projectTasks={sidebarProjectTasks}
              onToggleComplete={onToggleProjectTask}
            />
          )}

          {sidebarShowTeamTasks && teamTasks.length > 0 && onToggleTeamTask && (
            <SidebarTeamTasksSection tasks={teamTasks} onToggleComplete={onToggleTeamTask} />
          )}

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span>Tâches</span>
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
                    {sortedTasks.map(task => (
                      <SidebarTaskRenderer
                        key={task.id}
                        task={task}
                        getSubTasks={getSubTasks}
                        calculateTotalTime={calculateTotalTime}
                        canHaveSubTasks={canHaveSubTasks}
                        selectedTasks={selectedTasks}
                        pinnedTasks={pinnedTasks}
                        recurringTaskIds={recurringTaskIds}
                        taskSchedules={taskSchedules}
                        onToggleSelection={onToggleSelection}
                        onToggleExpansion={onToggleExpansion}
                        onToggleCompletion={onToggleCompletion}
                        onTogglePinTask={onTogglePinTask}
                        onRemoveTask={onRemoveTask}
                        onCreateSubTask={handleCreateSubTask}
                        onEditTask={handleEditTask}
                        onAssignToProject={handleAssignToProject}
                        onCreateProjectFromTask={handleCreateProjectFromTask}
                        onSetRecurring={onSetRecurring}
                        onRemoveRecurring={onRemoveRecurring}
                        onScheduleTask={onScheduleTask}
                      />
                    ))}
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {selectedParentTask && (
        <TaskModal
          isOpen={isSubTaskModalOpen}
          onClose={() => { setIsSubTaskModalOpen(false); setSelectedParentTask(null); }}
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
