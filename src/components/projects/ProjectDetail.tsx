import { useState, useMemo, useCallback } from 'react';
import { Project, PROJECT_STATUS_CONFIG } from '@/types/project';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useTasks } from '@/hooks/useTasks';
import { useProjects, ProjectWithKanban } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { KanbanBoard, DEFAULT_COLUMNS, KanbanColumn } from './KanbanBoard';
import { KanbanColumnManager } from './KanbanColumnManager';
import TaskModal from '@/components/task/TaskModal';
import { 
  ArrowLeft, Edit, Plus, Calendar, Target, Trash2, 
  Search, Filter, ArrowUpDown, X, CheckCircle2, ListPlus,
  Eye, EyeOff, Settings2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

interface ProjectDetailProps {
  project: ProjectWithKanban;
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

type SortOption = 'none' | 'priority-high' | 'priority-low' | 'name' | 'time';
type PriorityFilter = SubTaskCategory | 'all' | 'none';

export const ProjectDetail = ({ project, onBack, onEdit, onDelete }: ProjectDetailProps) => {
  const { getTasksByColumns, updateTaskStatus, reloadTasks, tasksByStatus } = useProjectTasks(project.id);
  const { addTask, updateTask, removeTask } = useTasks();
  const { deleteProject, completeProject, updateProject } = useProjects();
  const { toast } = useToast();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [showColumnManager, setShowColumnManager] = useState(false);
  
  // Get columns (project-specific or default)
  const columns = useMemo(() => 
    project.kanbanColumns || DEFAULT_COLUMNS,
    [project.kanbanColumns]
  );
  
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  // Fonction de filtrage et tri des tâches
  const filterAndSortTasks = useCallback((tasks: Task[]): Task[] => {
    let filtered = [...tasks];
    
    // Recherche par nom
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(query)
      );
    }
    
    // Filtre par priorité
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
            // Priorité: 4 = Le plus important, 3 = Important, 2 = Peut attendre, 1 = Si j'ai le temps, 0 = non défini
            const getPriority = (task: Task) => {
              if (!task.subCategory) return 0;
              return SUB_CATEGORY_CONFIG[task.subCategory]?.priority ?? 0;
            };
            const prioA = getPriority(a);
            const prioB = getPriority(b);
            // Si même priorité, trier par nom pour consistance
            if (prioB === prioA) return a.name.localeCompare(b.name);
            return prioB - prioA;
          }
          case 'priority-low': {
            const getPriority = (task: Task) => {
              if (!task.subCategory) return 0;
              return SUB_CATEGORY_CONFIG[task.subCategory]?.priority ?? 0;
            };
            const prioA = getPriority(a);
            const prioB = getPriority(b);
            // Mettre les tâches sans priorité à la fin
            if (prioA === 0 && prioB !== 0) return 1;
            if (prioB === 0 && prioA !== 0) return -1;
            if (prioA === prioB) return a.name.localeCompare(b.name);
            return prioA - prioB;
          }
          case 'name':
            return a.name.localeCompare(b.name);
          case 'time':
            return (b.estimatedTime || 0) - (a.estimatedTime || 0);
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
      result[columnId] = filterAndSortTasks(tasks);
    });
    
    return result;
  }, [columns, getTasksByColumns, filterAndSortTasks]);

  // Statistiques calculées dynamiquement depuis les tâches réelles
  const stats = useMemo(() => {
    const allTasks = Object.values(filteredTasksByColumn).flat();
    const total = allTasks.length;
    // Count done tasks (from 'done' column or any column with 'done' in its id)
    const done = filteredTasksByColumn['done']?.length || 0;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return { total, done, progress };
  }, [filteredTasksByColumn]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchQuery.trim() !== '' || sortBy !== 'none' || priorityFilter !== 'all';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSortBy('none');
    setPriorityFilter('all');
  }, []);

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
      if (success && onDelete) {
        onDelete(); // Retour à la liste après complétion
      }
    }
  }, [project.id, project.name, completeProject, onDelete]);

  // Toggle sidebar visibility for project tasks
  const handleToggleSidebar = useCallback(async () => {
    const currentValue = project.showInSidebar ?? false;
    await updateProject(project.id, { 
      showInSidebar: !currentValue 
    });
    toast({
      title: currentValue ? "Masqué de la sidebar" : "Affiché dans la sidebar",
      description: currentValue 
        ? "Les tâches de ce projet ne s'affichent plus dans la sidebar"
        : "Les tâches de ce projet apparaissent maintenant dans la sidebar",
    });
  }, [project, updateProject, toast]);

  // Update kanban columns
  const handleColumnsChange = useCallback(async (newColumns: KanbanColumn[]) => {
    await updateProject(project.id, { 
      kanbanColumns: newColumns 
    });
    toast({
      title: "Colonnes mises à jour",
      description: "La configuration du tableau Kanban a été sauvegardée.",
    });
  }, [project.id, updateProject, toast]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  }, []);

  const handleToggleComplete = useCallback(async (taskId: string) => {
    const allTasks = Object.values(filteredTasksByColumn).flat();
    const task = allTasks.find(t => t.id === taskId);
    
    if (task) {
      const newStatus = !task.isCompleted ? 'done' : 'todo';
      await updateTaskStatus(taskId, newStatus);
    }
  }, [filteredTasksByColumn, updateTaskStatus]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await removeTask(taskId);
    reloadTasks();
    toast({
      title: "Tâche supprimée",
      description: "La tâche a été supprimée avec succès.",
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

  const handleAddTask = useCallback(async (taskData: any) => {
    await addTask(taskData);
    reloadTasks();
  }, [addTask, reloadTasks]);

  const handleUpdateTask = useCallback(async (taskId: string, updates: any) => {
    await updateTask(taskId, updates);
    reloadTasks();
  }, [updateTask, reloadTasks]);

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
              <span className="text-3xl">{project.icon || '📚'}</span>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
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
              checked={(project as any).showInSidebar ?? false}
              onCheckedChange={handleToggleSidebar}
            />
            <Label htmlFor="show-in-sidebar" className="text-sm cursor-pointer flex items-center gap-1">
              {(project as any).showInSidebar ? (
                <><Eye className="w-4 h-4 text-project" /> Sidebar</>
              ) : (
                <><EyeOff className="w-4 h-4 text-muted-foreground" /> Sidebar</>
              )}
            </Label>
          </div>

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
          {/* Project-specific new task button - differentiated style */}
          <Button 
            onClick={handleCreateTask}
            className="bg-project hover:bg-project/90 text-white"
          >
            <ListPlus className="w-4 h-4 mr-2" />
            Ajouter au projet
          </Button>
        </div>
      </div>

      {/* Stats - avec progression calculée dynamiquement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tâches totales</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.done} terminées
            </div>
          </div>
        </div>
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
              Tri: {sortOptions.find(o => o.value === sortBy)?.label}
            </Badge>
          )}
        </div>
      )}

      {/* Kanban Board avec tâches filtrées */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tableau Kanban</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowColumnManager(true)}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Colonnes
          </Button>
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

      {/* Kanban Column Manager Modal */}
      <KanbanColumnManager
        columns={columns}
        onColumnsChange={handleColumnsChange}
        isOpen={showColumnManager}
        onClose={() => setShowColumnManager(false)}
      />

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={handleCloseModal}
          editingTask={selectedTask || undefined}
          projectId={project.id}
          taskType="project"
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </div>
  );
};