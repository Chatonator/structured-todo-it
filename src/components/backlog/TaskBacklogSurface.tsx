import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarClock, CheckSquare, FolderKanban, Layers3, ListFilter, Pin, Users } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskModal from '@/components/task/TaskModal';
import SidebarQuickAdd from '@/components/sidebar/SidebarQuickAdd';
import SidebarSearchFilter, { TaskFilters, defaultFilters } from '@/components/sidebar/SidebarSearchFilter';
import SidebarSortSelector from '@/components/sidebar/SidebarSortSelector';
import SidebarTaskRenderer from '@/components/sidebar/SidebarTaskRenderer';
import { useSidebarProjectActions } from '@/components/sidebar/hooks';
import { useSidebarFilters } from '@/components/sidebar/hooks/useSidebarFilters';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { BacklogTaskCard } from '@/components/backlog/BacklogTaskCard';
import { Task, TaskCategory, TaskContext, CATEGORY_DISPLAY_NAMES } from '@/types/task';
import { cn } from '@/lib/utils';
import { canAddSubTask } from '@/utils/taskValidation';
import { useToast } from '@/hooks/use-toast';

interface TaskBacklogSurfaceProps {
  variant?: 'sidebar' | 'page' | 'mobile';
  className?: string;
}

type MobileBacklogSectionId = 'free' | 'scheduled' | 'projects' | 'team';

const categories: TaskCategory[] = ['critical', 'urgent', 'important', 'low_priority'];
const contexts: TaskContext[] = ['Pro', 'Perso'];

const BacklogSection: React.FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, count, icon, defaultOpen = true, children }) => {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card className="overflow-hidden border-border/70">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                <p className="text-xs text-muted-foreground">{count} élément{count > 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const MobileSectionButton: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}> = ({ label, count, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors whitespace-nowrap',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
          active ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {count}
      </span>
    </button>
  );
};

const FilterSheetContent: React.FC<{
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}> = ({ filters, onFiltersChange }) => {
  const toggleCategory = (category: TaskCategory) => {
    const next = filters.categories.includes(category)
      ? filters.categories.filter((entry) => entry !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: next });
  };

  const toggleContext = (context: TaskContext) => {
    const next = filters.contexts.includes(context)
      ? filters.contexts.filter((entry) => entry !== context)
      : [...filters.contexts, context];
    onFiltersChange({ ...filters, contexts: next });
  };

  return (
    <div className="space-y-6 px-1 pb-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Catégories</h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
              <Checkbox checked={filters.categories.includes(category)} onCheckedChange={() => toggleCategory(category)} />
              <span>{CATEGORY_DISPLAY_NAMES[category]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Contextes</h3>
        <div className="space-y-2">
          {contexts.map((context) => (
            <label key={context} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
              <Checkbox checked={filters.contexts.includes(context)} onCheckedChange={() => toggleContext(context)} />
              <span>{context === 'Pro' ? '💼 Pro' : '🏠 Perso'}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Statut</h3>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
          <Checkbox
            checked={filters.showPinned}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, showPinned: checked === true })}
          />
          <span>📌 Tâches épinglées uniquement</span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
          <Checkbox
            checked={filters.showRecurring}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, showRecurring: checked === true })}
          />
          <span>🔄 Tâches récurrentes uniquement</span>
        </label>
      </section>

      <Button variant="outline" className="w-full rounded-xl" onClick={() => onFiltersChange(defaultFilters)}>
        Réinitialiser les filtres
      </Button>
    </div>
  );
};

export const TaskBacklogSurface: React.FC<TaskBacklogSurfaceProps> = ({
  variant = 'page',
  className,
}) => {
  const { toast } = useToast();
  const {
    tasks,
    mainTasks,
    pinnedTasks,
    recurringTaskIds,
    taskSchedules,
    onRemoveTask,
    onToggleExpansion,
    onToggleCompletion,
    onTogglePinTask,
    onAddTask,
    onUpdateTask,
    onSetRecurring,
    onRemoveRecurring,
    onScheduleTask,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    selectedTasks,
    onToggleSelection,
    projects,
  } = useSidebarContext();

  const activeMainTasks = mainTasks.filter((task) => !task.isCompleted);
  const { searchQuery, setSearchQuery, filters, setFilters, sortConfig, setSortConfig, sortedTasks } = useSidebarFilters(
    activeMainTasks,
    pinnedTasks,
    recurringTaskIds
  );
  const { handleAssignToProject, handleCreateProjectFromTask } = useSidebarProjectActions(tasks, getSubTasks);

  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MobileBacklogSectionId>('free');

  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((project) => map.set(project.id, project.name));
    return map;
  }, [projects]);

  const scheduledTasks = useMemo(() => {
    return sortedTasks.filter((task) => !!taskSchedules[task.id]);
  }, [sortedTasks, taskSchedules]);

  const unscheduledTasks = useMemo(() => {
    return sortedTasks.filter((task) => !taskSchedules[task.id]);
  }, [sortedTasks, taskSchedules]);

  const teamTasks = useMemo(() => {
    return unscheduledTasks.filter((task) => Boolean((task as any).team_id || (task as any).teamId));
  }, [unscheduledTasks]);

  const projectTasks = useMemo(() => {
    return unscheduledTasks.filter((task) => task.projectId && !((task as any).team_id || (task as any).teamId));
  }, [unscheduledTasks]);

  const freeTasks = useMemo(() => {
    return unscheduledTasks.filter((task) => !task.projectId && !((task as any).team_id || (task as any).teamId));
  }, [unscheduledTasks]);

  const groupedProjectTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();
    projectTasks.forEach((task) => {
      const projectId = task.projectId!;
      const current = groups.get(projectId) || [];
      current.push(task);
      groups.set(projectId, current);
    });
    return Array.from(groups.entries()).map(([projectId, projectTaskList]) => ({
      projectId,
      projectName: projectNameMap.get(projectId) || 'Projet',
      tasks: projectTaskList,
    }));
  }, [projectNameMap, projectTasks]);

  const mobileSections = useMemo(() => {
    const sections: Array<{ id: MobileBacklogSectionId; label: string; count: number }> = [
      { id: 'free', label: 'Libres', count: freeTasks.length },
      { id: 'scheduled', label: 'Planifiées', count: scheduledTasks.length },
      { id: 'projects', label: 'Projets', count: projectTasks.length },
    ];

    if (teamTasks.length > 0) {
      sections.push({ id: 'team', label: 'Équipe', count: teamTasks.length });
    }

    return sections;
  }, [freeTasks.length, scheduledTasks.length, projectTasks.length, teamTasks.length]);

  const activeFilterCount =
    filters.categories.length +
    filters.contexts.length +
    (filters.showPinned ? 1 : 0) +
    (filters.showRecurring ? 1 : 0);

  const handleCreateSubTask = (parentTask: Task) => {
    const siblingCount = tasks.filter((task) => task.parentId === parentTask.id).length;
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

  const renderTaskCards = (taskList: Task[], mode: 'free' | 'scheduled' | 'project' | 'team') => {
    if (taskList.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucune tâche dans cette section.
          </CardContent>
        </Card>
      );
    }

    return taskList.map((task) => (
      <BacklogTaskCard
        key={task.id}
        task={task}
        totalTime={calculateTotalTime(task)}
        isPinned={pinnedTasks.includes(task.id)}
        subTaskCount={getSubTasks(task.id).filter((entry) => !entry.isCompleted).length}
        isTeamTask={mode === 'team' || Boolean((task as any).team_id || (task as any).teamId)}
        schedule={mode === 'scheduled' ? taskSchedules[task.id] || null : null}
        onToggleComplete={onToggleCompletion}
        onEdit={handleEditTask}
        onDelete={onRemoveTask}
        onTogglePin={onTogglePinTask}
        onCreateSubTask={handleCreateSubTask}
      />
    ));
  };

  const taskModals = (
    <>
      {selectedParentTask && (
        <TaskModal
          isOpen={isSubTaskModalOpen}
          onClose={() => {
            setIsSubTaskModalOpen(false);
            setSelectedParentTask(null);
          }}
          onAddTask={(taskData) => {
            onAddTask({
              ...taskData,
              parentId: selectedParentTask.id,
              level: (selectedParentTask.level + 1) as 0 | 1 | 2,
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
          editingTask={editingTask || undefined}
        />
      )}
    </>
  );

  const filterSheet = (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-[28px] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-5">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Filtrer les tâches</SheetTitle>
        </SheetHeader>
        <FilterSheetContent filters={filters} onFiltersChange={setFilters} />
      </SheetContent>
    </Sheet>
  );

  if (variant === 'mobile') {
    return (
      <div className={cn('space-y-4 px-1', className)}>
        <div className="rounded-[28px] border border-border bg-card/95 p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Mobile</p>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Tâches essentielles</h2>
                <p className="text-sm text-muted-foreground">Ajoutez, filtrez et traitez votre backlog sans passer par la sidebar.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="relative h-11 w-11 rounded-2xl" onClick={() => setIsFilterSheetOpen(true)}>
                  <ListFilter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                <div className="shrink-0 rounded-2xl border border-border bg-background px-1">
                  <SidebarSortSelector sortConfig={sortConfig} onSortChange={setSortConfig} />
                </div>
              </div>
            </div>

            <SidebarQuickAdd />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher une tâche..."
              className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
            />

            <div className="flex gap-2 overflow-x-auto pb-1">
              {mobileSections.map((section) => (
                <MobileSectionButton
                  key={section.id}
                  label={section.label}
                  count={section.count}
                  active={mobileSection === section.id}
                  onClick={() => setMobileSection(section.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {filters.categories.map((category) => (
              <Badge key={category} variant="secondary" className="gap-1 rounded-full">
                {CATEGORY_DISPLAY_NAMES[category]}
              </Badge>
            ))}
            {filters.contexts.map((context) => (
              <Badge key={context} variant="secondary" className="gap-1 rounded-full">
                {context}
              </Badge>
            ))}
            {filters.showPinned && (
              <Badge variant="secondary" className="gap-1 rounded-full">
                <Pin className="h-3 w-3" />
                Épinglées
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-4">
          {mobileSection === 'free' && (
            <div className="space-y-3">
              <div className="px-1">
                <h3 className="text-sm font-semibold text-foreground">Tâches libres</h3>
                <p className="text-xs text-muted-foreground">Celles qui ne sont pas encore rangées dans un projet.</p>
              </div>
              {renderTaskCards(freeTasks, 'free')}
            </div>
          )}

          {mobileSection === 'scheduled' && (
            <div className="space-y-3">
              <div className="px-1">
                <h3 className="text-sm font-semibold text-foreground">Planifiées</h3>
                <p className="text-xs text-muted-foreground">Vos tâches déjà placées dans le temps.</p>
              </div>
              {renderTaskCards(scheduledTasks, 'scheduled')}
            </div>
          )}

          {mobileSection === 'projects' && (
            <div className="space-y-4">
              <div className="px-1">
                <h3 className="text-sm font-semibold text-foreground">Par projet</h3>
                <p className="text-xs text-muted-foreground">Chaque projet garde son propre bloc, pour éviter le mélange.</p>
              </div>
              {groupedProjectTasks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Aucune tâche de projet active.
                  </CardContent>
                </Card>
              ) : (
                groupedProjectTasks.map((group) => (
                  <div key={group.projectId} className="space-y-3 rounded-[24px] border border-border bg-card/90 p-3 shadow-sm">
                    <div className="flex items-center gap-3 px-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">{group.projectName}</h3>
                        <p className="text-xs text-muted-foreground">{group.tasks.length} tâche{group.tasks.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="space-y-3">{renderTaskCards(group.tasks, 'project')}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {mobileSection === 'team' && (
            <div className="space-y-3">
              <div className="px-1">
                <h3 className="text-sm font-semibold text-foreground">Équipe</h3>
                <p className="text-xs text-muted-foreground">Les tâches partagées restent à part du personnel.</p>
              </div>
              {renderTaskCards(teamTasks, 'team')}
            </div>
          )}
        </div>

        {filterSheet}
        {taskModals}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="space-y-2 border-b border-sidebar-border px-2 py-2">
          <SidebarQuickAdd />
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

        <div className="space-y-1 px-2 pb-2">
          {sortedTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-sidebar-border px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune tâche active
            </div>
          ) : (
            sortedTasks.map((task) => (
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
            ))
          )}
        </div>

        {taskModals}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <SidebarQuickAdd />
          <div className="mt-3 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher une tâche..."
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <Button variant="outline" size="icon" className="relative h-11 w-11 rounded-xl" onClick={() => setIsFilterSheetOpen(true)}>
              <ListFilter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <div className="shrink-0">
              <SidebarSortSelector sortConfig={sortConfig} onSortChange={setSortConfig} />
            </div>
          </div>
        </div>
      </div>

      {scheduledTasks.length > 0 && (
        <BacklogSection title="Planifiées" count={scheduledTasks.length} icon={<CalendarClock className="h-4 w-4" />}>
          {renderTaskCards(scheduledTasks, 'scheduled')}
        </BacklogSection>
      )}

      <BacklogSection title="À planifier" count={freeTasks.length} icon={<CheckSquare className="h-4 w-4" />}>
        {freeTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune tâche libre à planifier.</p>
        ) : (
          renderTaskCards(freeTasks, 'free')
        )}
      </BacklogSection>

      {groupedProjectTasks.map((group) => (
        <BacklogSection
          key={group.projectId}
          title={group.projectName}
          count={group.tasks.length}
          icon={<FolderKanban className="h-4 w-4" />}
          defaultOpen={false}
        >
          {renderTaskCards(group.tasks, 'project')}
        </BacklogSection>
      ))}

      {teamTasks.length > 0 && (
        <BacklogSection title="Équipe" count={teamTasks.length} icon={<Users className="h-4 w-4" />} defaultOpen={false}>
          {renderTaskCards(teamTasks, 'team')}
        </BacklogSection>
      )}

      {sortedTasks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucune tâche ne correspond aux filtres actuels.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {filters.categories.map((category) => (
          <Badge key={category} variant="secondary" className="gap-1 rounded-full">
            {CATEGORY_DISPLAY_NAMES[category]}
          </Badge>
        ))}
        {filters.contexts.map((context) => (
          <Badge key={context} variant="secondary" className="gap-1 rounded-full">
            {context}
          </Badge>
        ))}
        {filters.showPinned && (
          <Badge variant="secondary" className="gap-1 rounded-full">
            <Pin className="h-3 w-3" />
            Épinglées
          </Badge>
        )}
      </div>

      {filterSheet}
      {taskModals}
    </div>
  );
};

export default TaskBacklogSurface;
