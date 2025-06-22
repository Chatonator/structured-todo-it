
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import PriorityView from '@/components/PriorityView';
import DashboardView from '@/components/DashboardView';
import EisenhowerView from '@/components/EisenhowerView';
import CalendarView from '@/components/CalendarView';
import CompletedTasksView from '@/components/CompletedTasksView';
import UserOptionsMenu from '@/components/UserOptionsMenu';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from '@/hooks/useTheme';
import { Plus, Search, Filter, CheckSquare, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_CONFIG } from '@/types/task';

const Index = () => {
  const { theme } = useTheme();
  
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      <div className="min-h-screen flex flex-col w-full bg-theme-background">
        {/* Header amélioré */}
        <header className="bg-theme-background shadow-sm border-b border-theme-border">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-theme-primary rounded-lg">
                  <CheckSquare className="w-5 h-5 text-theme-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-theme-foreground">TO-DO-IT</h1>
                  <p className="text-xs text-theme-muted">Gestion mentale simplifiée</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Statistiques en header */}
                <div className="flex items-center space-x-4 text-xs text-theme-muted mr-4">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-theme-primary rounded-full"></div>
                    <span>{tasksCount} tâches</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-theme-success rounded-full"></div>
                    <span>{completedTasks} terminées</span>
                  </span>
                  <span>{completionRate}% complet</span>
                </div>
                
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-theme-primary hover:opacity-90 text-theme-primary-foreground transition-opacity"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
                
                <UserOptionsMenu />
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
                      ? 'bg-theme-primary text-theme-primary-foreground shadow-sm' 
                      : 'text-theme-muted hover:bg-theme-accent hover:text-theme-foreground'
                    }
                  `}
                >
                  <span className="text-base">{item.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Contenu principal avec layout 20/80 optimisé */}
        <main className="flex-1 flex">
          {/* Colonne gauche : Liste des tâches (20%) */}
          <div className="w-[20%] bg-theme-background border-r border-theme-border flex flex-col shadow-sm">
            <div className="p-3 border-b border-theme-border bg-theme-accent">
              {/* Barre de recherche améliorée */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-muted w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm h-8 border-theme-border bg-theme-background text-theme-foreground focus:border-theme-primary"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0 text-theme-muted hover:text-theme-foreground"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {/* Filtres */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-7 text-xs border-theme-border bg-theme-background text-theme-foreground">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-background border-theme-border">
                    <SelectItem value="all" className="text-theme-foreground">Toutes</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([category]) => (
                      <SelectItem key={category} value={category} className="text-theme-foreground">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-7 text-xs border-theme-border bg-theme-background text-theme-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-background border-theme-border">
                    <SelectItem value="all" className="text-theme-foreground">Tous états</SelectItem>
                    <SelectItem value="pending" className="text-theme-foreground">En cours</SelectItem>
                    <SelectItem value="completed" className="text-theme-foreground">Terminées</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions de sélection */}
              {selectedTasks.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-theme-primary/10 border border-theme-primary/20 rounded-lg mb-2">
                  <span className="text-xs text-theme-foreground font-medium">
                    {selectedTasks.length} sélectionnée{selectedTasks.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCompleteSelected}
                      className="h-6 px-2 text-xs text-theme-success hover:bg-theme-success/10"
                    >
                      <CheckSquare className="w-3 h-3 mr-1" />
                      Terminer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteSelected}
                      className="h-6 px-2 text-xs text-theme-error hover:bg-theme-error/10"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Supprimer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTasks([])}
                      className="h-6 w-6 p-0 text-theme-muted hover:text-theme-foreground"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Statistiques compactes */}
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="bg-theme-primary/10 p-2 rounded text-center">
                  <div className="font-bold text-theme-primary">{filteredTasks.length}</div>
                  <div className="text-theme-muted">visibles</div>
                </div>
                <div className="bg-theme-success/10 p-2 rounded text-center">
                  <div className="font-bold text-theme-success">{filteredTasks.filter(t => t.isCompleted).length}</div>
                  <div className="text-theme-muted">terminées</div>
                </div>
                <div className="bg-theme-warning/10 p-2 rounded text-center">
                  <div className="font-bold text-theme-warning">{Math.round(totalProjectTime / 60)}h</div>
                  <div className="text-theme-muted">temps</div>
                </div>
              </div>
            </div>

            {/* Liste des tâches avec scroll intégré */}
            <div className="flex-1 overflow-hidden">
              <TaskList 
                tasks={filteredTasks}
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
          </div>

          {/* Section droite : Vue courante (80%) */}
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
