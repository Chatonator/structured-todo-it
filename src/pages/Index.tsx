
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import PriorityView from '@/components/PriorityView';
import DashboardView from '@/components/DashboardView';
import EisenhowerView from '@/components/EisenhowerView';
import CalendarView from '@/components/CalendarView';
import CompletedTasksView from '@/components/CompletedTasksView';
import AppHeader from '@/components/layout/AppHeader';
import AppNavigation from '@/components/layout/AppNavigation';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from '@/hooks/useTheme';

/**
 * Page principale de l'application
 * Refactorisée pour une meilleure séparation des responsabilités
 */
const Index = () => {
  const { theme } = useTheme();
  
  // Hook principal pour la gestion des tâches
  const { 
    tasks, 
    mainTasks,
    pinnedTasks,
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
    tasksCount,
    totalProjectTime,
    completedTasks,
    completionRate,
    undo,
    redo,
    canUndo,
    canRedo
  } = useTasks();

  // États locaux pour l'interface
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('priority');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Configuration de la navigation
  const navigationItems = [
    { key: 'priority', title: 'Vue 1-3-5', icon: '🎲' },
    { key: 'dashboard', title: 'Dashboard', icon: '📊' },
    { key: 'eisenhower', title: 'Eisenhower', icon: '🧭' },
    { key: 'calendar', title: 'Calendrier', icon: '📅' },
    { key: 'completed', title: 'Terminées', icon: '✅' }
  ];

  // Gestion de la sélection
  const handleToggleSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Filtrage des tâches selon la vue
  const getFilteredTasks = () => {
    if (currentView === 'completed') {
      return tasks.filter(task => task.isCompleted);
    }
    return tasks.filter(task => !task.isCompleted);
  };

  const filteredTasks = getFilteredTasks();
  
  // Pour la liste de gauche, on exclut toujours les tâches terminées
  const filteredMainTasks = mainTasks.filter(task => !task.isCompleted);

  // Application du thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Rendu de la vue courante
  const renderCurrentView = () => {
    switch (currentView) {
      case 'priority':
        return (
          <PriorityView 
            tasks={filteredTasks}
            getSubTasks={getSubTasks}
            calculateTotalTime={calculateTotalTime}
          />
        );
      case 'dashboard':
        return (
          <DashboardView 
            tasks={filteredTasks}
            mainTasks={filteredMainTasks}
            calculateTotalTime={calculateTotalTime}
          />
        );
      case 'eisenhower':
        return <EisenhowerView tasks={filteredTasks} />;
      case 'calendar':
        return <CalendarView tasks={filteredTasks} />;
      case 'completed':
        return <CompletedTasksView tasks={tasks.filter(t => t.isCompleted)} />;
      default:
        return <div className="text-center text-theme-muted">Vue non trouvée</div>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-theme-background">
        {/* Header avec statistiques et historique */}
        <AppHeader
          tasksCount={tasks.filter(t => !t.isCompleted).length}
          completedTasks={completedTasks}
          completionRate={completionRate}
          canUndo={canUndo}
          canRedo={canRedo}
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
          {/* Colonne gauche : Liste des tâches actives (27% pour plus d'espace) */}
          <div className="w-[27%] bg-theme-background border-r border-theme-border flex flex-col shadow-sm">
            <TaskList 
              tasks={tasks}
              mainTasks={filteredMainTasks}
              pinnedTasks={pinnedTasks}
              onRemoveTask={removeTask}
              onReorderTasks={reorderTasks}
              onSortTasks={sortTasks}
              onToggleExpansion={toggleTaskExpansion}
              onToggleCompletion={toggleTaskCompletion}
              onTogglePinTask={togglePinTask}
              onAddTask={addTask}
              getSubTasks={getSubTasks}
              calculateTotalTime={calculateTotalTime}
              canHaveSubTasks={canHaveSubTasks}
              selectedTasks={selectedTasks}
              onToggleSelection={handleToggleSelection}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
            />
          </div>

          {/* Section droite : Vue courante (73%) */}
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
          onAddTask={addTask}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;
