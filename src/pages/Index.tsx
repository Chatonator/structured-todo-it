
import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import PriorityView from '@/components/PriorityView';
import DashboardView from '@/components/DashboardView';
import EisenhowerView from '@/components/EisenhowerView';
import CalendarView from '@/components/CalendarView';
import { useTasks } from '@/hooks/useTasks';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { 
    tasks, 
    mainTasks,
    addTask, 
    removeTask, 
    reorderTasks, 
    sortTasks,
    toggleTaskExpansion,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    tasksCount,
    totalProjectTime
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('tasks');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'tasks':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Colonne principale : Liste des tâches */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <TaskList 
                  tasks={tasks}
                  mainTasks={mainTasks}
                  onRemoveTask={removeTask}
                  onReorderTasks={reorderTasks}
                  onSortTasks={sortTasks}
                  onToggleExpansion={toggleTaskExpansion}
                  onAddTask={addTask}
                  getSubTasks={getSubTasks}
                  calculateTotalTime={calculateTotalTime}
                  canHaveSubTasks={canHaveSubTasks}
                />
              </div>
            </div>

            {/* Colonne de droite : Résumé du projet */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Résumé du projet</h2>
                
                {tasksCount > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{tasksCount}</p>
                      <p className="text-sm text-gray-600">tâche{tasksCount !== 1 ? 's' : ''} totale{tasksCount !== 1 ? 's' : ''}</p>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(totalProjectTime)}
                      </p>
                      <p className="text-sm text-gray-600">minutes au total</p>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-700">
                        {mainTasks.length}
                      </p>
                      <p className="text-sm text-gray-600">tâche{mainTasks.length !== 1 ? 's' : ''} principale{mainTasks.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">Aucune tâche créée</p>
                    <p className="text-gray-400 text-xs mt-1">Commencez par créer votre première tâche</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'priority':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <PriorityView 
              tasks={tasks}
              getSubTasks={getSubTasks}
              calculateTotalTime={calculateTotalTime}
            />
          </div>
        );
      case 'dashboard':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <DashboardView 
              tasks={tasks}
              mainTasks={mainTasks}
              calculateTotalTime={calculateTotalTime}
            />
          </div>
        );
      case 'eisenhower':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <EisenhowerView tasks={tasks} />
          </div>
        );
      case 'calendar':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <CalendarView tasks={tasks} />
          </div>
        );
      default:
        return <div>Vue non trouvée</div>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
        
        <main className="flex-1 p-6">
          {/* Header avec navigation */}
          <header className="bg-white shadow-sm border rounded-lg mb-6">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">TO-DO-IT</h1>
                    <p className="text-xs text-gray-600">
                      Gestion mentale simplifiée
                    </p>
                  </div>
                </div>
                
                {/* Bouton nouvelle tâche */}
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </div>
            </div>
          </header>

          {/* Contenu de la vue courante */}
          {renderCurrentView()}

          {/* Modale de création de tâches */}
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAddTask={addTask}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
