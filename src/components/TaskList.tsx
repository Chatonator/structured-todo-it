
import React from 'react';
import { Task, CATEGORY_CONFIG } from '@/types/task';
import { Clock } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  // Formater la durée pour l'affichage
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Formater la date de création
  const formatCreatedAt = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <Clock className="w-12 h-12 mx-auto mb-3" />
        </div>
        <h3 className="text-lg font-medium text-gray-500 mb-1">Aucune tâche</h3>
        <p className="text-gray-400">Créez votre première tâche pour commencer !</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Mes tâches ({tasks.length})
        </h2>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const categoryConfig = CATEGORY_CONFIG[task.category];
          
          return (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Informations principales */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  {/* Nom de la tâche */}
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {task.name}
                  </h3>
                  
                  {/* Badge catégorie */}
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${categoryConfig.color}
                  `}>
                    {task.category}
                  </span>
                </div>
                
                {/* Méta-informations */}
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(task.estimatedTime)}
                  </span>
                  <span>
                    {formatCreatedAt(task.createdAt)}
                  </span>
                </div>
              </div>

              {/* Indicateur visuel de durée */}
              <div className="flex-shrink-0 ml-4">
                <div className={`
                  w-2 h-8 rounded-full
                  ${task.estimatedTime <= 5 ? 'bg-green-400' : 
                    task.estimatedTime <= 30 ? 'bg-yellow-400' : 
                    'bg-red-400'}
                `} title={`${task.estimatedTime} minutes`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Statistiques rapides */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
            const count = tasks.filter(task => task.category === category).length;
            const totalTime = tasks
              .filter(task => task.category === category)
              .reduce((sum, task) => sum + task.estimatedTime, 0);
            
            return (
              <div key={category} className="space-y-1">
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                  {category}
                </div>
                <div className="text-sm text-gray-600">
                  {count} tâche{count !== 1 ? 's' : ''}
                </div>
                {totalTime > 0 && (
                  <div className="text-xs text-gray-500">
                    {formatDuration(totalTime)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TaskList;
