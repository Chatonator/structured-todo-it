import React from 'react';
import { CheckSquare } from 'lucide-react';
import { ViewLayout } from '@/components/layout/view';
import { TaskBacklogSurface } from '@/components/backlog/TaskBacklogSurface';

interface TasksViewProps {
  className?: string;
}

const TasksView: React.FC<TasksViewProps> = ({ className }) => {
  return (
    <ViewLayout
      header={{
        title: 'Tâches',
        subtitle: 'Pilotez votre backlog quotidien',
        icon: <CheckSquare className="w-5 h-5" />,
      }}
      className={className}
      state="success"
    >
      <TaskBacklogSurface variant="page" />
    </ViewLayout>
  );
};

export default TasksView;
