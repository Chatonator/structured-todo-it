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
import { Plus, Search, Filter, CheckSquare, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Navigation items
  const navigationItems = [
    { key: 'priority', title: 'Vue 1-3-5', icon: '🎲' },
    { key: 'dashboard', title: 'Dashboard', icon: '📊' },
    { key: 'eisenhower', title: 'Eisenhower', icon: '🧭' },
    { key: 'calendar', title: 'Calendrier', icon: '📅' },
    { key: 'completed', title: 'Terminées', icon: '✅' }
  ];

  // Logique de sélection
  const handleToggleSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleCompleteSelected = () => {
    selectedTasks.forEach(taskId => {
      toggleTaskCompletion(taskId);
    });
    setSelectedTasks([]);
  };

  const handleDeleteSelected = () => {
    selectedTasks.forEach(taskId => {
      removeTask(taskId);
    });
    setSelectedTasks([]);
  };

  // Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && task.isCompleted) ||
      (statusFilter === 'pending' && !task.isCompleted);
    const matchesView = currentView === 'completed' ? task.isCompleted : true;
    return matchesSearch && matchesCategory && matchesStatus && matchesView;
  });

  const filteredMainTasks = mainTasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && task.isCompleted) ||
      (statusFilter === 'pending' && !task.isCompleted);
    const matchesView = currentView === 'completed' ? task.isCompleted : true;
    return matchesSearch && matchesCategory && matchesStatus && matchesView;
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
        {/* Header amélioré */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TO-DO-IT</h1>
                  <p className="text-xs text-gray-600">Gestion mentale simplifiée</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Statistiques en header */}
                <div className="flex items-center space-x-4 text-xs text-gray-600 mr-4">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{tasksCount} tâches</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{completedTasks} terminées</span>
                  </span>
                  <span>{completionRate}% complet</span>
                </div>
                
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </div>
            </div>

            {/* Navigation horizontale améliorée */}
            <nav className="flex space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentView(item.key)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${currentView === item.key 
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
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

        {/* Contenu principal avec layout 25/75 optimisé */}
        <main className="flex-1 flex">
          {/* Colonne gauche : Liste des tâches (25%) */}
          <div className="w-[25%] bg-white border-r flex flex-col shadow-sm">
            <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-white">
              {/* Barre de recherche améliorée */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm h-8 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {/* Filtres améliorés */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-7 text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                      <SelectItem key={category} value={category}>
                        {config.icon} {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous états</SelectItem>
                    <SelectItem value="pending">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions de sélection */}
              {selectedTasks.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                  <span className="text-xs text-blue-700 font-medium">
                    {selectedTasks.length} sélectionnée{selectedTasks.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCompleteSelected}
                      className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                    >
                      <CheckSquare className="w-3 h-3 mr-1" />
                      Terminer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteSelected}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Supprimer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTasks([])}
                      className="h-6 w-6 p-0 text-gray-500"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Statistiques compactes */}
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-2 rounded text-center">
                  <div className="font-bold text-blue-600">{filteredTasks.length}</div>
                  <div className="text-gray-600">visibles</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-2 rounded text-center">
                  <div className="font-bold text-green-600">{filteredTasks.filter(t => t.isCompleted).length}</div>
                  <div className="text-gray-600">terminées</div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-2 rounded text-center">
                  <div className="font-bold text-orange-600">{Math.round(totalProjectTime / 60)}h</div>
                  <div className="text-gray-600">temps</div>
                </div>
              </div>
            </div>

            {/* Liste des tâches avec scroll intégré */}
            <div className="flex-1 overflow-hidden">
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
                selectedTasks={selectedTasks}
                onToggleSelection={handleToggleSelection}
              />
            </div>
          </div>

          {/* Section droite : Vue courante (75%) */}
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
