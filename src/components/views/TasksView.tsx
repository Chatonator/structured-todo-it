import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG } from '@/types/task';
import { Clock, CheckSquare, Users, Calendar, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TaskModal from '@/components/task/TaskModal';
import { ViewLayout } from '@/components/layout/view';
import { useViewDataContext } from '@/contexts/ViewDataContext';

interface TasksViewProps {
  className?: string;
}

/**
 * Vue Tâches - Affichage aéré et visuellement agréable de toutes les tâches
 * Utilise ViewLayout et useViewDataContext
 */
const TasksView: React.FC<TasksViewProps> = ({ className }) => {
  const { tasks, mainTasks, getSubTasks, calculateTotalTime, updateTask } = useViewDataContext();
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sécurisation des données
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeMainTasks = Array.isArray(mainTasks) ? mainTasks : [];

  const formatDuration = (minutes: number): string => {
    const safeMinutes = Number(minutes) || 0;
    if (safeMinutes < 60) return `${safeMinutes}m`;
    const hours = Math.floor(safeMinutes / 60);
    const remainingMinutes = safeMinutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  const handleEditTask = (task: Task) => {
    if (!task || typeof task !== 'object') return;
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setIsEditModalOpen(false);
  };

  const renderTaskCard = (task: Task) => {
    if (!task || typeof task !== 'object') return null;

    const categoryConfig = CATEGORY_CONFIG[task.category] || { cssName: 'default' };
    const subCategoryConfig = task.subCategory && SUB_CATEGORY_CONFIG[task.subCategory] 
      ? SUB_CATEGORY_CONFIG[task.subCategory] 
      : null;

    const contextConfig = CONTEXT_CONFIG[task.context] || CONTEXT_CONFIG['Perso'];
    const subTasks = getSubTasks ? getSubTasks(task.id || '') : [];
    const totalTime = calculateTotalTime ? calculateTotalTime(task) : (Number(task.estimatedTime) || 0);

    return (
      <Card key={task.id} className={`group hover:shadow-lg transition-all duration-200 border-l-4 bg-card border-l-category-${task.category.toLowerCase()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-foreground leading-tight">
              {task.name || 'Tâche sans nom'}
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditTask(task)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-4 h-4" />
              </Button>
              {subCategoryConfig && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    subCategoryConfig.priority > 3 ? 'bg-priority-highest/10 border-priority-highest text-priority-highest' :
                    subCategoryConfig.priority > 2 ? 'bg-priority-high/10 border-priority-high text-priority-high' :
                    subCategoryConfig.priority > 1 ? 'bg-priority-medium/10 border-priority-medium text-priority-medium' :
                    'bg-priority-low/10 border-priority-low text-priority-low'
                  }`}
                >
                  {subCategoryConfig.priority}★
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  (task.context || 'perso').toLowerCase() === 'pro' ? 'bg-context-pro/10 border-context-pro text-context-pro' : 'bg-context-perso/10 border-context-perso text-context-perso'
                }`}
              >
                {task.context || 'Perso'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(totalTime)}</span>
              </div>
              
              {Array.isArray(subTasks) && subTasks.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{subTasks.length} tâche{subTasks.length > 1 ? 's' : ''}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{task.createdAt ? new Date(task.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  task.category?.toLowerCase() === 'obligation' ? 'bg-category-obligation/10 border-category-obligation text-category-obligation' :
                  task.category?.toLowerCase() === 'quotidien' ? 'bg-category-quotidien/10 border-category-quotidien text-category-quotidien' :
                  task.category?.toLowerCase() === 'envie' ? 'bg-category-envie/10 border-category-envie text-category-envie' :
                  'bg-category-autres/10 border-category-autres text-category-autres'
                }`}
              >
                {task.category || 'Non définie'}
              </Badge>
              
              {task.isCompleted && (
                <div className="flex items-center gap-1 text-system-success">
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-xs">Terminée</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Sous-tâches si présentes */}
          {Array.isArray(subTasks) && subTasks.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-foreground">Sous-tâches :</h4>
              <div className="grid gap-2">
                {subTasks.map(subTask => {
                  if (!subTask || typeof subTask !== 'object') return null;
                  
                  return (
                    <div key={subTask.id} className="flex items-center gap-2 p-2 bg-accent rounded-md">
                      <CheckSquare className={`w-3 h-3 ${subTask.isCompleted ? 'text-system-success' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${subTask.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {subTask.name || 'Sous-tâche sans nom'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDuration(subTask.estimatedTime)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Tâches actives et terminées
  const activeTasks = safeMainTasks.filter(task => task && !task.isCompleted);
  const completedTasks = safeMainTasks.filter(task => task && task.isCompleted);

  const isEmpty = activeTasks.length === 0 && completedTasks.length === 0;

  return (
    <>
      <ViewLayout
        header={{
          title: "Toutes les tâches",
          subtitle: "Vue d'ensemble de vos tâches avec un affichage détaillé et aéré",
          icon: <CheckSquare className="w-5 h-5" />
        }}
        state={isEmpty ? 'empty' : 'success'}
        emptyProps={{
          title: "Aucune tâche pour le moment",
          message: "Commencez par créer votre première tâche !",
          icon: <CheckSquare className="w-12 h-12" />
        }}
        className={className}
      >
        <div className="space-y-8">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{activeTasks.length}</div>
                <div className="text-sm text-muted-foreground">Tâches actives</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{completedTasks.length}</div>
                <div className="text-sm text-muted-foreground">Tâches terminées</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {formatDuration(activeTasks.reduce((total, task) => {
                    const taskTime = calculateTotalTime ? calculateTotalTime(task) : (Number(task.estimatedTime) || 0);
                    return total + taskTime;
                  }, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Temps total estimé</div>
              </CardContent>
            </Card>
          </div>

          {/* Tâches actives */}
          {activeTasks.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded"></div>
                Tâches actives ({activeTasks.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeTasks.map(task => renderTaskCard(task)).filter(Boolean)}
              </div>
            </div>
          )}

          {/* Tâches terminées */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-system-success rounded"></div>
                Tâches terminées ({completedTasks.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedTasks.map(task => renderTaskCard(task)).filter(Boolean)}
              </div>
            </div>
          )}
        </div>
      </ViewLayout>

      {/* Modal d'édition */}
      {isEditModalOpen && (
        <TaskModal
          key={editingTask?.id}
          isOpen
          onClose={handleCloseEditModal}
          onUpdateTask={updateTask}
          editingTask={editingTask}
        />
      )}
    </>
  );
};

export default TasksView;
