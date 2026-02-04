import React from 'react';
import { ViewLayout, ViewHeader, ViewContent, ViewEmptyState } from '@/components/layout/view';
import { useObservatoryViewData } from '@/hooks/view-data/useObservatoryViewData';
import { 
  InsightsCards, 
  CreationHeatmap, 
  CompletionChart, 
  CategoryDonut,
  TasksTable,
  ActivityTimeline 
} from './components';
import { Telescope } from 'lucide-react';

const ObservatoryView: React.FC = () => {
  const { data, state, actions } = useObservatoryViewData();

  // Determine view state
  const viewState = state.loading 
    ? 'loading' 
    : state.isEmpty 
      ? 'empty' 
      : 'success';

  return (
    <ViewLayout
      state={viewState}
      emptyProps={{
        icon: <Telescope className="w-12 h-12" />,
        title: "Bienvenue dans l'Observatoire",
        description: "Créez votre première tâche pour commencer à suivre votre productivité",
      }}
      header={{
        title: "Observatoire des Tâches",
        subtitle: "Analysez vos patterns de productivité",
        icon: <Telescope className="w-5 h-5" />,
      }}
    >
      <ViewContent className="space-y-6">
        {/* Section 1: Insights Cards */}
        <section>
          <InsightsCards 
            insights={data.insights} 
            onFilterChange={actions.setActiveTab}
          />
        </section>

        {/* Section 2: Visualizations */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CreationHeatmap data={data.charts.creationHeatmap} />
          <CompletionChart data={data.charts.completionTrend} />
          <CategoryDonut 
            data={data.charts.categoryBreakdown} 
            totalActive={data.stats.active}
          />
        </section>

        {/* Section 3: Table + Activity */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <TasksTable
              tasks={data.tasks}
              activeTab={state.activeTab}
              sortField={state.sortField}
              sortDirection={state.sortDirection}
              searchQuery={state.searchQuery}
              selectedTasks={state.selectedTasks}
              stats={data.stats}
              onTabChange={actions.setActiveTab}
              onSort={actions.handleSort}
              onSearch={actions.setSearchQuery}
              onToggleSelection={actions.toggleTaskSelection}
              onSelectAll={actions.selectAllTasks}
              onClearSelection={actions.clearSelection}
              onComplete={actions.toggleTaskCompletion}
              onDelete={actions.removeTask}
              onRestore={actions.restoreTask}
            />
          </div>
          <div>
            <ActivityTimeline activities={data.recentActivity} />
          </div>
        </section>
      </ViewContent>
    </ViewLayout>
  );
};

export default ObservatoryView;
