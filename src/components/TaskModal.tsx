
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Check, AlertTriangle, CalendarIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Task, TaskCategory, SubTaskCategory, TaskContext, TIME_OPTIONS, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG } from '@/types/task';
import { cssVarRGB } from '@/utils/colors';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  parentTask?: Task;
  editingTask?: Task;
}

interface TaskDraft {
  name: string;
  category: TaskCategory | '';
  subCategory: SubTaskCategory | '';
  context: TaskContext | '';
  estimatedTime: number | '';
  scheduledDate?: Date;
  scheduledTime?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddTask, 
  onUpdateTask, 
  parentTask, 
  editingTask 
}) => {
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([
    { name: '', category: '', subCategory: '', context: '', estimatedTime: '' }
  ]);
  const [schedulingError, setSchedulingError] = useState<string>('');

  // Si on édite une tâche, initialiser avec ses données
  useEffect(() => {
    if (editingTask) {
      setTaskDrafts([{
        name: editingTask.name,
        category: editingTask.category,
        subCategory: editingTask.subCategory || '',
        context: editingTask.context,
        estimatedTime: editingTask.estimatedTime,
        scheduledDate: editingTask.scheduledDate,
        scheduledTime: editingTask.scheduledTime
      }]);
    } else {
      setTaskDrafts([{ name: '', category: '', subCategory: '', context: '', estimatedTime: '' }]);
    }
    setSchedulingError('');
  }, [editingTask, isOpen]);

  const resetModal = () => {
    setTaskDrafts([{ name: '', category: '', subCategory: '', context: '', estimatedTime: '' }]);
    setSchedulingError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const addNewTaskDraft = () => {
    if (!editingTask) { // Seulement permettre plusieurs tâches si on n'édite pas
      setTaskDrafts([...taskDrafts, { name: '', category: '', subCategory: '', context: '', estimatedTime: '' }]);
    }
  };

  const updateTaskDraft = (index: number, field: keyof TaskDraft, value: string | number | Date) => {
    const updated = [...taskDrafts];
    updated[index] = { ...updated[index], [field]: value };
    setTaskDrafts(updated);
    
    // Vérifier la cohérence date/heure
    const draft = updated[index];
    if ((draft.scheduledDate && !draft.scheduledTime) || (!draft.scheduledDate && draft.scheduledTime)) {
      setSchedulingError('La date et l\'heure doivent être remplies ensemble ou laissées vides');
    } else {
      setSchedulingError('');
    }
  };

  const removeTaskDraft = (index: number) => {
    if (taskDrafts.length > 1 && !editingTask) {
      setTaskDrafts(taskDrafts.filter((_, i) => i !== index));
    }
  };

  const handleFinish = () => {
    // Vérifier qu'il n'y a pas d'erreur de planification
    if (schedulingError) {
      return;
    }
    
    const validTasks = taskDrafts.filter(draft => isTaskValid(draft));
    
    if (editingTask && onUpdateTask) {
      // Mode édition
      const draft = validTasks[0];
      if (draft) {
        const updates: Partial<Task> = {
          name: draft.name.trim(),
          category: draft.category as TaskCategory,
          subCategory: draft.subCategory as SubTaskCategory || undefined,
          context: draft.context as TaskContext,
          estimatedTime: Number(draft.estimatedTime),
          scheduledDate: draft.scheduledDate,
          scheduledTime: draft.scheduledTime,
          startTime: draft.scheduledDate && draft.scheduledTime ? 
            new Date(`${draft.scheduledDate.toISOString().split('T')[0]}T${draft.scheduledTime}:00`) : undefined,
          duration: draft.scheduledDate && draft.scheduledTime ? Number(draft.estimatedTime) : undefined
        };
        onUpdateTask(editingTask.id, updates);
      }
    } else if (onAddTask) {
      // Mode création
      validTasks.forEach(draft => {
        const level = parentTask ? Math.min((parentTask.level + 1), 2) as 0 | 1 | 2 : 0;
        
        onAddTask({
          name: draft.name.trim(),
          category: parentTask ? parentTask.category : draft.category as TaskCategory,
          subCategory: parentTask ? draft.subCategory as SubTaskCategory : undefined,
          context: draft.context as TaskContext,
          estimatedTime: Number(draft.estimatedTime),
          parentId: parentTask?.id,
          level,
          isExpanded: true,
          isCompleted: false,
          scheduledDate: draft.scheduledDate,
          scheduledTime: draft.scheduledTime,
          startTime: draft.scheduledDate && draft.scheduledTime ? 
            new Date(`${draft.scheduledDate.toISOString().split('T')[0]}T${draft.scheduledTime}:00`) : undefined,
          duration: draft.scheduledDate && draft.scheduledTime ? Number(draft.estimatedTime) : undefined
        });
      });
    }

    handleClose();
  };

  const isTaskValid = (task: TaskDraft): boolean => {
    const hasName = task.name.trim().length > 0;
    const hasEstimatedTime = task.estimatedTime !== '' && Number(task.estimatedTime) > 0;
    const hasContext = task.context !== '';
    
    // Vérifier la cohérence de la planification
    const schedulingValid = (!task.scheduledDate && !task.scheduledTime) || 
                           (task.scheduledDate && task.scheduledTime);
    
    if (parentTask) {
      const hasSubCategory = task.subCategory !== '';
      return hasName && hasSubCategory && hasEstimatedTime && hasContext && schedulingValid;
    } else {
      const hasCategory = task.category !== '';
      return hasName && hasCategory && hasEstimatedTime && hasContext && schedulingValid;
    }
  };

  const allTasksValid = taskDrafts.length > 0 && taskDrafts.every(draft => isTaskValid(draft)) && !schedulingError;
  const validTasksCount = taskDrafts.filter(draft => isTaskValid(draft)).length;
  const showLimitWarning = parentTask && taskDrafts.length > 3;

  // Calculer les colonnes selon le nombre de tâches
  const shouldUseGrid = taskDrafts.length >= 2 && !editingTask;
  const gridCols = taskDrafts.length >= 4 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2';

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {}} // Empêcher la fermeture involontaire
    >
      <DialogContent className={`max-w-4xl max-h-[85vh] overflow-y-auto ${shouldUseGrid ? 'min-w-[800px]' : 'max-w-md'}`}>
        <DialogHeader>
          <DialogTitle>
            {editingTask 
              ? `Modifier "${editingTask.name}"`
              : parentTask 
                ? `Créer des sous-tâches pour "${parentTask.name}"` 
                : 'Nouvelle(s) tâche(s)'
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {showLimitWarning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous avez dépassé la limite recommandée de 3 sous-tâches. Cela peut nuire à la lisibilité.
              </AlertDescription>
            </Alert>
          )}

          {schedulingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {schedulingError}
              </AlertDescription>
            </Alert>
          )}

          <div className={shouldUseGrid ? `grid ${gridCols} gap-4` : 'space-y-4'}>
            {taskDrafts.map((draft, index) => {
              const isValid = isTaskValid(draft);
              
              return (
                <div key={index} className={`p-4 border rounded-lg space-y-4 ${!isValid ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {editingTask ? 'Modifier la tâche' : `Tâche ${index + 1}`}
                    </span>
                    {taskDrafts.length > 1 && !editingTask && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTaskDraft(index)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        ×
                      </Button>
                    )}
                  </div>

                  <div>
                    <Input
                      type="text"
                      value={draft.name}
                      onChange={(e) => updateTaskDraft(index, 'name', e.target.value)}
                      placeholder="Nom de la tâche..."
                      className={`text-sm ${!draft.name.trim() ? 'border-red-300' : ''}`}
                    />
                  </div>

                  {/* Boutons contexte Pro/Perso OBLIGATOIRES */}
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">
                      Contexte <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(CONTEXT_CONFIG).map(([context, config]) => {
                        const resolvedContextColor = cssVarRGB(`--color-context-${context.toLowerCase()}`);
                        const isSelected = draft.context === context;

                        return (
                          <button
                            key={context}
                            type="button"
                            onClick={() => updateTaskDraft(index, 'context', context)}
                            className={`
                              flex items-center justify-center space-x-2 p-3 text-sm border rounded transition-all
                              ${isSelected 
                                ? 'border-current shadow-sm' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                              }
                              ${!draft.context ? 'border-red-300' : ''}
                            `}
                            style={isSelected ? {
                              backgroundColor: `${resolvedContextColor.replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
                              borderColor: resolvedContextColor,
                              color: resolvedContextColor
                            } : {}}
                          >
                            <span className="font-medium">{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">
                      {parentTask ? 'Priorité' : 'Catégorie'}
                    </Label>
                    <div className="grid grid-cols-2 gap-1">
                      {parentTask ? (
                        Object.entries(SUB_CATEGORY_CONFIG).map(([subCat, config]) => {
                          const isSelected = draft.subCategory === subCat;
                          return (
                            <button
                              key={subCat}
                              type="button"
                              onClick={() => updateTaskDraft(index, 'subCategory', subCat)}
                              className={`
                                flex items-center space-x-1 p-2 text-xs border rounded transition-all
                                ${isSelected 
                                  ? `${config.color} border-current` 
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                                }
                              `}
                            >
                              <span className="font-medium truncate">{subCat}</span>
                            </button>
                          );
                        })
                      ) : (
                        Object.entries(CATEGORY_CONFIG).map(([cat, config]) => {
                          const resolvedCategoryColor = cssVarRGB(`--color-${config.cssName}`);
                          const isSelected = draft.category === cat;

                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => updateTaskDraft(index, 'category', cat)}
                              className={`
                                flex items-center space-x-1 p-2 text-xs border rounded transition-all
                                ${isSelected 
                                  ? 'border-current shadow-sm' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                                }
                              `}
                              style={isSelected ? {
                                backgroundColor: `${resolvedCategoryColor.replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
                                borderColor: resolvedCategoryColor,
                                color: resolvedCategoryColor
                              } : {}}
                            >
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: resolvedCategoryColor }}
                              />
                              <span className="font-medium truncate">{cat}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <Select 
                      value={draft.estimatedTime.toString()} 
                      onValueChange={(value) => updateTaskDraft(index, 'estimatedTime', Number(value))}
                    >
                      <SelectTrigger className={`h-9 text-sm ${!draft.estimatedTime ? 'border-red-300' : ''}`}>
                        <SelectValue placeholder="Temps estimé..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Planification optionnelle */}
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <Label className="text-sm text-gray-700">Planification (optionnelle)</Label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Sélection de date */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !draft.scheduledDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {draft.scheduledDate ? format(draft.scheduledDate, "d MMM", { locale: fr }) : "Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={draft.scheduledDate}
                            onSelect={(date) => updateTaskDraft(index, 'scheduledDate', date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>

                      {/* Sélection d'heure */}
                      <Select 
                        value={draft.scheduledTime || ''} 
                        onValueChange={(value) => updateTaskDraft(index, 'scheduledTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Heure" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return (
                              <SelectItem key={hour} value={`${hour}:00`}>
                                {hour}:00
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isValid && (
                    <div className="text-xs text-green-600 flex items-center">
                      <Check className="w-3 h-3 mr-1" />
                      Tâche prête
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t">
            {!editingTask && (
              <Button
                type="button"
                variant="outline"
                onClick={addNewTaskDraft}
                className="text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter une tâche
              </Button>
            )}

            <div className="space-x-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="text-sm"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleFinish}
                disabled={!allTasksValid || validTasksCount === 0}
                className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 mr-1" />
                {editingTask ? 'Sauvegarder' : `Terminer (${validTasksCount})`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
