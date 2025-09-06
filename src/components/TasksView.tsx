
import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG } from '@/types/task';
import { Clock, CheckSquare, Users, Calendar, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TaskModal from './TaskModal';
import { cssVarRGB } from '@/utils/colors';

interface TasksViewProps {
  tasks: Task[];
  mainTasks: Task[];
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

/**
 * Vue Tâches - Affichage aéré et visuellement agréable de toutes les tâches
 * Sécurisée contre les données undefined/null
 */
const TasksView: React.FC<TasksViewProps> = ({
  tasks = [],
  mainTasks = [],
  getSubTasks,
  calculateTotalTime,
  onUpdateTask
}) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sécurisation des props
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
    if (!task || typeof task !== 'object') {
      console.warn('Tentative d\'édition d\'une tâche invalide:', task);
      return;
    }
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setIsEditModalOpen(false);
  };

  const renderTaskCard = (task: Task) => {
    if (!task || typeof task !== 'object') {
      console.warn('Tentative de rendu d\'une tâche invalide:', task);
      return null;
    }

    // Protection contre les catégories inconnues
    const categoryConfig = CATEGORY_CONFIG[task.category] || { cssName: 'default' };
    const subCategoryConfig = task.subCategory && SUB_CATEGORY_CONFIG[task.subCategory] 
      ? SUB_CATEGORY_CONFIG[task.subCategory] 
      : null;
    
    if (!CATEGORY_CONFIG[task.category]) {
      console.warn('Catégorie inconnue:', task.category, task);
    }
    
    if (task.subCategory && !SUB_CATEGORY_CONFIG[task.subCategory]) {
      console.warn('Sous-catégorie inconnue:', task.subCategory, task);
    }

    const contextConfig = CONTEXT_CONFIG[task.context] || CONTEXT_CONFIG['Perso'];
    const subTasks = getSubTasks ? getSubTasks(task.id || '') : [];
    const totalTime = calculateTotalTime ? calculateTotalTime(task) : (Number(task.estimatedTime) || 0);

    const resolvedCategoryColor = cssVarRGB(`--color-${categoryConfig.cssName}`);

    return (
      <Card key={task.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 bg-theme-card" 
            style={{ borderLeftColor: resolvedCategoryColor }}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-theme-foreground leading-tight">
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
                  className="text-xs" 
                  categoryColor={`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`}
                >
                  {subCategoryConfig.priority}★
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className="text-xs" 
                categoryColor={`--color-context-${(task.context || 'perso').toLowerCase()}`}
              >
                {task.context || 'Perso'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-theme-muted">
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

              {task.scheduledDate && task.scheduledTime && (
                <div className="flex items-center gap-1 text-primary">
                  <Calendar className="w-4 h-4" />
                  <span>Planifiée {new Date(task.scheduledDate).toLocaleDateString('fr-FR')} à {task.scheduledTime}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="text-xs"
                categoryColor={`--color-${categoryConfig.cssName}`}
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
              <h4 className="text-sm font-medium text-theme-foreground">Sous-tâches :</h4>
              <div className="grid gap-2">
                {subTasks.map(subTask => {
                  if (!subTask || typeof subTask !== 'object') return null;
                  
                  return (
                    <div key={subTask.id} className="flex items-center gap-2 p-2 bg-theme-accent rounded-md">
                      <CheckSquare className={`w-3 h-3 ${subTask.isCompleted ? 'text-system-success' : 'text-theme-muted'}`} />
                      <span className={`text-sm ${subTask.isCompleted ? 'line-through text-theme-muted' : 'text-theme-foreground'}`}>
                        {subTask.name || 'Sous-tâche sans nom'}
                      </span>
                      <span className="text-xs text-theme-muted ml-auto">
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

  // Séparer les tâches actives et terminées de manière sécurisée
  const activeTasks = safeMainTasks.filter(task => task && !task.isCompleted);
  const completedTasks = safeMainTasks.filter(task => task && task.isCompleted);

  return (
    <>
      <div className="space-y-8 bg-theme-background text-theme-foreground">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-theme-foreground mb-2">
            Toutes les tâches
          </h1>
          <p className="text-theme-muted">
            Vue d'ensemble de vos tâches avec un affichage détaillé et aéré
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-theme-card border-theme-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-theme-foreground">{activeTasks.length}</div>
              <div className="text-sm text-theme-muted">Tâches actives</div>
            </CardContent>
          </Card>
          <Card className="bg-theme-card border-theme-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-theme-foreground">{completedTasks.length}</div>
              <div className="text-sm text-theme-muted">Tâches terminées</div>
            </CardContent>
          </Card>
          <Card className="bg-theme-card border-theme-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-theme-foreground">
                {formatDuration(activeTasks.reduce((total, task) => {
                  const taskTime = calculateTotalTime ? calculateTotalTime(task) : (Number(task.estimatedTime) || 0);
                  return total + taskTime;
                }, 0))}
              </div>
              <div className="text-sm text-theme-muted">Temps total estimé</div>
            </CardContent>
          </Card>
        </div>

        {/* Tâches actives */}
        {activeTasks.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-theme-foreground mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-theme-primary rounded"></div>
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
            <h2 className="text-2xl font-semibold text-theme-foreground mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-system-success rounded"></div>
              Tâches terminées ({completedTasks.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTasks.map(task => renderTaskCard(task)).filter(Boolean)}
            </div>
          </div>
        )}

        {/* Message si aucune tâche */}
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-theme-foreground mb-2">
              Aucune tâche pour le moment
            </h3>
            <p className="text-theme-muted">
              Commencez par créer votre première tâche !
            </p>
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {isEditModalOpen && (
  <TaskModal
    key={editingTask?.id}
    isOpen
    onClose={handleCloseEditModal}
    onUpdateTask={onUpdateTask}
    editingTask={editingTask}
  />
)}

    </>
  );
};

export default TasksView;
