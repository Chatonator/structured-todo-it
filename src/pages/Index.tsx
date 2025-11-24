import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Task } from '@/types/task';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import TasksView from '@/components/TasksView';
import PriorityView from '@/components/PriorityView';
import DashboardView from '@/components/DashboardView';
import EisenhowerView from '@/components/EisenhowerView';
import CalendarView from '@/components/calendar/CalendarView';
import CompletedTasksView from '@/components/CompletedTasksView';
import HabitsView from '@/components/habits/HabitsView';
import RewardsView from '@/components/rewards/RewardsView';
import { ProjectsView } from '@/components/projects/ProjectsView';
import AppHeader from '@/components/layout/AppHeader';
import AppNavigation from '@/components/layout/AppNavigation';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { useTasks } from '@/hooks/useTasks';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/shared/use-mobile';

/**
 * Page principale de l'application
 * Sécurisée contre les données undefined/null
 */
const Index = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { currentTeam } = useTeamContext();
  
  // Hooks pour tâches personnelles et d'équipe
  const personalTasks = useTasks();
  const teamTasks = useTeamTasks(currentTeam?.id || null);
  
  // Basculer entre les tâches personnelles et d'équipe
  const isTeamMode = !!currentTeam;
  const hookResult = isTeamMode ? {
    // Mapper les tâches d'équipe vers l'interface Task
    tasks: teamTasks.tasks as unknown as typeof personalTasks.tasks,
    mainTasks: teamTasks.tasks.filter(t => t.level === 0) as unknown as typeof personalTasks.mainTasks,
    pinnedTasks: [],
    addTask: async (task: any) => {
      await teamTasks.createTask(task);
    },
    removeTask: async (taskId: string) => {
      await teamTasks.deleteTask(taskId);
    },
    reorderTasks: async () => {}, // À implémenter si nécessaire
    sortTasks: async () => {}, // À implémenter si nécessaire
    toggleTaskExpansion: async (taskId: string) => {
      const task = teamTasks.tasks.find(t => t.id === taskId);
      if (task) {
        await teamTasks.updateTask(taskId, { isexpanded: !task.isExpanded } as any);
      }
    },
    toggleTaskCompletion: async (taskId: string) => {
      const task = teamTasks.tasks.find(t => t.id === taskId);
      if (task) {
        await teamTasks.toggleComplete(taskId, !task.isCompleted);
      }
    },
    togglePinTask: () => {}, // Non supporté en mode équipe
    getSubTasks: (parentId: string) => teamTasks.tasks.filter(t => t.parentId === parentId) as unknown as typeof personalTasks.tasks,
    calculateTotalTime: (task: any) => {
      const subTasks = teamTasks.tasks.filter(t => t.parentId === task.id);
      return task.estimatedTime + subTasks.reduce((sum, sub) => sum + sub.estimatedTime, 0);
    },
    canHaveSubTasks: (task: any) => task.level < 2,
    tasksCount: teamTasks.tasks.length,
    totalProjectTime: teamTasks.tasks.reduce((sum, t) => sum + t.estimatedTime, 0),
    completedTasks: teamTasks.tasks.filter(t => t.isCompleted).length,
    completionRate: teamTasks.tasks.length > 0 
      ? (teamTasks.tasks.filter(t => t.isCompleted).length / teamTasks.tasks.length) * 100 
      : 0,
    undo: () => {},
    redo: () => {},
    canUndo: false,
    canRedo: false,
    restoreTask: async (taskId: string) => {
      await teamTasks.toggleComplete(taskId, false);
    },
    updateTask: async (taskId: string, updates: any) => {
      // Mapper les propriétés camelCase vers snake_case
      const mappedUpdates: any = {};
      if (updates.estimatedTime !== undefined) mappedUpdates.estimatedtime = updates.estimatedTime;
      if (updates.scheduledDate !== undefined) mappedUpdates.scheduleddate = updates.scheduledDate ? updates.scheduledDate.toISOString().split('T')[0] : null;
      if (updates.scheduledTime !== undefined) mappedUpdates.scheduledtime = updates.scheduledTime;
      if (updates.startTime !== undefined) mappedUpdates.starttime = updates.startTime ? updates.startTime.toISOString() : null;
      if (updates.isCompleted !== undefined) mappedUpdates.iscompleted = updates.isCompleted;
      if (updates.isExpanded !== undefined) mappedUpdates.isexpanded = updates.isExpanded;
      if (updates.isRecurring !== undefined) mappedUpdates.isrecurring = updates.isRecurring;
      if (updates.recurrenceInterval !== undefined) mappedUpdates.recurrenceinterval = updates.recurrenceInterval;
      if (updates.lastCompletedAt !== undefined) mappedUpdates.lastcompletedat = updates.lastCompletedAt ? updates.lastCompletedAt.toISOString() : null;
      if (updates.parentId !== undefined) mappedUpdates.parentid = updates.parentId;
      if (updates.subCategory !== undefined) mappedUpdates.subcategory = updates.subCategory;
      
      // Copier les propriétés qui ont le même nom
      ['name', 'category', 'context', 'duration', 'level'].forEach(key => {
        if (updates[key] !== undefined) mappedUpdates[key] = updates[key];
      });
      
      await teamTasks.updateTask(taskId, mappedUpdates);
    },
  } : personalTasks;
  
  // Sécurisation de tous les retours du hook avec vraies fonctions
  const { 
    tasks = [], 
    mainTasks = [],
    pinnedTasks = [],
    addTask,
    removeTask,
    reorderTasks, 
    sortTasks,
    toggleTaskExpansion,
    toggleTaskCompletion,
    togglePinTask,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    tasksCount = 0,
    totalProjectTime = 0,
    completedTasks = 0,
    completionRate = 0,
    undo,
    redo,
    canUndo = false,
    canRedo = false,
    restoreTask,
    updateTask
  } = hookResult || {};

  // Fonctions de sécurité uniquement si undefined
  const safeAddTask = addTask || (() => {});
  const safeRemoveTask = removeTask || (() => {});
  const safeReorderTasks = reorderTasks || (() => {});
  const safeSortTasks = sortTasks || (() => {});
  const safeToggleTaskExpansion = toggleTaskExpansion || (() => {});
  const safeToggleTaskCompletion = toggleTaskCompletion || (() => {});
  const safeTogglePinTask = togglePinTask || (() => {});
  const safeGetSubTasks = getSubTasks || (() => []);
  const safeCalculateTotalTime = calculateTotalTime || (() => 0);
  const safeCanHaveSubTasks = canHaveSubTasks || (() => false);
  const safeUndo = undo || (() => {});
  const safeRedo = redo || (() => {});
  const safeRestoreTask = restoreTask || (() => {});
  const safeUpdateTask = updateTask || (() => {});

  // États locaux pour l'interface
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('tasks');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [isTaskListCollapsed, setIsTaskListCollapsed] = useState(false);
  
  // États pour les filtres globaux
  const [contextFilter, setContextFilter] = useState<'Pro' | 'Perso' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<any>('all');
  const [sortBy, setSortBy] = useState<'name' | 'duration' | 'category'>('name');

  // Configuration de la navigation
  const navigationItems = [
    { key: 'tasks', title: 'Tâches', icon: '📝' },
    { key: 'priority', title: 'Vue 1-3-5', icon: '🎲' },
    { key: 'dashboard', title: 'Dashboard', icon: '📊' },
    { key: 'eisenhower', title: 'Eisenhower', icon: '🧭' },
    { key: 'calendar', title: 'Calendrier', icon: '📅' },
    { key: 'projects', title: 'Projets', icon: '💼' },
    { key: 'habits', title: 'Habitudes', icon: '💪' },
    { key: 'rewards', title: 'Récompenses', icon: '🏆' },
    { key: 'completed', title: 'Terminées', icon: '✅' }
  ];

  // Gestion de la sélection sécurisée
  const handleToggleSelection = (taskId: string) => {
    if (!taskId || typeof taskId !== 'string') {
      console.warn('handleToggleSelection appelé avec un taskId invalide:', taskId);
      return;
    }
    
    setSelectedTasks(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(taskId) 
        ? safePrev.filter(id => id !== taskId)
        : [...safePrev, taskId];
    });
  };

  // Fonction pour appliquer les filtres globaux
  const applyFilters = (taskList: Task[]) => {
    let filtered = taskList;
    
    // Filtrer par contexte (Pro/Perso)
    if (contextFilter !== 'all') {
      filtered = filtered.filter(task => task.context === contextFilter);
    }
    
    // Filtrer par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Filtrage des tâches selon la vue + filtres globaux
  const getFilteredTasks = () => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    
    // D'abord filtrer par statut (actif/complété)
    let filtered = currentView === 'completed' 
      ? safeTasks.filter(task => task && task.isCompleted)
      : safeTasks.filter(task => task && !task.isCompleted);
    
    // Appliquer les filtres globaux
    return applyFilters(filtered);
  };

  const filteredTasks = getFilteredTasks();
  
  // Pour la liste de gauche et les vues, appliquer les mêmes filtres
  const safeMainTasks = Array.isArray(mainTasks) ? mainTasks : [];
  const filteredMainTasks = applyFilters(
    safeMainTasks.filter(task => task && !task.isCompleted)
  );
  
  // Filtrer toutes les tâches (pour les vues qui ont besoin de toutes les tâches)
  const allFilteredTasks = applyFilters(Array.isArray(tasks) ? tasks : []);

  // Application du thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }, [theme]);

  // Rendu de la vue courante avec gestion d'erreur
  const renderCurrentView = () => {
    try {
      switch (currentView) {
        case 'tasks':
          return (
            <TasksView 
              tasks={allFilteredTasks}
              mainTasks={filteredMainTasks}
              getSubTasks={safeGetSubTasks}
              calculateTotalTime={safeCalculateTotalTime}
              onUpdateTask={safeUpdateTask}
            />
          );
        case 'priority':
          return (
            <PriorityView 
              tasks={allFilteredTasks.filter(t => !t.isCompleted)}
              getSubTasks={safeGetSubTasks}
              calculateTotalTime={safeCalculateTotalTime}
            />
          );
        case 'dashboard':
          return (
            <DashboardView 
              tasks={allFilteredTasks}
              mainTasks={filteredMainTasks}
              calculateTotalTime={safeCalculateTotalTime}
            />
          );
        case 'eisenhower':
          return <EisenhowerView tasks={allFilteredTasks.filter(t => !t.isCompleted)} />;
        case 'calendar':
          return <CalendarView tasks={allFilteredTasks} />;
        case 'projects':
          return <ProjectsView />;
        case 'habits':
          return <HabitsView />;
        case 'rewards':
          return <RewardsView />;
        case 'completed':
          const completedTasksList = applyFilters(
            Array.isArray(tasks) ? tasks.filter(t => t && t.isCompleted) : []
          );
          return (
            <CompletedTasksView 
              tasks={completedTasksList} 
              onRestoreTask={safeRestoreTask}
              onRemoveTask={safeRemoveTask}
            />
          );
        default:
          return <div className="text-center text-muted-foreground">Vue non trouvée</div>;
      }
    } catch (error) {
      console.error('Erreur lors du rendu de la vue:', error);
      return (
        <div className="text-center text-destructive p-8">
          <h3 className="text-lg font-medium mb-2">Erreur de rendu</h3>
          <p className="text-sm">Une erreur s'est produite lors de l'affichage de cette vue.</p>
          <Button 
            onClick={() => setCurrentView('tasks')}
          >
            Retour aux tâches
          </Button>
        </div>
      );
    }
  };

  // Calculs sécurisés pour les statistiques
  const safeTasksCount = Array.isArray(tasks) ? tasks.filter(t => t && !t.isCompleted).length : 0;
  const safeCompletedTasks = Number(completedTasks) || 0;
  const safeCompletionRate = Number(completionRate) || 0;

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex flex-col w-full bg-background ${isMobile ? 'pb-16' : ''}`}>
        {/* Header avec statistiques, filtres et actions */}
        <AppHeader
          onOpenModal={() => setIsModalOpen(true)}
          onOpenTaskList={() => setIsTaskListOpen(true)}
          isMobile={isMobile}
          contextFilter={contextFilter}
          onContextFilterChange={setContextFilter}
        />

        {/* Navigation horizontale - cachée sur mobile */}
        {!isMobile && (
          <AppNavigation
            currentView={currentView}
            onViewChange={setCurrentView}
            navigationItems={navigationItems}
          />
        )}

        {/* Contenu principal avec layout adaptatif */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Desktop: Colonne gauche avec largeur dynamique */}
          {!isMobile && (
            <div 
              className={`
                bg-background border-r border-border flex flex-col shadow-sm
                transition-all duration-300 ease-in-out
                ${isTaskListCollapsed ? 'w-16' : 'w-full md:w-[30%] lg:w-[25%]'}
              `}
            >
              <TaskList 
                tasks={filteredTasks}
                mainTasks={filteredMainTasks}
                pinnedTasks={Array.isArray(pinnedTasks) ? pinnedTasks : []}
                onRemoveTask={safeRemoveTask}
                onReorderTasks={safeReorderTasks}
                onSortTasks={safeSortTasks}
                onToggleExpansion={safeToggleTaskExpansion}
                onToggleCompletion={safeToggleTaskCompletion}
                onTogglePinTask={safeTogglePinTask}
                onAddTask={safeAddTask}
                onUpdateTask={safeUpdateTask}
                getSubTasks={safeGetSubTasks}
                calculateTotalTime={safeCalculateTotalTime}
                canHaveSubTasks={safeCanHaveSubTasks}
                selectedTasks={Array.isArray(selectedTasks) ? selectedTasks : []}
                onToggleSelection={handleToggleSelection}
                canUndo={Boolean(canUndo)}
                canRedo={Boolean(canRedo)}
                onUndo={safeUndo}
                onRedo={safeRedo}
                onCollapsedChange={setIsTaskListCollapsed}
              />
            </div>
          )}

          {/* Mobile: TaskList en drawer */}
          {isMobile && (
            <Sheet open={isTaskListOpen} onOpenChange={setIsTaskListOpen}>
              <SheetContent side="left" className="w-full sm:w-[400px] p-0">
                <TaskList 
                  tasks={filteredTasks}
                  mainTasks={filteredMainTasks}
                  pinnedTasks={Array.isArray(pinnedTasks) ? pinnedTasks : []}
                  onRemoveTask={safeRemoveTask}
                  onReorderTasks={safeReorderTasks}
                  onSortTasks={safeSortTasks}
                  onToggleExpansion={safeToggleTaskExpansion}
                  onToggleCompletion={safeToggleTaskCompletion}
                  onTogglePinTask={safeTogglePinTask}
                  onAddTask={safeAddTask}
                  onUpdateTask={safeUpdateTask}
                  getSubTasks={safeGetSubTasks}
                  calculateTotalTime={safeCalculateTotalTime}
                  canHaveSubTasks={safeCanHaveSubTasks}
                  selectedTasks={Array.isArray(selectedTasks) ? selectedTasks : []}
                  onToggleSelection={handleToggleSelection}
                  canUndo={Boolean(canUndo)}
                  canRedo={Boolean(canRedo)}
                  onUndo={safeUndo}
                  onRedo={safeRedo}
                />
              </SheetContent>
            </Sheet>
          )}

          {/* Section droite : Vue courante */}
          <div className="flex-1 p-3 md:p-6 overflow-y-auto bg-background">
            <div className="bg-card rounded-lg shadow-sm border border-border p-3 md:p-6 h-full">
              {renderCurrentView()}
            </div>
          </div>
        </main>

        {/* Navigation inférieure mobile */}
        {isMobile && (
          <BottomNavigation
            currentView={currentView}
            onViewChange={setCurrentView}
            navigationItems={navigationItems}
          />
        )}

        {/* Modale de création de tâches */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={safeAddTask}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;
