import { useState, useMemo, useCallback } from 'react';
import { PROJECT_STATUS_CONFIG } from '@/types/project';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useTasks } from '@/hooks/useTasks';
import { useProjects, ProjectWithKanban } from '@/hooks/useProjects';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { priorityOptions, sortOptions } from '@/config/taskFilterOptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { KanbanBoard, DEFAULT_COLUMNS, KanbanColumn } from './KanbanBoard';
import TaskModal from '@/components/task/TaskModal';
import { Calendar, Search, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types/task';
import ProjectDetailShell from './ProjectDetailShell';

interface ProjectDetailProps {
  project: ProjectWithKanban;
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

export const ProjectDetail = ({ project: projectProp, onBack, onEdit, onDelete }: ProjectDetailProps) => {
  const { getTasksByColumns, updateTaskStatus, reloadTasks } = useProjectTasks(projectProp.id);
  const { addTask, updateTask, removeTask } = useTasks();
  const { deleteProject, completeProject, updateProject, projects } = useProjects();
  const { toast } = useToast();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);

  const project = useMemo(
    () => projects.find(p => p.id === projectProp.id) ?? projectProp,
    [projects, projectProp]
  );

  const columns = useMemo(
    () => project.kanbanColumns || DEFAULT_COLUMNS,
    [project.kanbanColumns]
  );

  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  const allTasks = useMemo(
    () => Object.values(getTasksByColumns(columns)).flat(),
    [columns, getTasksByColumns]
  );

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    priorityFilter,
    setPriorityFilter,
    hasActiveFilters,
    clearFilters,
    filterAndSortTasks,
  } = useTaskFilters<Task>({
    tasks: allTasks,
    getTaskName: task => task.name,
    getSubCategory: task => task.subCategory,
    getEstimatedTime: task => task.estimatedTime || 0,
  });

  const filteredTasksByColumn = useMemo(() => {
    const rawTasks = getTasksByColumns(columns);
    const result: Record<string, Task[]> = {};

    Object.entries(rawTasks).forEach(([columnId, tasks]) => {
      result[columnId] = filterAndSortTasks(tasks);
    });

    return result;
  }, [columns, getTasksByColumns, filterAndSortTasks]);

  const stats = useMemo(() => {
    const tasks = Object.values(filteredTasksByColumn).flat();
    const total = tasks.length;
    const done = filteredTasksByColumn.done?.length || 0;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, progress };
  }, [filteredTasksByColumn]);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ? Cette action est irréversible.`)) {
      const success = await deleteProject(project.id);
      if (success && onDelete) {
        onDelete();
      }
    }
  }, [project.id, project.name, deleteProject, onDelete]);

  const handleComplete = useCallback(async () => {
    if (window.confirm(`Marquer le projet "${project.name}" comme terminé ?`)) {
      const success = await completeProject(project.id);
      if (success) {
        onBack();
      }
    }
  }, [project.id, project.name, completeProject, onBack]);

  const handleToggleSidebar = useCallback(async () => {
    const currentValue = project.showInSidebar ?? false;
    await updateProject(project.id, { showInSidebar: !currentValue });
    toast({
      title: currentValue ? 'Masqué de la sidebar' : 'Affiché dans la sidebar',
      description: currentValue
        ? 'Les tâches de ce projet ne s\'affichent plus dans la sidebar'
        : 'Les tâches de ce projet apparaissent maintenant dans la sidebar',
    });
  }, [project, updateProject, toast]);

  const handleColumnsChange = useCallback(async (newColumns: KanbanColumn[]) => {
    const success = await updateProject(project.id, { kanbanColumns: newColumns });
    if (success) {
      reloadTasks();
      toast({
        title: 'Colonnes mises à jour',
        description: 'La configuration du tableau Kanban a été sauvegardée.',
      });
    }
  }, [project.id, updateProject, reloadTasks, toast]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  }, []);

  const handleToggleComplete = useCallback(async (taskId: string) => {
    const task = Object.values(filteredTasksByColumn).flat().find(item => item.id === taskId);
    if (task) {
      await updateTaskStatus(taskId, !task.isCompleted ? 'done' : 'todo');
    }
  }, [filteredTasksByColumn, updateTaskStatus]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await removeTask(taskId);
    reloadTasks();
    toast({
      title: 'Tâche supprimée',
      description: 'La tâche a été supprimée avec succès.',
    });
  }, [removeTask, reloadTasks, toast]);

  const handleCreateTask = useCallback(() => {
    setSelectedTask(null);
    setShowTaskModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowTaskModal(false);
    setSelectedTask(null);
    reloadTasks();
  }, [reloadTasks]);

  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    await addTask(taskData);
    reloadTasks();
  }, [addTask, reloadTasks]);

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);
    reloadTasks();
  }, [updateTask, reloadTasks]);

  const activeFilterBadges = [
    searchQuery ? <Badge key="search" variant="secondary" className="gap-1">Recherche: "{searchQuery}"</Badge> : null,
    priorityFilter !== 'all' ? <Badge key="priority" variant="secondary" className="gap-1">{priorityFilter}</Badge> : null,
    sortBy !== 'none' ? <Badge key="sort" variant="secondary" className="gap-1">Tri: {sortOptions.find(option => option.value === sortBy)?.label}</Badge> : null,
  ].filter(Boolean) as React.ReactNode[];

  const statsCards = [
    <div key="progress" className="bg-card p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Progression</p>
          <p className="text-2xl font-bold">{stats.progress}%</p>
        </div>
        <Target className="w-8 h-8 text-project" />
      </div>
      <Progress value={stats.progress} className="mt-2" />
    </div>,
    project.targetDate ? (
      <div key="date" className="bg-card p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Date cible</p>
            <p className="text-lg font-semibold">
              {new Date(project.targetDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    ) : null,
    <div key="tasks" className="bg-card p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tâches totales</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="text-sm text-muted-foreground">{stats.done} terminées</div>
      </div>
    </div>,
  ].filter(Boolean) as React.ReactNode[];

  return (
    <ProjectDetailShell
      project={project}
      statusBadge={{ label: statusConfig.label, className: `${statusConfig.bgColor} ${statusConfig.color}` }}
      statsGridClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
      statsCards={statsCards}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      priorityFilter={priorityFilter}
      onPriorityFilterChange={setPriorityFilter}
      priorityOptions={priorityOptions}
      sortBy={sortBy}
      onSortByChange={setSortBy}
      sortOptions={sortOptions}
      hasActiveFilters={hasActiveFilters}
      clearFilters={clearFilters}
      activeFilterBadges={activeFilterBadges}
      filteredTasksByColumn={filteredTasksByColumn}
      columns={columns}
      onStatusChange={updateTaskStatus}
      onTaskClick={handleTaskClick}
      onToggleComplete={handleToggleComplete}
      onDeleteTask={handleDeleteTask}
      showColumnManager={showColumnManager}
      onOpenColumnManager={() => setShowColumnManager(true)}
      onCloseColumnManager={() => setShowColumnManager(false)}
      onColumnsChange={handleColumnsChange}
      onBack={onBack}
      onEdit={onEdit}
      onComplete={handleComplete}
      onDelete={handleDelete}
      onToggleSidebar={handleToggleSidebar}
      onCreateTask={handleCreateTask}
      showCompleteAction={project.status !== 'completed'}
      taskModal={showTaskModal ? (
        <TaskModal
          isOpen={showTaskModal}
          onClose={handleCloseModal}
          editingTask={selectedTask || undefined}
          projectId={project.id}
          taskType="project"
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
        />
      ) : undefined}
    />
  );
};
