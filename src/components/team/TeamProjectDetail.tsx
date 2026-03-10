import { useState, useMemo, useCallback } from 'react';
import { computeCompletionStats } from '@/lib/formatters';
import { PROJECT_STATUS_CONFIG } from '@/types/project';
import { TeamProject } from '@/hooks/useTeamProjects';
import { useTeamProjectTasks } from '@/hooks/useTeamProjectTasks';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { TeamTask } from '@/hooks/useTeamTasks';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { priorityOptions, teamSortOptions, TeamSortOption } from '@/config/taskFilterOptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import TaskModal from '@/components/task/TaskModal';
import { Calendar, Target, UserPlus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types/task';
import { DEFAULT_COLUMNS, KanbanColumn } from '@/components/projects/KanbanBoard';
import ProjectDetailShell from '@/components/projects/ProjectDetailShell';
import type { TeamMember } from '@/hooks/useTeams';

interface TeamProjectDetailProps {
  project: TeamProject;
  teamId: string;
  teamMembers: TeamMember[];
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

const getDisplayName = (member: TeamMember): string => {
  return member.profiles?.display_name || 'Membre';
};

export const TeamProjectDetail = ({
  project: projectProp,
  teamId,
  teamMembers,
  onBack,
  onEdit,
  onDelete,
}: TeamProjectDetailProps) => {
  const {
    tasks: projectTasks,
    getTasksByColumns,
    updateTaskStatus,
    reloadTasks,
    createTask,
    deleteTask: removeTask,
    toggleComplete,
    updateTask,
  } = useTeamProjectTasks(teamId, projectProp.id);

  const { projects, updateProject } = useTeamProjects(teamId);
  const { toast } = useToast();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);

  const project = useMemo(
    () => projects.find(item => item.id === projectProp.id) ?? projectProp,
    [projects, projectProp]
  );

  const columns = useMemo(
    () => project.kanbanColumns || DEFAULT_COLUMNS,
    [project.kanbanColumns]
  );

  const statusConfig = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.planning;

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
  } = useTaskFilters<TeamTask>({
    tasks: projectTasks,
    getTaskName: task => task.name,
    getSubCategory: task => task.subCategory,
    getEstimatedTime: task => task.estimatedTime || 0,
    getAssignedTo: task => task.assigned_to,
  });

  const filteredTasksByColumn = useMemo(() => {
    const rawTasks = getTasksByColumns(columns);
    const result: Record<string, Task[]> = {};

    Object.entries(rawTasks).forEach(([columnId, tasks]) => {
      result[columnId] = filterAndSortTasks(tasks) as unknown as Task[];
    });

    return result;
  }, [columns, getTasksByColumns, filterAndSortTasks]);

  const stats = useMemo(() => {
    const { total, completed: done, completionRate: progress } = computeCompletionStats(projectTasks, task => task.isCompleted);
    const assigned = projectTasks.filter(task => task.assigned_to).length;
    return { total, done, progress, assigned };
  }, [projectTasks]);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
      onDelete?.();
    }
  }, [project.name, onDelete]);

  const handleComplete = useCallback(async () => {
    if (window.confirm(`Marquer le projet "${project.name}" comme terminé ?`)) {
      const success = await updateProject(project.id, { status: 'completed' });
      if (success) {
        toast({
          title: 'Projet terminé',
          description: `Le projet "${project.name}" a été marqué comme terminé.`,
        });
        onBack();
      }
    }
  }, [project.id, project.name, updateProject, toast, onBack]);

  const handleToggleSidebar = useCallback(async () => {
    const newValue = !project.showInSidebar;
    const success = await updateProject(project.id, { showInSidebar: newValue });
    if (success) {
      toast({
        title: newValue ? 'Affiché dans la sidebar' : 'Masqué de la sidebar',
        description: newValue
          ? 'Les tâches de ce projet apparaissent dans la sidebar'
          : 'Les tâches de ce projet sont masquées de la sidebar',
      });
    }
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
    const teamTask = projectTasks.find(item => item.id === task.id);
    if (teamTask) {
      setSelectedTask(teamTask);
      setShowTaskModal(true);
    }
  }, [projectTasks]);

  const handleToggleComplete = useCallback(async (taskId: string) => {
    const task = projectTasks.find(item => item.id === taskId);
    if (task) {
      await toggleComplete(taskId, !task.isCompleted);
    }
  }, [projectTasks, toggleComplete]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await removeTask(taskId);
    toast({
      title: 'Tâche supprimée',
      description: 'La tâche a été supprimée avec succès.',
    });
  }, [removeTask, toast]);

  const handleCreateTask = useCallback(() => {
    setSelectedTask(null);
    setShowTaskModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowTaskModal(false);
    setSelectedTask(null);
    reloadTasks();
  }, [reloadTasks]);

  const handleAddTask = useCallback(async (taskData: Partial<TeamTask>) => {
    await createTask({
      ...taskData,
      project_id: project.id,
    });
    reloadTasks();
  }, [createTask, project.id, reloadTasks]);

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<TeamTask>) => {
    await updateTask(taskId, updates);
    reloadTasks();
  }, [updateTask, reloadTasks]);

  const getMemberInitials = useCallback((userId: string | null): string => {
    if (!userId) return '?';
    const member = teamMembers.find(item => item.user_id === userId);
    if (!member) return '?';
    const name = getDisplayName(member);
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  }, [teamMembers]);

  const renderTaskBadge = useCallback((task: Task) => {
    const teamTask = task as unknown as TeamTask;
    if (!teamTask.assigned_to) return null;

    const member = teamMembers.find(item => item.user_id === teamTask.assigned_to);
    const displayName = member ? getDisplayName(member) : 'Assigné';

    return (
      <Avatar className="h-5 w-5" title={displayName}>
        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
          {getMemberInitials(teamTask.assigned_to)}
        </AvatarFallback>
      </Avatar>
    );
  }, [teamMembers, getMemberInitials]);

  const activeFilterBadges = [
    searchQuery ? <Badge key="search" variant="secondary" className="gap-1">Recherche: "{searchQuery}"</Badge> : null,
    priorityFilter !== 'all' ? <Badge key="priority" variant="secondary" className="gap-1">{priorityFilter}</Badge> : null,
    sortBy !== 'none' ? <Badge key="sort" variant="secondary" className="gap-1">Tri: {teamSortOptions.find(option => option.value === sortBy)?.label}</Badge> : null,
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
    <div key="tasks" className="bg-card p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tâches</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="text-sm text-muted-foreground">{stats.done} terminées</div>
      </div>
    </div>,
    <div key="assigned" className="bg-card p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Assignées</p>
          <p className="text-2xl font-bold">{stats.assigned}</p>
        </div>
        <UserPlus className="w-8 h-8 text-blue-500" />
      </div>
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
  ].filter(Boolean) as React.ReactNode[];

  const boardHeaderAside = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
      </span>
      <div className="flex -space-x-2">
        {teamMembers.slice(0, 5).map(member => (
          <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
            <AvatarFallback className="text-xs">
              {getDisplayName(member).split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        ))}
        {teamMembers.length > 5 && (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
            +{teamMembers.length - 5}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ProjectDetailShell
      project={project}
      statusBadge={{ label: statusConfig.label, className: `${statusConfig.bgColor} ${statusConfig.color}` }}
      titleBadge={
        <Badge variant="outline" className="gap-1">
          <Users className="w-3 h-3" />
          Équipe
        </Badge>
      }
      statsGridClassName="grid grid-cols-1 md:grid-cols-4 gap-4"
      statsCards={statsCards}
      boardHeaderAside={boardHeaderAside}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      priorityFilter={priorityFilter}
      onPriorityFilterChange={setPriorityFilter}
      priorityOptions={priorityOptions}
      sortBy={sortBy}
      onSortByChange={(value) => setSortBy(value as TeamSortOption)}
      sortOptions={teamSortOptions}
      hasActiveFilters={hasActiveFilters}
      clearFilters={clearFilters}
      activeFilterBadges={activeFilterBadges}
      filteredTasksByColumn={filteredTasksByColumn}
      columns={columns}
      onStatusChange={updateTaskStatus}
      onTaskClick={handleTaskClick}
      onToggleComplete={handleToggleComplete}
      onDeleteTask={handleDeleteTask}
      renderTaskBadge={renderTaskBadge}
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
      taskModal={
        <TaskModal
          isOpen={showTaskModal}
          onClose={handleCloseModal}
          editingTask={selectedTask ? ({ ...selectedTask, user_id: '' } as Task) : undefined}
          onAddTask={async (data) => {
            await handleAddTask(data as Partial<TeamTask>);
            handleCloseModal();
          }}
          onUpdateTask={async (taskId, updates) => {
            await handleUpdateTask(taskId, updates as Partial<TeamTask>);
            handleCloseModal();
          }}
          projectId={project.id}
          taskType="team"
          teamMembers={teamMembers.map(member => ({
            user_id: member.user_id,
            display_name: member.profiles?.display_name || undefined,
          }))}
        />
      }
    />
  );
};

export default TeamProjectDetail;
