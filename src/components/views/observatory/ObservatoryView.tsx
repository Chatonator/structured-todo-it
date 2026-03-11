import React, { useEffect, useMemo, useState } from 'react';
import { ViewLayout, ViewContent } from '@/components/layout/view';
import { useObservatoryViewData } from '@/hooks/view-data/useObservatoryViewData';
import { InsightsCards, CreationHeatmap, CompletionChart, CategoryDonut, TasksTable, ActivityTimeline, TaskFolders } from './components';
import {
  Telescope,
  LayoutGrid,
  FolderTree,
  TrendingUp,
  BrainCircuit,
  Target,
  Flame,
  Layers,
  Shield,
  AlertTriangle,
  Gauge,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Ghost,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useGamification } from '@/hooks/useGamification';
import type { WeeklySummary } from '@/lib/rewards';
import { useViewport } from '@/contexts/ViewportContext';

type ViewMode = 'folders' | 'table';
type MobileChart = 'creation' | 'completion' | 'category';

function BarRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium w-10 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

function ObservatoryMetric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

const ObservatoryView: React.FC = () => {
  const { data, state, actions } = useObservatoryViewData();
  const { getWeeklySummary } = useGamification();
  const { isPhone } = useViewport();
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [mobileChart, setMobileChart] = useState<MobileChart>('creation');
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    getWeeklySummary().then(setWeeklySummary);
  }, [getWeeklySummary]);

  const viewState = state.loading ? 'loading' : state.isEmpty ? 'empty' : 'success';

  const chartButtons = useMemo(
    () => [
      { id: 'creation' as const, label: 'Création' },
      { id: 'completion' as const, label: 'Complétion' },
      { id: 'category' as const, label: 'Catégories' },
    ],
    []
  );

  const renderMobileChart = () => {
    switch (mobileChart) {
      case 'completion':
        return <CompletionChart data={data.charts.completionTrend} />;
      case 'category':
        return <CategoryDonut data={data.charts.categoryBreakdown} totalActive={data.stats.active} />;
      case 'creation':
      default:
        return <CreationHeatmap data={data.charts.creationHeatmap} />;
    }
  };

  return (
    <ViewLayout
      state={viewState}
      emptyProps={{
        icon: <Telescope className="w-12 h-12" />,
        title: "Bienvenue dans l'Observatoire",
        description: 'Créez votre première tâche pour commencer à suivre votre productivité',
      }}
      header={{
        title: 'Observatoire',
        subtitle: 'Les tâches d’abord, les analyses ensuite',
        icon: <Telescope className="w-5 h-5" />,
      }}
    >
      <ViewContent className="space-y-6">
        <section className="space-y-4">
          <InsightsCards insights={data.insights} onFilterChange={actions.setActiveTab} />

          <div className={cn('grid gap-3', isPhone ? 'grid-cols-2' : 'grid-cols-4')}>
            <ObservatoryMetric label="Actives" value={data.stats.active} icon={<Clock className="w-3.5 h-3.5" />} />
            <ObservatoryMetric label="Terminées" value={data.stats.completed} icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
            <ObservatoryMetric label="Zombies" value={data.stats.zombie} icon={<Ghost className="w-3.5 h-3.5" />} />
            <ObservatoryMetric label="Maturité" value={`${data.globalMaturity.score}%`} icon={<Gauge className="w-3.5 h-3.5" />} />
          </div>
        </section>

        <section className={cn('grid gap-4', isPhone ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_320px]')}>
          <div className="space-y-4">
            <Card className="border-border/70 bg-card/85 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <CardTitle className="text-base">Pilotage des tâches</CardTitle>
                  <div className="flex items-center gap-2">
                    <Tabs value={state.activeTab} onValueChange={(value) => actions.setActiveTab(value as typeof state.activeTab)} className="w-auto">
                      <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/60 p-1">
                        <TabsTrigger value="active" className="text-xs px-3">Actives ({data.stats.active})</TabsTrigger>
                        <TabsTrigger value="completed" className="text-xs px-3">Terminées ({data.stats.completed})</TabsTrigger>
                        <TabsTrigger value="zombie" className="text-xs px-3">Zombies ({data.stats.zombie})</TabsTrigger>
                        <TabsTrigger value="recent" className="text-xs px-3">Récentes</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {!isPhone && (
                      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                        <button
                          onClick={() => setViewMode('folders')}
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            viewMode === 'folders' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                          )}
                          title="Vue dossiers"
                        >
                          <FolderTree className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                          )}
                          title="Vue tableau"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {isPhone || viewMode === 'folders' ? (
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

          <div className="space-y-4">
            <ActivityTimeline activities={data.recentActivity} />

            {data.cognitiveLoad.isOverloaded && (
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Charge cognitive élevée</AlertTitle>
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 space-y-1 mt-1">
                  <p>
                    {data.cognitiveLoad.openTaskCount} tâches ouvertes · {data.cognitiveLoad.activeProjectCount} projets actifs
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </section>

        <section>
          <button
            onClick={() => setShowAdvanced((value) => !value)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div>
              <div className="font-medium text-foreground">Analyses avancées</div>
              <div className="text-sm text-muted-foreground">Tendances, maturité et répartition du travail</div>
            </div>
            {showAdvanced ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-6">
              {weeklySummary && weeklySummary.totalMinutes > 0 && (
                <Card>
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Résumé hebdomadaire
                      <span className="ml-auto text-xs font-normal text-muted-foreground">
                        Score d'alignement : {weeklySummary.alignmentScore}%
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-2">
                    <BarRow label="Important non-urgent" pct={weeklySummary.pctImportantNotUrgent} color="hsl(var(--primary))" />
                    <BarRow label="Urgent" pct={weeklySummary.pctUrgent} color="hsl(var(--destructive))" />
                    <BarRow label="Maintenance" pct={weeklySummary.pctMaintenance} color="hsl(var(--muted-foreground))" />
                  </CardContent>
                </Card>
              )}

              <section className={cn(isPhone ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-3 gap-4')}>
                {isPhone ? (
                  <>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {chartButtons.map((button) => (
                        <button
                          key={button.id}
                          type="button"
                          onClick={() => setMobileChart(button.id)}
                          className={cn(
                            'whitespace-nowrap rounded-full border px-3 py-2 text-sm transition-colors',
                            mobileChart === button.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-muted-foreground'
                          )}
                        >
                          {button.label}
                        </button>
                      ))}
                    </div>
                    {renderMobileChart()}
                  </>
                ) : (
                  <>
                    <CreationHeatmap data={data.charts.creationHeatmap} />
                    <CompletionChart data={data.charts.completionTrend} />
                    <CategoryDonut data={data.charts.categoryBreakdown} totalActive={data.stats.active} />
                  </>
                )}
              </section>

              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-primary" />
                    Indices de maturité organisationnelle
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <Layers className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Structuration</p>
                        <p className="text-xl font-bold">{data.maturityIndices.structuration}%</p>
                        <p className="text-[10px] text-muted-foreground">tâches structurées complétées</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <Target className="w-4 h-4 text-chart-1 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stratégique</p>
                        <p className="text-xl font-bold">{data.maturityIndices.strategique}%</p>
                        <p className="text-[10px] text-muted-foreground">Q2 sur 60 jours</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <Flame className="w-4 h-4 text-chart-3 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Constance</p>
                        <p className="text-xl font-bold">{data.maturityIndices.constance}</p>
                        <p className="text-[10px] text-muted-foreground">jours actifs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <Target className="w-4 h-4 text-chart-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Long terme</p>
                        <p className="text-xl font-bold">{data.maturityIndices.longTerme}%</p>
                        <p className="text-[10px] text-muted-foreground">tâches en projet</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <Shield className="w-4 h-4 text-chart-2 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Résilience</p>
                        <p className="text-xl font-bold">{data.maturityIndices.resilience}%</p>
                        <p className="text-[10px] text-muted-foreground">tâches anciennes terminées</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-primary" />
                    Indice de maturité organisationnelle
                    <span className="ml-auto text-lg font-bold">{data.globalMaturity.score}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  <Progress value={data.globalMaturity.score} className="h-2" />
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{data.globalMaturity.isBalanced ? '✅ Équilibré' : '⚠️ Déséquilibré'}</span>
                    <span>{data.globalMaturity.highLevelSkillCount}/5 compétences avancées</span>
                  </div>
                  {data.globalMaturity.alerts.length > 0 && (
                    <div className="space-y-1">
                      {data.globalMaturity.alerts.map((alert, index) => (
                        <p key={index} className="text-xs text-muted-foreground">• {alert}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </ViewContent>
    </ViewLayout>
  );
};

export default ObservatoryView;
