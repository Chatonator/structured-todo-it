
import React, { useState } from 'react';
import TaskList from '@/components/TaskList';
import TaskModal from '@/components/TaskModal';
import { useTasks } from '@/hooks/useTasks';
import { CheckSquare, Plus } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header avec bouton de création */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
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

      {/* Contenu principal */}
      <main className="max-w-6xl mx-auto px-4 py-6">
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
      </main>

      {/* Modale de création de tâches */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={addTask}
      />
    </div>
  );
};

export default Index;
