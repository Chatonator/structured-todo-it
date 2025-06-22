
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Task, TaskCategory, SubTaskCategory, TaskContext, TIME_OPTIONS, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG } from '@/types/task';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  parentTask?: Task;
}

interface TaskDraft {
  name: string;
  category: TaskCategory | '';
  subCategory: SubTaskCategory | '';
  context: TaskContext | '';
  estimatedTime: number | '';
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onAddTask, parentTask }) => {
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([
    { name: '', category: '', subCategory: '', context: '', estimatedTime: '' }
  ]);

  const resetModal = () => {
    setTaskDrafts([{ name: '', category: '', subCategory: '', context: '', estimatedTime: '' }]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const addNewTaskDraft = () => {
    setTaskDrafts([...taskDrafts, { name: '', category: '', subCategory: '', context: '', estimatedTime: '' }]);
  };

  const updateTaskDraft = (index: number, field: keyof TaskDraft, value: string | number) => {
    const updated = [...taskDrafts];
    updated[index] = { ...updated[index], [field]: value };
    setTaskDrafts(updated);
  };

  const removeTaskDraft = (index: number) => {
    if (taskDrafts.length > 1) {
      setTaskDrafts(taskDrafts.filter((_, i) => i !== index));
    }
  };

  const handleFinish = () => {
    const validTasks = taskDrafts.filter(draft => isTaskValid(draft));

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
        isCompleted: false
      });
    });

    handleClose();
  };

  const isTaskValid = (task: TaskDraft): boolean => {
    const hasName = task.name.trim().length > 0;
    const hasEstimatedTime = task.estimatedTime !== '' && Number(task.estimatedTime) > 0;
    const hasContext = task.context !== '';
    
    if (parentTask) {
      const hasSubCategory = task.subCategory !== '';
      return hasName && hasSubCategory && hasEstimatedTime && hasContext;
    } else {
      const hasCategory = task.category !== '';
      return hasName && hasCategory && hasEstimatedTime && hasContext;
    }
  };

  const allTasksValid = taskDrafts.length > 0 && taskDrafts.every(draft => isTaskValid(draft));
  const validTasksCount = taskDrafts.filter(draft => isTaskValid(draft)).length;
  const showLimitWarning = parentTask && taskDrafts.length > 3;

  // Calculer les colonnes selon le nombre de tâches
  const shouldUseGrid = taskDrafts.length >= 2;
  const gridCols = taskDrafts.length >= 4 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2';

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {}} // Empêcher la fermeture involontaire
    >
      <DialogContent className={`max-w-4xl max-h-[85vh] overflow-y-auto ${shouldUseGrid ? 'min-w-[800px]' : 'max-w-md'}`}>
        <DialogHeader>
          <DialogTitle>
            {parentTask 
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

          <div className={shouldUseGrid ? `grid ${gridCols} gap-4` : 'space-y-4'}>
            {taskDrafts.map((draft, index) => {
              const isValid = isTaskValid(draft);
              
              return (
                <div key={index} className={`p-4 border rounded-lg space-y-4 ${!isValid ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Tâche {index + 1}
                    </span>
                    {taskDrafts.length > 1 && (
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
                      {Object.entries(CONTEXT_CONFIG).map(([context, config]) => (
                        <button
                          key={context}
                          type="button"
                          onClick={() => updateTaskDraft(index, 'context', context)}
                          className={`
                            flex items-center justify-center space-x-2 p-3 text-sm border rounded transition-all
                            ${draft.context === context 
                              ? `${config.color} border-current shadow-sm` 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                            }
                            ${!draft.context ? 'border-red-300' : ''}
                          `}
                        >
                          <span className="font-medium">{config.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">
                      {parentTask ? 'Priorité' : 'Catégorie'}
                    </Label>
                    <div className="grid grid-cols-2 gap-1">
                      {parentTask ? (
                        Object.entries(SUB_CATEGORY_CONFIG).map(([subCat, config]) => (
                          <button
                            key={subCat}
                            type="button"
                            onClick={() => updateTaskDraft(index, 'subCategory', subCat)}
                            className={`
                              flex items-center space-x-1 p-2 text-xs border rounded transition-all
                              ${draft.subCategory === subCat 
                                ? `${config.color} border-current` 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                              }
                            `}
                          >
                            <span className="font-medium truncate">{subCat}</span>
                          </button>
                        ))
                      ) : (
                        Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => updateTaskDraft(index, 'category', cat)}
                            className={`
                              flex items-center space-x-1 p-2 text-xs border rounded transition-all
                              ${draft.category === cat 
                                ? `${config.color} border-current` 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: config.cssColor }}
                            />
                            <span className="font-medium truncate">{cat}</span>
                          </button>
                        ))
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
            <Button
              type="button"
              variant="outline"
              onClick={addNewTaskDraft}
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une tâche
            </Button>

            <div className="space-x-2">
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
                Terminer ({validTasksCount})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
