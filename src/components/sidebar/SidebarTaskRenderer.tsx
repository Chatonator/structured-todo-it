import React from 'react';
import { Task } from '@/types/task';
import SidebarTaskItem from './SidebarTaskItem';

interface SidebarTaskRendererProps {
  task: Task;
  level?: number;
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  canHaveSubTasks: (task: Task) => boolean;
  selectedTasks: string[];
  pinnedTasks: string[];
  recurringTaskIds: string[];
  taskSchedules: Record<string, any>;
  onToggleSelection: (id: string) => void;
  onToggleExpansion: (id: string) => void;
  onToggleCompletion: (id: string) => void;
  onTogglePinTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onCreateSubTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onAssignToProject: (taskId: string, projectId: string) => Promise<boolean>;
  onCreateProjectFromTask: (task: Task, subTasks: Task[]) => Promise<void>;
  onSetRecurring: (taskId: string, taskName: string, estimatedTime: number, frequency: string, interval: number) => Promise<void>;
  onRemoveRecurring: (taskId: string) => void;
  onScheduleTask: (taskId: string, date: Date, time: string) => Promise<void>;
}

/**
 * Recursive task renderer for the sidebar.
 * Extracted from AppSidebar for maintainability.
 */
const SidebarTaskRenderer: React.FC<SidebarTaskRendererProps> = ({
  task,
  level = 0,
  getSubTasks,
  calculateTotalTime,
  canHaveSubTasks,
  selectedTasks,
  pinnedTasks,
  recurringTaskIds,
  taskSchedules,
  onToggleSelection,
  onToggleExpansion,
  onToggleCompletion,
  onTogglePinTask,
  onRemoveTask,
  onCreateSubTask,
  onEditTask,
  onAssignToProject,
  onCreateProjectFromTask,
  onSetRecurring,
  onRemoveRecurring,
  onScheduleTask,
}) => {
  const subTasks = getSubTasks(task.id).filter(t => !t.isCompleted);
  const totalTime = calculateTotalTime(task);
  const isSelected = selectedTasks.includes(task.id);
  const isPinned = pinnedTasks.includes(task.id);
  const isRecurring = recurringTaskIds.includes(task.id);
  const schedule = taskSchedules[task.id];

  return (
    <div style={{ marginLeft: level > 0 ? `${level * 8}px` : 0 }}>
      <SidebarTaskItem
        task={task}
        subTasks={subTasks}
        totalTime={totalTime}
        isSelected={isSelected}
        isPinned={isPinned}
        isRecurring={isRecurring}
        scheduledDate={schedule?.date}
        scheduledTime={schedule?.time}
        canHaveSubTasks={canHaveSubTasks(task)}
        onToggleSelection={onToggleSelection}
        onToggleExpansion={onToggleExpansion}
        onToggleCompletion={onToggleCompletion}
        onTogglePinTask={onTogglePinTask}
        onRemoveTask={onRemoveTask}
        onCreateSubTask={onCreateSubTask}
        onEditTask={onEditTask}
        onAssignToProject={onAssignToProject}
        onCreateProjectFromTask={onCreateProjectFromTask}
        onSetRecurring={onSetRecurring}
        onRemoveRecurring={onRemoveRecurring}
        onScheduleTask={onScheduleTask}
      />

      {subTasks.length > 0 && task.isExpanded && (
        <div className="mt-0.5">
          {subTasks.map(subTask => (
            <SidebarTaskRenderer
              key={subTask.id}
              task={subTask}
              level={level + 1}
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
              onCreateSubTask={onCreateSubTask}
              onEditTask={onEditTask}
              onAssignToProject={onAssignToProject}
              onCreateProjectFromTask={onCreateProjectFromTask}
              onSetRecurring={onSetRecurring}
              onRemoveRecurring={onRemoveRecurring}
              onScheduleTask={onScheduleTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarTaskRenderer;
