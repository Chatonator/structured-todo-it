
import React from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Clock, Calendar } from 'lucide-react';

interface CompletedTasksViewProps {
  tasks: Task[];
}

const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({ tasks }) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const totalCompletedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Aucune tâche terminée</h3>
        <p className="text-sm text-gray-400">Les tâches terminées apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tâches Terminées</h2>
        <p className="text-sm text-gray-600">Suivez vos accomplissements</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches Terminées</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Total</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatDuration(totalCompletedTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne/Tâche</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(totalCompletedTime / tasks.length)} min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des tâches terminées */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des tâches terminées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map(task => {
              const categoryConfig = CATEGORY_CONFIG[task.category];
              const subCategoryConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
              
              return (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{categoryConfig.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900 line-through">{task.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{categoryConfig.icon} {task.category}</span>
                          {subCategoryConfig && (
                            <span>{subCategoryConfig.icon} {task.subCategory}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatDuration(task.estimatedTime)}</div>
                    <div className="text-sm text-gray-500">{formatDate(task.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletedTasksView;
