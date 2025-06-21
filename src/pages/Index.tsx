
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import PriorityView from '@/components/PriorityView';
import DashboardView from '@/components/DashboardView';
import EisenhowerView from '@/components/EisenhowerView';
import CalendarView from '@/components/CalendarView';
import { useTasks } from '@/hooks/useTasks';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare } from 'lucide-react';

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
  const [currentView, setCurrentView] = useState('priority');
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation items
  const navigationItems = [
    { key: 'priority', title: 'Vue 1-3-5', icon: '🎲' },
    { key: 'dashboard', title: 'Dashboard', icon: '📊' },
    { key: 'eisenhower', title: 'Eisenhower', icon: '🧭' },
    { key: 'calendar', title: 'Calendrier', icon: '📅' }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'priority':
        return (
          <PriorityView 
            tasks={tasks}
            getSubTasks={getSubTasks}
            calculateTotalTime={calculateTotalTime}
          />
        );
      case 'dashboard':
        return (
          <DashboardView 
            tasks={tasks}
            mainTasks={mainTasks}
            calculateTotalTime={calculateTotalTime}
          />
        );
      case 'eisenhower':
        return <EisenhowerView tasks={tasks} />;
      case 'calendar':
        return <CalendarView tasks={tasks} />;
      default:
        return <div>Vue non trouvée</div>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header avec navigation horizontale */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TO-DO-IT</h1>
                  <p className="text-xs text-gray-600">Gestion mentale simplifiée</p>
                </div>
              </div>
              
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle tâche
              </Button>
            </div>

            {/* Navigation horizontale */}
            <nav className="flex space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentView(item.key)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${currentView === item.key 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Contenu principal avec layout 30/70 */}
        <main className="flex-1 flex">
          {/* Colonne gauche : Liste des tâches (30%) */}
          <div className="w-[30%] bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              
              {/* Statistiques compactes */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="font-bold text-blue-600">{tasksCount}</div>
                  <div className="text-gray-600">tâches</div>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="font-bold text-green-600">{Math.round(totalProjectTime)}min</div>
                  <div className="text-gray-600">total</div>
                </div>
              </div>
            </div>

            {/* Liste des tâches avec scroll */}
            <div className="flex-1 overflow-y-auto p-4">
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

          {/* Section droite : Vue courante (70%) */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6 h-full">
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
