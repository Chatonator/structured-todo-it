
import React from 'react';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import { useTasks } from '@/hooks/useTasks';
import { CheckSquare } from 'lucide-react';

const Index = () => {
  const { tasks, addTask, removeTask, reorderTasks, sortTasks, tasksCount } = useTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header compact */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
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
        </div>
      </header>

      {/* Contenu principal en colonnes */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche : Liste des tâches */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <TaskList 
                tasks={tasks} 
                onRemoveTask={removeTask}
                onReorderTasks={reorderTasks}
                onSortTasks={sortTasks}
              />
            </div>
          </div>

          {/* Colonne de droite : Création de tâche */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Créer une tâche</h2>
              <TaskForm onAddTask={addTask} />
              
              {/* Résumé compact */}
              {tasksCount > 0 && (
                <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="text-center text-gray-600">
                    <p className="font-medium">{tasksCount} tâche{tasksCount !== 1 ? 's' : ''}</p>
                    <p className="text-xs mt-1">
                      {Math.round(tasks.reduce((sum, task) => sum + task.estimatedTime, 0))} minutes au total
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
