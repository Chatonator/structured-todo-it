
import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Target, Calendar, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EisenhowerViewProps {
  tasks: Task[];
}

// Mappage des catégories vers les quadrants d'Eisenhower
const getCategoryQuadrant = (category: string): 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important' => {
  const mapping = {
    'Obligation': 'urgent-important' as const,
    'Envie': 'important-not-urgent' as const,
    'Quotidien': 'urgent-not-important' as const,
    'Autres': 'not-urgent-not-important' as const
  };
  return mapping[category as keyof typeof mapping] || 'not-urgent-not-important';
};

const EisenhowerView: React.FC<EisenhowerViewProps> = ({ tasks }) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

  // Organisation des tâches par quadrant
  const quadrants = {
    'urgent-important': {
      title: 'Urgent & Important',
      subtitle: 'À FAIRE MAINTENANT',
      color: 'bg-red-50 border-red-200',
      headerColor: 'bg-red-100 text-red-800',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      description: 'Crises, urgences, problèmes pressants',
      tasks: tasks.filter(task => getCategoryQuadrant(task.category) === 'urgent-important')
    },
    'important-not-urgent': {
      title: 'Important & Non Urgent',
      subtitle: 'À PLANIFIER',
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-green-100 text-green-800',
      icon: <Target className="w-5 h-5 text-green-600" />,
      description: 'Prévention, amélioration, développement',
      tasks: tasks.filter(task => getCategoryQuadrant(task.category) === 'important-not-urgent')
    },
    'urgent-not-important': {
      title: 'Urgent & Non Important',
      subtitle: 'À DÉLÉGUER',
      color: 'bg-yellow-50 border-yellow-200',
      headerColor: 'bg-yellow-100 text-yellow-800',
      icon: <Calendar className="w-5 h-5 text-yellow-600" />,
      description: 'Interruptions, certains appels, emails',
      tasks: tasks.filter(task => getCategoryQuadrant(task.category) === 'urgent-not-important')
    },
    'not-urgent-not-important': {
      title: 'Non Urgent & Non Important',
      subtitle: 'À ÉLIMINER',
      color: 'bg-gray-50 border-gray-200',
      headerColor: 'bg-gray-100 text-gray-800',
      icon: <Archive className="w-5 h-5 text-gray-600" />,
      description: 'Distractions, certaines activités',
      tasks: tasks.filter(task => getCategoryQuadrant(task.category) === 'not-urgent-not-important')
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getTotalTime = (quadrantTasks: Task[]): number => {
    return quadrantTasks.reduce((total, task) => total + task.estimatedTime, 0);
  };

  const renderTaskCard = (task: Task) => {
    const categoryConfig = CATEGORY_CONFIG[task.category];
    
    return (
      <div
        key={task.id}
        className={`
          p-3 border rounded-lg hover:shadow-sm transition-all
          ${task.isCompleted ? 'opacity-60 bg-gray-50' : 'bg-white'}
          ${categoryConfig.pattern}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.name}
          </h4>
          <Badge variant="outline" className="text-xs">
            {categoryConfig.icon}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(task.estimatedTime)}</span>
          {task.isCompleted && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Terminée
            </Badge>
          )}
        </div>
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Aucune tâche à organiser</h3>
        <p className="text-sm text-gray-400">Créez des tâches pour voir la matrice d'Eisenhower</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Matrice d'Eisenhower</h2>
        <p className="text-sm text-gray-600 mb-4">
          Organisez vos tâches selon leur urgence et leur importance
        </p>
        
        {/* Statistiques globales */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(quadrants).map(([key, quadrant]) => (
            <div key={key} className="text-center p-3 bg-white border rounded-lg">
              <div className="flex items-center justify-center mb-1">
                {quadrant.icon}
              </div>
              <div className="text-lg font-bold text-gray-900">{quadrant.tasks.length}</div>
              <div className="text-xs text-gray-500">tâches</div>
              <div className="text-xs text-gray-400">{formatDuration(getTotalTime(quadrant.tasks))}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Matrice 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(quadrants).map(([key, quadrant]) => (
          <Card 
            key={key} 
            className={`${quadrant.color} cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setSelectedQuadrant(selectedQuadrant === key ? null : key)}
          >
            <CardHeader className={`${quadrant.headerColor} rounded-t-lg`}>
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {quadrant.icon}
                  <div>
                    <div className="font-bold">{quadrant.title}</div>
                    <div className="text-xs font-normal opacity-80">{quadrant.subtitle}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {quadrant.tasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 mb-3 italic">
                {quadrant.description}
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {quadrant.tasks.length > 0 ? (
                  quadrant.tasks.map(task => renderTaskCard(task))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <div className="text-xs">Aucune tâche dans ce quadrant</div>
                  </div>
                )}
              </div>
              
              {quadrant.tasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Total: {quadrant.tasks.length} tâche{quadrant.tasks.length > 1 ? 's' : ''}</span>
                    <span>{formatDuration(getTotalTime(quadrant.tasks))}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conseils d'action */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">💡 Conseils d'action</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-red-700 mb-1">🔥 Urgent & Important</h4>
              <p className="text-xs">Traitez immédiatement ces tâches. Elles ne peuvent pas attendre.</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-1">🎯 Important & Non Urgent</h4>
              <p className="text-xs">Planifiez du temps dédié. C'est ici que vous devez investir le plus.</p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-700 mb-1">⚡ Urgent & Non Important</h4>
              <p className="text-xs">Déléguez si possible, ou traitez rapidement.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">🗑️ Non Urgent & Non Important</h4>
              <p className="text-xs">Éliminez ou minimisez ces activités.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EisenhowerView;
