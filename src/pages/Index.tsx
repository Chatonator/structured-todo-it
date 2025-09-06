
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import TasksView from '@/components/TasksView';
import PriorityView from '@/components/PriorityView';
import DashboardView from '@/components/DashboardView';
import EisenhowerView from '@/components/EisenhowerView';
import CalendarView from '@/components/calendar/CalendarView';
import CompletedTasksView from '@/components/CompletedTasksView';
import AppHeader from '@/components/layout/AppHeader';
import AppNavigation from '@/components/layout/AppNavigation';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from '@/hooks/useTheme';

/**
 * Page principale de l'application
 * Sécurisée contre les données undefined/null
 */
const Index = () => {
  const { theme } = useTheme();
  
  // Hook principal pour la gestion des tâches avec gestion d'erreur
  const hookResult = useTasks();
  
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

  // Configuration de la navigation
  const navigationItems = [
    { key: 'tasks', title: 'Tâches', icon: '📝' },
    { key: 'priority', title: 'Vue 1-3-5', icon: '🎲' },
    { key: 'dashboard', title: 'Dashboard', icon: '📊' },
    { key: 'eisenhower', title: 'Eisenhower', icon: '🧭' },
    { key: 'calendar', title: 'Calendrier', icon: '📅' },
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

  // Filtrage des tâches selon la vue avec sécurisation
  const getFilteredTasks = () => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    
    if (currentView === 'completed') {
      return safeTasks.filter(task => task && task.isCompleted);
    }
    return safeTasks.filter(task => task && !task.isCompleted);
  };

  const filteredTasks = getFilteredTasks();
  
  // Pour la liste de gauche, on exclut toujours les tâches terminées
  const safeMainTasks = Array.isArray(mainTasks) ? mainTasks : [];
  const filteredMainTasks = safeMainTasks.filter(task => task && !task.isCompleted);

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
              tasks={filteredTasks}
              mainTasks={safeMainTasks}
              getSubTasks={safeGetSubTasks}
              calculateTotalTime={safeCalculateTotalTime}
              onUpdateTask={safeUpdateTask}
            />
          );
        case 'priority':
          return (
            <PriorityView 
              tasks={filteredTasks}
              getSubTasks={safeGetSubTasks}
              calculateTotalTime={safeCalculateTotalTime}
            />
          );
        case 'dashboard':
          return (
            <DashboardView 
              tasks={filteredTasks}
              mainTasks={filteredMainTasks}
              calculateTotalTime={safeCalculateTotalTime}
            />
          );
        case 'eisenhower':
          return <EisenhowerView tasks={filteredTasks} />;
        case 'calendar':
          return <CalendarView tasks={filteredTasks} />;
        case 'completed':
          const completedTasksList = Array.isArray(tasks) ? tasks.filter(t => t && t.isCompleted) : [];
          return (
            <CompletedTasksView 
              tasks={completedTasksList} 
              onRestoreTask={safeRestoreTask}
              onRemoveTask={safeRemoveTask}
            />
          );
        default:
          return <div className="text-center text-theme-muted">Vue non trouvée</div>;
      }
    } catch (error) {
      console.error('Erreur lors du rendu de la vue:', error);
      return (
        <div className="text-center text-red-500 p-8">
          <h3 className="text-lg font-medium mb-2">Erreur de rendu</h3>
          <p className="text-sm">Une erreur s'est produite lors de l'affichage de cette vue.</p>
          <button 
            onClick={() => setCurrentView('tasks')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retour aux tâches
          </button>
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
      <div className="min-h-screen flex flex-col w-full bg-theme-background">
        {/* Header avec statistiques et historique */}
        <AppHeader
          tasksCount={safeTasksCount}
          completedTasks={safeCompletedTasks}
          completionRate={safeCompletionRate}
          canUndo={Boolean(canUndo)}
          canRedo={Boolean(canRedo)}
          onUndo={undo}
          onRedo={redo}
          onOpenModal={() => setIsModalOpen(true)}
        />

        {/* Navigation horizontale */}
        <AppNavigation
          currentView={currentView}
          onViewChange={setCurrentView}
          navigationItems={navigationItems}
        />

        {/* Contenu principal avec layout optimisé */}
        <main className="flex-1 flex">
          {/* Colonne gauche : Liste des tâches actives */}
          <div className="w-[25%] bg-theme-background border-r border-theme-border flex flex-col shadow-sm">
            <TaskList 
              tasks={Array.isArray(tasks) ? tasks : []}
              mainTasks={filteredMainTasks}
              pinnedTasks={Array.isArray(pinnedTasks) ? pinnedTasks : []}
              onRemoveTask={safeRemoveTask}
              onReorderTasks={safeReorderTasks}
              onSortTasks={safeSortTasks}
              onToggleExpansion={safeToggleTaskExpansion}
              onToggleCompletion={safeToggleTaskCompletion}
              onTogglePinTask={safeTogglePinTask}
              onAddTask={safeAddTask}
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
          </div>

          {/* Section droite : Vue courante */}
          <div className="flex-1 p-6 overflow-y-auto bg-theme-background">
            <div className="bg-theme-background rounded-lg shadow-sm border border-theme-border p-6 h-full">
              {renderCurrentView()}
            </div>
          </div>
        </main>

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
