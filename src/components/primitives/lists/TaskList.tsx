import React from 'react';
import { Task } from '@/types/task';
import { TaskCard, TaskCardProps } from '../cards/TaskCard';
import { ItemList } from './ItemList';
import { CheckSquare } from 'lucide-react';

export interface TaskListProps {
  tasks: Task[];
  
  // TaskCard options
  variant?: TaskCardProps['variant'];
  showCategory?: boolean;
  showDuration?: boolean;
  showPinned?: boolean;
  
  // Callbacks
  onTaskClick?: (task: Task) => void;
  
  // Time calculation
  calculateTotalTime?: (task: Task) => number;
  
  // États
  loading?: boolean;
  
  // Empty state
  emptyTitle?: string;
  emptyMessage?: string;
  
  // Layout
  layout?: 'list' | 'grid';
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  
  // Styling
  className?: string;
}

/**
 * TaskList - Liste de tâches utilisant TaskCard
 * 
 * @example
 * <TaskList
 *   tasks={activeTasks}
 *   variant="compact"
 *   onTaskClick={handleTaskClick}
 *   layout="grid"
 *   columns={2}
 * />
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  variant = 'default',
  showCategory = true,
  showDuration = true,
  showPinned = false,
  onTaskClick,
  calculateTotalTime,
  loading = false,
  emptyTitle = "Aucune tâche",
  emptyMessage = "Créez votre première tâche pour commencer",
  layout = 'list',
  columns = 1,
  gap = 'md',
  className,
}) => {
  return (
    <ItemList
      items={tasks}
      keyExtractor={(task) => task.id}
      loading={loading}
      emptyIcon={<CheckSquare className="w-8 h-8" />}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      layout={layout}
      columns={columns}
      gap={gap}
      className={className}
      renderItem={(task) => (
        <TaskCard
          task={task}
          variant={variant}
          totalTime={calculateTotalTime?.(task)}
          showCategory={showCategory}
          showDuration={showDuration}
          showPinned={showPinned}
          onClick={onTaskClick ? () => onTaskClick(task) : undefined}
        />
      )}
    />
  );
};

export default TaskList;
