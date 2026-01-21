import React from 'react';
import { ViewLayout } from '@/components/layout/view';
import { ViewStats } from '@/components/layout/view/ViewStats';
import { useTasksViewData } from '@/hooks/view-data';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { useApp } from '@/contexts/AppContext';
import { TaskList } from '@/components/primitives/lists';
import { Clock, CheckCircle, ListTodo, Timer } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface TasksViewProps {
  className?: string;
}

const TasksView: React.FC<TasksViewProps> = ({ className }) => {
  const viewData = useViewDataContext();
  const { setCurrentView } = useApp();
  
  const activeTasks = viewData.tasks.filter(t => !t.isCompleted);
  const completedTasks = viewData.tasks.filter(t => t.isCompleted);
  
  const totalTime = activeTasks.reduce((sum, t) => sum + t.estimatedTime, 0);

  const stats = [
    {
      id: 'active',
      label: 'Tâches actives',
      value: activeTasks.length,
      icon: <ListTodo className="w-4 h-4" />
    },
    {
      id: 'completed',
      label: 'Terminées',
      value: completedTasks.length,
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      id: 'time',
      label: 'Temps total',
      value: formatDuration(totalTime),
      icon: <Timer className="w-4 h-4" />
    }
  ];

  return (
    <ViewLayout
      header={{
        title: "Tâches",
        subtitle: "Gérez vos tâches quotidiennes",
        icon: <ListTodo className="w-5 h-5" />
      }}
      className={className}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        <ViewStats stats={stats} columns={3} />
        
        <TaskList
          tasks={activeTasks}
          calculateTotalTime={viewData.calculateTotalTime}
          onTaskClick={(task) => viewData.toggleTaskCompletion(task.id)}
          emptyMessage="Aucune tâche active"
        />
      </div>
    </ViewLayout>
  );
};

export default TasksView;
