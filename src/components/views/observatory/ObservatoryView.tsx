import React, { useState } from 'react';
import { ViewLayout, ViewContent } from '@/components/layout/view';
import { useObservatoryViewData } from '@/hooks/view-data/useObservatoryViewData';
import { 
  InsightsCards, 
  CreationHeatmap, 
  CompletionChart, 
  CategoryDonut,
  TasksTable,
  ActivityTimeline,
  TaskFolders
} from './components';
import { Telescope, LayoutGrid, FolderTree } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type ViewMode = 'folders' | 'table';

const ObservatoryView: React.FC = () => {
  const { data, state, actions } = useObservatoryViewData();
  const [viewMode, setViewMode] = useState<ViewMode>('folders');

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

        {/* Section 3: Tasks View with Mode Toggle */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            {/* View mode toggle + Tab filters */}
            <div className="flex items-center justify-between gap-4">
              <Tabs 
                value={state.activeTab} 
                onValueChange={(v) => actions.setActiveTab(v as typeof state.activeTab)}
                className="w-auto"
              >
                <TabsList className="h-9">
                  <TabsTrigger value="active" className="text-xs px-3">
                    Actives ({data.stats.active})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs px-3">
                    Terminées ({data.stats.completed})
                  </TabsTrigger>
                  <TabsTrigger value="zombie" className="text-xs px-3">
                    Zombies ({data.stats.zombie})
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="text-xs px-3">
                    Récentes
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('folders')}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === 'folders' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Vue dossiers"
                >
                  <FolderTree className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === 'table' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Vue tableau"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Task content based on view mode */}
            {viewMode === 'folders' ? (
              <TaskFolders
                groups={data.groupedTasks}
                onComplete={actions.toggleTaskCompletion}
                onDelete={actions.removeTask}
                onRestore={actions.restoreTask}
              />
            ) : (
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
                hideTabBar
              />
            )}
          </div>
          
          {/* Activity Timeline */}
          <div>
            <ActivityTimeline activities={data.recentActivity} />
          </div>
        </section>
      </ViewContent>
    </ViewLayout>
  );
};

export default ObservatoryView;
