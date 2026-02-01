/**
 * TeamProjectDetail - Vue détail d'un projet d'équipe avec Kanban
 * Équivalent de ProjectDetail mais pour les équipes
 * Utilise useTeamProjectTasks et useTeamTasks
 */

import { useState, useMemo, useCallback } from 'react';
import { PROJECT_STATUS_CONFIG } from '@/types/project';
import { TeamProject } from '@/hooks/useTeamProjects';
import { useTeamProjectTasks } from '@/hooks/useTeamProjectTasks';
import { useTeamTasks, TeamTask } from '@/hooks/useTeamTasks';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { priorityOptions, teamSortOptions, TeamSortOption } from '@/config/taskFilterOptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { KanbanBoard, DEFAULT_COLUMNS, KanbanColumn } from '@/components/projects/KanbanBoard';
import { KanbanColumnManager } from '@/components/projects/KanbanColumnManager';
import TaskModal from '@/components/task/TaskModal';
import { 
  ArrowLeft, Edit, Plus, Calendar, Target, Trash2, 
  Search, Filter, ArrowUpDown, X, CheckCircle2,
  Users, UserPlus, ListPlus, Settings2, Eye, EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types/task';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { TeamMember } from '@/hooks/useTeams';

interface TeamProjectDetailProps {
  project: TeamProject;
  teamId: string;
  teamMembers: TeamMember[];
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

// Helper to get display name
const getDisplayName = (member: TeamMember): string => {
  return member.profiles?.display_name || 'Membre';
};

export const TeamProjectDetail = ({ 
  project: projectProp, 
  teamId,
  teamMembers,
  onBack, 
  onEdit, 
  onDelete 
}: TeamProjectDetailProps) => {
  const { 
    tasks: projectTasks, 
    getTasksByColumns, 
    updateTaskStatus, 
    reloadTasks 
  } = useTeamProjectTasks(teamId, projectProp.id);
  
  const { 
    createTask, 
    deleteTask: removeTask, 
    toggleComplete,
    updateTask
  } = useTeamTasks(teamId);
  
  const { projects, updateProject } = useTeamProjects(teamId);
  
  const { toast } = useToast();
  
  // États
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  
  // Use latest project from hook
  const project = useMemo(() => 
    projects.find(p => p.id === projectProp.id) ?? projectProp,
    [projects, projectProp]
  );
  
  // Colonnes du Kanban (personnalisées ou par défaut)
  const columns = useMemo(() => 
    project.kanbanColumns || DEFAULT_COLUMNS,
    [project.kanbanColumns]
  );
  
  const statusConfig = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG['planning'];

  // Hook de filtrage partagé
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
    getTaskName: (t) => t.name,
    getSubCategory: (t) => t.subCategory,
    getEstimatedTime: (t) => t.estimatedTime || 0,
    getAssignedTo: (t) => t.assigned_to,
  });

  // Tâches par colonnes avec filtrage
  const filteredTasksByColumn = useMemo(() => {
    const rawTasks = getTasksByColumns(columns);
    const result: Record<string, Task[]> = {};
    
    Object.entries(rawTasks).forEach(([columnId, tasks]) => {
      result[columnId] = filterAndSortTasks(tasks) as unknown as Task[];
    });
    
    return result;
  }, [columns, getTasksByColumns, filterAndSortTasks]);

  // Statistiques
  const stats = useMemo(() => {
    const total = projectTasks.length;
    const done = projectTasks.filter(t => t.isCompleted).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    const assigned = projectTasks.filter(t => t.assigned_to).length;
    
    return { total, done, progress, assigned };
  }, [projectTasks]);

  // Handlers
  const handleDelete = useCallback(async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
      if (onDelete) {
        onDelete();
      }
    }
  }, [project.name, onDelete]);

  const handleComplete = useCallback(async () => {
    if (window.confirm(`Marquer le projet "${project.name}" comme terminé ?`)) {
      const success = await updateProject(project.id, { status: 'completed' });
      if (success) {
        toast({
          title: "Projet terminé",
          description: `Le projet "${project.name}" a été marqué comme terminé.`,
        });
        if (onDelete) {
          onDelete(); // Retour à la liste
        }
      }
    }
  }, [project.id, project.name, updateProject, toast, onDelete]);

  const handleToggleSidebar = useCallback(async () => {
    const newValue = !project.showInSidebar;
    const success = await updateProject(project.id, { showInSidebar: newValue });
    if (success) {
      toast({
        title: newValue ? "Affiché dans la sidebar" : "Masqué de la sidebar",
        description: newValue 
          ? "Les tâches de ce projet apparaissent dans la sidebar"
          : "Les tâches de ce projet sont masquées de la sidebar",
      });
    }
  }, [project, updateProject, toast]);

  const handleColumnsChange = useCallback(async (newColumns: KanbanColumn[]) => {
    const success = await updateProject(project.id, { 
      kanbanColumns: newColumns 
    });
    if (success) {
      reloadTasks();
      toast({
        title: "Colonnes mises à jour",
        description: "La configuration du tableau Kanban a été sauvegardée.",
      });
    }
  }, [project.id, updateProject, reloadTasks, toast]);

  const handleTaskClick = useCallback((task: Task) => {
    const teamTask = projectTasks.find(t => t.id === task.id);
    if (teamTask) {
      setSelectedTask(teamTask);
      setShowTaskModal(true);
    }
  }, [projectTasks]);

  const handleToggleComplete = useCallback(async (taskId: string) => {
    const task = projectTasks.find(t => t.id === taskId);
    if (task) {
      await toggleComplete(taskId, !task.isCompleted);
    }
  }, [projectTasks, toggleComplete]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await removeTask(taskId);
    toast({
      title: "Tâche supprimée",
      description: "La tâche a été supprimée avec succès.",
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

  // Helper pour obtenir les initiales d'un membre
  const getMemberInitials = useCallback((userId: string | null): string => {
    if (!userId) return '?';
    const member = teamMembers.find(m => m.user_id === userId);
    if (!member) return '?';
    const name = getDisplayName(member);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, [teamMembers]);

  // Render assignee avatar for Kanban
  const renderTaskBadge = useCallback((task: Task) => {
    const teamTask = task as unknown as TeamTask;
    if (!teamTask.assigned_to) return null;
    
    const member = teamMembers.find(m => m.user_id === teamTask.assigned_to);
    const displayName = member ? getDisplayName(member) : 'Assigné';
    
    return (
      <Avatar className="h-5 w-5" title={displayName}>
        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
          {getMemberInitials(teamTask.assigned_to)}
        </AvatarFallback>
      </Avatar>
    );
  }, [teamMembers, getMemberInitials]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{project.icon || '📁'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <Badge variant="outline" className="gap-1">
                    <Users className="w-3 h-3" />
                    Équipe
                  </Badge>
                </div>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} mt-1`}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            
            {project.description && (
              <p className="text-muted-foreground max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Toggle sidebar visibility */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card">
            <Switch
              id="show-in-sidebar"
              checked={project.showInSidebar ?? false}
              onCheckedChange={handleToggleSidebar}
            />
            <Label htmlFor="show-in-sidebar" className="text-sm cursor-pointer flex items-center gap-1">
              {project.showInSidebar ? (
                <><Eye className="w-4 h-4 text-project" /> Sidebar</>
              ) : (
                <><EyeOff className="w-4 h-4 text-muted-foreground" /> Sidebar</>
              )}
            </Label>
          </div>

          {/* Bouton colonnes */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-auto py-2"
            onClick={() => setShowColumnManager(true)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          {project.status !== 'completed' && (
            <Button 
              variant="outline" 
              onClick={handleComplete}
              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Terminer
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
          <Button 
            onClick={handleCreateTask}
            className="bg-project hover:bg-project/90 text-white"
          >
            <ListPlus className="w-4 h-4 mr-2" />
            Ajouter au projet
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progression</p>
              <p className="text-2xl font-bold">{stats.progress}%</p>
            </div>
            <Target className="w-8 h-8 text-project" />
          </div>
          <Progress value={stats.progress} className="mt-2" />
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tâches</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.done} terminées
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Assignées</p>
              <p className="text-2xl font-bold">{stats.assigned}</p>
            </div>
            <UserPlus className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {project.targetDate && (
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Date cible</p>
                <p className="text-lg font-semibold">
                  {new Date(project.targetDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        {/* Filtre par priorité */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={priorityFilter !== 'all' ? 'default' : 'outline'} 
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {priorityFilter === 'all' ? 'Priorité' : priorityFilter}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrer par priorité</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {priorityOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setPriorityFilter(option.value)}
                className={priorityFilter === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tri */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={sortBy !== 'none' ? 'default' : 'outline'} 
              className="gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">Trier</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Trier les tâches</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {teamSortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value as TeamSortOption)}
                className={sortBy === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bouton effacer les filtres */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Indicateur de filtres actifs */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtres actifs :</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Recherche: "{searchQuery}"
            </Badge>
          )}
          {priorityFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {priorityFilter}
            </Badge>
          )}
          {sortBy !== 'none' && (
            <Badge variant="secondary" className="gap-1">
              Tri: {teamSortOptions.find(o => o.value === sortBy)?.label}
            </Badge>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tableau Kanban</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
            </span>
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 5).map(member => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {getDisplayName(member).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
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
        </div>

        <KanbanBoard
          tasksByColumn={filteredTasksByColumn}
          columns={columns}
          onStatusChange={updateTaskStatus}
          onTaskClick={handleTaskClick}
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteTask}
          renderTaskBadge={renderTaskBadge}
        />
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={handleCloseModal}
        editingTask={selectedTask ? {
          ...selectedTask,
          user_id: '', // Required by Task type but not used for team tasks
        } as Task : undefined}
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
        teamMembers={teamMembers.map(m => ({
          user_id: m.user_id,
          display_name: m.profiles?.display_name || undefined
        }))}
      />

      {/* Column Manager Modal */}
      <KanbanColumnManager
        columns={columns}
        onColumnsChange={handleColumnsChange}
        isOpen={showColumnManager}
        onClose={() => setShowColumnManager(false)}
      />
    </div>
  );
};

export default TeamProjectDetail;
