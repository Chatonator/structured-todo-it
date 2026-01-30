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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { KanbanBoard, DEFAULT_COLUMNS, KanbanColumn } from '@/components/projects/KanbanBoard';
import { 
  ArrowLeft, Edit, Plus, Calendar, Target, Trash2, 
  Search, Filter, ArrowUpDown, X, CheckCircle2,
  Users, UserPlus, User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Task, SubTaskCategory, SUB_CATEGORY_CONFIG } from '@/types/task';
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

type SortOption = 'none' | 'priority-high' | 'priority-low' | 'name' | 'time' | 'assignee';
type PriorityFilter = SubTaskCategory | 'all' | 'none';

// Helper to get display name
const getDisplayName = (member: TeamMember): string => {
  return member.profiles?.display_name || 'Membre';
};

export const TeamProjectDetail = ({ 
  project, 
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
  } = useTeamProjectTasks(teamId, project.id);
  
  const { 
    createTask, 
    deleteTask: removeTask, 
    toggleComplete,
    assignTask 
  } = useTeamTasks(teamId);
  
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [showAddTaskInput, setShowAddTaskInput] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  
  const statusConfig = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG['planning'];

  // Colonnes du Kanban (pour l'instant les colonnes par défaut)
  const columns = DEFAULT_COLUMNS;

  // Fonction de filtrage et tri des tâches
  const filterAndSortTasks = useCallback((tasks: TeamTask[]): TeamTask[] => {
    let filtered = [...tasks];
    
    // Recherche par nom
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(query)
      );
    }
    
    // Filtre par priorité (subcategory)
    if (priorityFilter !== 'all') {
      if (priorityFilter === 'none') {
        filtered = filtered.filter(task => !task.subCategory);
      } else {
        filtered = filtered.filter(task => task.subCategory === priorityFilter);
      }
    }
    
    // Tri
    if (sortBy !== 'none') {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'priority-high': {
            const getPriority = (task: TeamTask) => {
              if (!task.subCategory) return 0;
              return SUB_CATEGORY_CONFIG[task.subCategory]?.priority ?? 0;
            };
            return getPriority(b) - getPriority(a);
          }
          case 'priority-low': {
            const getPriority = (task: TeamTask) => {
              if (!task.subCategory) return 0;
              return SUB_CATEGORY_CONFIG[task.subCategory]?.priority ?? 0;
            };
            const prioA = getPriority(a);
            const prioB = getPriority(b);
            if (prioA === 0 && prioB !== 0) return 1;
            if (prioB === 0 && prioA !== 0) return -1;
            return prioA - prioB;
          }
          case 'name':
            return a.name.localeCompare(b.name);
          case 'time':
            return (b.estimatedTime || 0) - (a.estimatedTime || 0);
          case 'assignee':
            return (a.assigned_to || 'zzz').localeCompare(b.assigned_to || 'zzz');
          default:
            return 0;
        }
      });
    }
    
    return filtered;
  }, [searchQuery, sortBy, priorityFilter]);

  // Tâches par colonnes avec filtrage
  const filteredTasksByColumn = useMemo(() => {
    const rawTasks = getTasksByColumns(columns);
    const result: Record<string, Task[]> = {};
    
    Object.entries(rawTasks).forEach(([columnId, tasks]) => {
      // Cast TeamTask[] to Task[] (compatible)
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

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchQuery.trim() !== '' || sortBy !== 'none' || priorityFilter !== 'all';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSortBy('none');
    setPriorityFilter('all');
  }, []);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
      if (onDelete) {
        onDelete();
      }
    }
  }, [project.name, onDelete]);

  const handleTaskClick = useCallback((task: Task) => {
    // Pour l'instant, on ne fait rien - on pourrait ouvrir un modal d'édition
    toast({
      title: task.name,
      description: "Édition de tâche d'équipe à venir",
    });
  }, [toast]);

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

  const handleCreateTask = useCallback(async () => {
    if (!newTaskName.trim()) return;
    
    await createTask({
      name: newTaskName.trim(),
      project_id: project.id,
      category: 'Autres',
      context: 'Pro',
      estimatedTime: 30,
    });
    
    setNewTaskName('');
    setShowAddTaskInput(false);
    toast({
      title: "Tâche créée",
      description: "La tâche a été ajoutée au projet.",
    });
  }, [newTaskName, createTask, project.id, toast]);

  const getMemberInitials = (userId: string | null): string => {
    if (!userId) return '?';
    const member = teamMembers.find(m => m.user_id === userId);
    if (!member) return '?';
    const name = getDisplayName(member);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const priorityOptions: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: 'Toutes les priorités' },
    { value: 'Le plus important', label: '🔴 Le plus important' },
    { value: 'Important', label: '🟠 Important' },
    { value: 'Peut attendre', label: '🟡 Peut attendre' },
    { value: "Si j'ai le temps", label: '🟢 Si j\'ai le temps' },
    { value: 'none', label: '⚪ Non définie' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'none', label: 'Aucun tri' },
    { value: 'priority-high', label: 'Priorité ↓ (haute → basse)' },
    { value: 'priority-low', label: 'Priorité ↑ (basse → haute)' },
    { value: 'name', label: 'Nom (A → Z)' },
    { value: 'time', label: 'Durée (longue → courte)' },
    { value: 'assignee', label: 'Assignation' },
  ];

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
          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          {project.status !== 'completed' && (
            <Button 
              variant="outline" 
              onClick={() => {
                toast({
                  title: "Terminer le projet",
                  description: "Fonctionnalité à venir",
                });
              }}
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
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={sortBy === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Ajouter une tâche */}
        <Button 
          onClick={() => setShowAddTaskInput(true)}
          className="bg-project hover:bg-project/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>

        {/* Bouton effacer les filtres */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Input rapide pour nouvelle tâche */}
      {showAddTaskInput && (
        <div className="flex gap-2 p-4 bg-muted/30 rounded-lg border">
          <Input
            type="text"
            placeholder="Nom de la tâche..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTask();
              if (e.key === 'Escape') setShowAddTaskInput(false);
            }}
            autoFocus
            className="flex-1"
          />
          <Button onClick={handleCreateTask} disabled={!newTaskName.trim()}>
            Créer
          </Button>
          <Button variant="ghost" onClick={() => setShowAddTaskInput(false)}>
            Annuler
          </Button>
        </div>
      )}

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
              Tri: {sortOptions.find(o => o.value === sortBy)?.label}
            </Badge>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tableau Kanban</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {teamMembers.length} membres
          </div>
        </div>
        <KanbanBoard
          tasksByColumn={filteredTasksByColumn}
          columns={columns}
          onStatusChange={updateTaskStatus}
          onTaskClick={handleTaskClick}
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
};

export default TeamProjectDetail;
