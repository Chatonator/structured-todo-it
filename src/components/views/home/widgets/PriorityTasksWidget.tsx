import React from 'react';
import { Target, ArrowRight } from 'lucide-react';
import { ViewSection } from '@/components/layout/view';
import { TaskCard } from '@/components/primitives';
import { useHomeViewData } from '@/hooks/view-data';
import { useApp } from '@/contexts/AppContext';

const PriorityTasksWidget: React.FC = () => {
  const { setCurrentView } = useApp();
  const { data } = useHomeViewData();

  return (
    <ViewSection
      title="Tâches prioritaires"
      icon={<Target className="w-5 h-5" />}
      variant="card"
      showViewAll
      viewAllLabel="Voir tout"
      onViewAll={() => setCurrentView('tasks' as any)}
    >
      {data.topPriorityTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucune tâche prioritaire
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {data.topPriorityTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              totalTime={task.estimatedTime}
              variant="compact"
              showCategory
              showDuration
            />
          ))}
        </div>
      )}
    </ViewSection>
  );
};

export default PriorityTasksWidget;
