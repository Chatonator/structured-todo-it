
import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Clock, Calendar, Trash2, RotateCcw, ArrowUpDown } from 'lucide-react';

interface CompletedTasksViewProps {
  tasks: Task[];
  onRestoreTask?: (taskId: string) => void;
  onRemoveTask?: (taskId: string) => void;
}

const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({ 
  tasks, 
  onRestoreTask, 
  onRemoveTask 
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'name'>('date');

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

  // Mapping statique des couleurs de catégorie
  const CATEGORY_COLORS = {
    'Obligation': '#DC2626',
    'Quotidien': '#FBBF24', 
    'Envie': '#86EFAC',
    'Autres': '#2563EB'
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'duration':
        return b.estimatedTime - a.estimatedTime;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const totalCompletedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Aucune tâche terminée</h3>
        <p className="text-sm text-muted-foreground">Les tâches terminées apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tâches Terminées</h2>
          <p className="text-sm text-muted-foreground">Suivez vos accomplissements</p>
        </div>
        
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(value: 'date' | 'duration' | 'name') => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Par date</SelectItem>
              <SelectItem value="duration">Par durée</SelectItem>
              <SelectItem value="name">Par nom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches Terminées</CardTitle>
            <CheckSquare className="h-4 w-4 text-system-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-system-success">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Total</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatDuration(totalCompletedTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne/Tâche</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
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
            {sortedTasks.map(task => {
              const categoryConfig = CATEGORY_CONFIG[task.category];
              const subCategoryConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
              
              // Couleur de catégorie statique
              const categoryColorKey = categoryConfig?.cssName === 'obligation' ? 'Obligation' :
                                     categoryConfig?.cssName === 'quotidien' ? 'Quotidien' :
                                     categoryConfig?.cssName === 'envie' ? 'Envie' : 'Autres';
              const categoryColor = CATEGORY_COLORS[categoryColorKey];
              
              return (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <CheckSquare className="w-5 h-5 text-system-success" />
                    <div className="flex items-center space-x-2 flex-1">
                      <div className={`w-3 h-3 rounded-full bg-category-${task.category.toLowerCase()}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground line-through">{task.name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{task.category}</span>
                          {subCategoryConfig && (
                            <span>{task.subCategory}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium text-foreground">{formatDuration(task.estimatedTime)}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(task.createdAt)}</div>
                    </div>
                    
                    <div className="flex gap-2">
                      {onRestoreTask && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRestoreTask(task.id)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      {onRemoveTask && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onRemoveTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
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
