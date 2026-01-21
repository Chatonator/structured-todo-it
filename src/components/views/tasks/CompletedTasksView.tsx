import React from 'react';
import { ViewLayout, ViewToolbar } from '@/components/layout/view';
import { ViewStats } from '@/components/layout/view/ViewStats';
import { useCompletedViewData } from '@/hooks/view-data';
import { TaskCard } from '@/components/primitives/cards';
import { CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface CompletedTasksViewProps {
  className?: string;
}

const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({ className }) => {
  const { data, state, actions } = useCompletedViewData();

  const stats = [
    {
      id: 'total',
      label: 'Tâches terminées',
      value: data.stats.totalCount,
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      id: 'time',
      label: 'Temps total',
      value: formatDuration(data.stats.totalTime),
      icon: <Clock className="w-4 h-4" />
    },
    {
      id: 'avg',
      label: 'Temps moyen',
      value: formatDuration(data.stats.averageTime),
      icon: <BarChart3 className="w-4 h-4" />
    }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'duration', label: 'Durée' },
    { value: 'name', label: 'Nom' }
  ];

  return (
    <ViewLayout
      header={{
        title: "Tâches terminées",
        subtitle: "Historique de vos accomplissements",
        icon: <CheckCircle className="w-5 h-5" />
      }}
      className={className}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        <ViewStats stats={stats} columns={3} />
        
        <ViewToolbar
          sortOptions={sortOptions}
          sortValue={state.sortBy}
          onSortChange={(value) => actions.setSortBy(value as any)}
        />

        {state.isEmpty ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Aucune tâche terminée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.completedTasks.map(task => (
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
      </div>
    </ViewLayout>
  );
};

export default CompletedTasksView;
