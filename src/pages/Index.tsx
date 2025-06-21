
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import PriorityView from '@/components/PriorityView';
import DashboardView from '@/components/DashboardView';
import EisenhowerView from '@/components/EisenhowerView';
import CalendarView from '@/components/CalendarView';
import CompletedTasksView from '@/components/CompletedTasksView';
import { useTasks } from '@/hooks/useTasks';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare } from 'lucide-react';
import { CATEGORY_CONFIG } from '@/types/task';

const Index = () => {
  const { 
    tasks, 
    mainTasks,
    addTask, 
    removeTask, 
    reorderTasks, 
    sortTasks,
    toggleTaskExpansion,
    toggleTaskCompletion,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    tasksCount,
    totalProjectTime,
    completedTasks,
    completionRate
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  // Navigation items
  const navigationItems = [
    { key: 'priority', title: 'Vue 1-3-5', icon: '🎲' },
    { key: 'dashboard', title: 'Dashboard', icon: '📊' },
    { key: 'eisenhower', title: 'Eisenhower', icon: '🧭' },
    { key: 'calendar', title: 'Calendrier', icon: '📅' },
    { key: 'completed', title: 'Tâches terminées', icon: '✅' }
  ];

  // Filtrer les tâches selon les critères
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesCompletion = currentView === 'completed' ? task.isCompleted : !showCompleted || !task.isCompleted;
    return matchesSearch && matchesCategory && matchesCompletion;
  });

  const filteredMainTasks = mainTasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesCompletion = currentView === 'completed' ? task.isCompleted : !showCompleted || !task.isCompleted;
    return matchesSearch && matchesCategory && matchesCompletion;
  });

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

        {/* Contenu principal avec layout 20/80 */}
        <main className="flex-1 flex">
          {/* Colonne gauche : Liste des tâches (20%) */}
          <div className="w-[20%] bg-white border-r flex flex-col">
            <div className="p-3 border-b">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm h-8"
                />
              </div>
              
              {/* Filtres améliorés */}
              <div className="space-y-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-7 text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                      <SelectItem key={category} value={category}>
                        {config.icon} {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Statistiques compactes */}
              <div className="grid grid-cols-1 gap-1 mt-3 text-xs">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="font-bold text-blue-600">{tasksCount}</div>
                  <div className="text-gray-600">tâches</div>
                </div>
              </div>
            </div>

            {/* Liste des tâches avec scroll */}
            <div className="flex-1 overflow-y-auto p-3">
              <TaskList 
                tasks={filteredTasks}
                mainTasks={filteredMainTasks}
                onRemoveTask={removeTask}
                onReorderTasks={reorderTasks}
                onSortTasks={sortTasks}
                onToggleExpansion={toggleTaskExpansion}
                onToggleCompletion={toggleTaskCompletion}
                onAddTask={addTask}
                getSubTasks={getSubTasks}
                calculateTotalTime={calculateTotalTime}
                canHaveSubTasks={canHaveSubTasks}
              />
            </div>
          </div>

          {/* Section droite : Vue courante (80%) */}
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
