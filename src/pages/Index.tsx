
import React from 'react';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import { useTasks } from '@/hooks/useTasks';
import { CheckSquare } from 'lucide-react';

const Index = () => {
  const { tasks, addTask, tasksCount } = useTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TO-DO-IT</h1>
              <p className="text-sm text-gray-600">
                Gestion mentale simplifiée de vos tâches
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Section de création de tâche */}
        <div className="mb-8">
          <TaskForm onAddTask={addTask} />
        </div>

        {/* Section d'affichage des tâches */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <TaskList tasks={tasks} />
        </div>

        {/* Footer avec informations */}
        {tasksCount > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Vous avez {tasksCount} tâche{tasksCount !== 1 ? 's' : ''} en attente.
              Temps total estimé : {' '}
              {Math.round(tasks.reduce((sum, task) => sum + task.estimatedTime, 0))} minutes
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
