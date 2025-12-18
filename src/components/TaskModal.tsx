import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Check, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Task, TaskCategory, SubTaskCategory, TaskContext, RecurrenceInterval } from '@/types/task';
import { TaskType, getTaskTypeConfig } from '@/config/taskTypeConfig';
import { isTaskDraftValid, getDefaultsForTaskType } from '@/utils/taskValidationByType';
import {
  NameField,
  ContextSelector,
  CategorySelector,
  PrioritySelector,
  TimeEstimateSelector,
  SchedulingSection,
  RecurrenceSection
} from '@/components/task-modal/fields';

import { format } from 'date-fns';
import { useTimeHub } from '@/hooks/useTimeHub';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';
import { TimeEvent } from '@/lib/time/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  parentTask?: Task;
  editingTask?: Task;
  projectId?: string;
  taskType?: TaskType;
}

interface TaskDraft {
  name: string;
  category: TaskCategory | '';
  subCategory: SubTaskCategory | '';
  context: TaskContext | '';
  estimatedTime: number | '';
  scheduledDate?: Date;
  scheduledTime?: string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
}

interface ScheduleInfo {
  date?: Date;
  time?: string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddTask, 
  onUpdateTask, 
  parentTask, 
  editingTask,
  projectId,
  taskType = 'personal'
}) => {
  const config = getTaskTypeConfig(taskType);
  const defaults = getDefaultsForTaskType(taskType);
  
  const createEmptyDraft = (): TaskDraft => ({
    name: '',
    category: defaults.category || '',
    subCategory: defaults.subCategory || '',
    context: defaults.context || '',
    estimatedTime: '',
    isRecurring: false
  });

  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([createEmptyDraft()]);
  const [schedulingError, setSchedulingError] = useState<string>('');
  const [existingTimeEvent, setExistingTimeEvent] = useState<TimeEvent | null>(null);
  
  const { checkConflicts } = useTimeHub();
  const { getEntityEvent } = useTimeEventSync();

  // Charger les données du time_event existant pour l'édition
  useEffect(() => {
    const loadExistingEvent = async () => {
      if (editingTask) {
        const event = await getEntityEvent('task', editingTask.id);
        setExistingTimeEvent(event);
        
        setTaskDrafts([{
          name: editingTask.name,
          category: editingTask.category,
          subCategory: editingTask.subCategory || '',
          context: editingTask.context,
          estimatedTime: editingTask.estimatedTime,
          scheduledDate: event?.startsAt,
          scheduledTime: event?.startsAt ? format(event.startsAt, 'HH:mm') : undefined,
          isRecurring: !!event?.recurrence,
          recurrenceInterval: event?.recurrence?.frequency as RecurrenceInterval
        }]);
      } else {
        setTaskDrafts([createEmptyDraft()]);
      }
    };

    if (isOpen) {
      loadExistingEvent();
    }
  }, [isOpen, editingTask, getEntityEvent, taskType]);

  const resetModal = () => {
    setTaskDrafts([createEmptyDraft()]);
    setSchedulingError('');
    setExistingTimeEvent(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const addNewTaskDraft = () => {
    if (!editingTask && config.showMultipleTasks) {
      setTaskDrafts([...taskDrafts, createEmptyDraft()]);
    }
  };

  const updateTaskDraft = (index: number, field: keyof TaskDraft, value: string | number | Date | boolean | undefined) => {
    const updated = [...taskDrafts];
    updated[index] = { ...updated[index], [field]: value };
    setTaskDrafts(updated);
    
    if ((field === 'scheduledDate' || field === 'scheduledTime') && updated[index].scheduledDate && updated[index].scheduledTime) {
      setSchedulingError('');
    } else if ((field === 'scheduledDate' || field === 'scheduledTime') && (updated[index].scheduledDate || updated[index].scheduledTime)) {
      if (!updated[index].scheduledDate || !updated[index].scheduledTime) {
        setSchedulingError('Date + heure obligatoires pour la planification');
      }
    }
  };

  const removeTaskDraft = (index: number) => {
    if (taskDrafts.length > 1 && !editingTask) {
      setTaskDrafts(taskDrafts.filter((_, i) => i !== index));
    }
  };

  const handleFinish = async () => {
    const hasIncompleteScheduling = taskDrafts.some(draft => 
      (draft.scheduledDate && !draft.scheduledTime) || (!draft.scheduledDate && draft.scheduledTime)
    );
    
    if (hasIncompleteScheduling) {
      setSchedulingError('Date + heure obligatoires pour la planification');
      return;
    }

    const isSubTask = !!parentTask;
    const validTasks = taskDrafts.filter(draft => isTaskDraftValid(draft, taskType, isSubTask));
    
    if (editingTask && onUpdateTask) {
      const draft = validTasks[0];
      if (draft) {
        const updates: Partial<Task> & { _scheduleInfo?: ScheduleInfo } = {
          name: draft.name.trim(),
          category: (draft.category || config.defaults.category || 'Quotidien') as TaskCategory,
          subCategory: draft.subCategory as SubTaskCategory || undefined,
          context: (draft.context || config.defaults.context || 'Pro') as TaskContext,
          estimatedTime: Number(draft.estimatedTime),
        };
        
        (updates as any)._scheduleInfo = {
          date: draft.scheduledDate,
          time: draft.scheduledTime,
          isRecurring: draft.isRecurring,
          recurrenceInterval: draft.recurrenceInterval
        } as ScheduleInfo;
        
        onUpdateTask(editingTask.id, updates);
      }
    } else if (onAddTask) {
      for (const draft of validTasks) {
        const level = parentTask ? Math.min((parentTask.level + 1), 2) as 0 | 1 | 2 : 0;
        
        const taskData: Omit<Task, 'id' | 'createdAt'> = {
          name: draft.name.trim(),
          category: parentTask 
            ? parentTask.category 
            : (draft.category || config.defaults.category || 'Quotidien') as TaskCategory,
          subCategory: parentTask ? draft.subCategory as SubTaskCategory : undefined,
          context: (draft.context || config.defaults.context || 'Pro') as TaskContext,
          estimatedTime: Number(draft.estimatedTime),
          parentId: parentTask?.id,
          level,
          isExpanded: true,
          isCompleted: false,
          projectId: projectId,
          projectStatus: projectId ? 'todo' : undefined,
        };
        
        (taskData as any)._scheduleInfo = {
          date: draft.scheduledDate,
          time: draft.scheduledTime,
          isRecurring: draft.isRecurring,
          recurrenceInterval: draft.recurrenceInterval
        } as ScheduleInfo;
        
        onAddTask(taskData);
      }
    }

    handleClose();
  };

  const isSubTask = !!parentTask;
  const allTasksValid = taskDrafts.length > 0 && taskDrafts.every(draft => isTaskDraftValid(draft, taskType, isSubTask));
  const validTasksCount = taskDrafts.filter(draft => isTaskDraftValid(draft, taskType, isSubTask)).length;
  const showLimitWarning = parentTask && taskDrafts.length > 3;
  const canSubmit = allTasksValid && !schedulingError;

  const shouldUseGrid = taskDrafts.length >= 2 && !editingTask && config.showMultipleTasks;
  const gridCols = taskDrafts.length >= 4 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2';

  // Titre dynamique
  const getTitle = () => {
    if (editingTask) {
      return `Modifier "${editingTask.name}"`;
    }
    if (parentTask) {
      return `Créer des sous-tâches pour "${parentTask.name}"`;
    }
    return config.labels.title;
  };

  // Bouton de validation dynamique
  const getSubmitLabel = () => {
    if (editingTask) {
      return 'Enregistrer les modifications';
    }
    if (validTasksCount > 1) {
      return config.labels.submitMultipleButton(validTasksCount);
    }
    return config.labels.submitButton;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`
        w-full max-w-4xl max-h-[85vh] overflow-y-auto
        sm:max-w-md md:max-w-2xl lg:max-w-4xl
        ${shouldUseGrid ? 'lg:min-w-[800px]' : ''}
      `}>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
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
              <AlertDescription>{schedulingError}</AlertDescription>
            </Alert>
          )}

          <div className={shouldUseGrid ? `grid ${gridCols} gap-3 md:gap-4` : 'space-y-3 md:space-y-4'}>
            {taskDrafts.map((draft, index) => {
              const isValid = isTaskDraftValid(draft, taskType, isSubTask);
              
              return (
                <div 
                  key={index} 
                  className={`p-3 md:p-4 border rounded-lg space-y-3 md:space-y-4 ${
                    !isValid ? 'border-destructive bg-destructive/10' : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {editingTask ? config.labels.editTitle : `Tâche ${index + 1}`}
                    </span>
                    {taskDrafts.length > 1 && !editingTask && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTaskDraft(index)}
                        className="h-6 w-6 p-0 text-destructive"
                      >
                        ×
                      </Button>
                    )}
                  </div>

                  {/* Nom de la tâche */}
                  <NameField
                    value={draft.name}
                    onChange={(value) => updateTaskDraft(index, 'name', value)}
                    hasError={!draft.name.trim()}
                  />

                  {/* Contexte Pro/Perso - conditionnel */}
                  {config.showContextSelector && (
                    <ContextSelector
                      value={draft.context}
                      onChange={(value) => updateTaskDraft(index, 'context', value)}
                      hasError={!draft.context}
                      required={config.requiredFields.includes('context')}
                    />
                  )}

                  {/* Catégories ou Priorité selon le contexte */}
                  {parentTask ? (
                    // Sous-tâche : toujours montrer le sélecteur de priorité (requis)
                    <PrioritySelector
                      value={draft.subCategory}
                      onChange={(value) => updateTaskDraft(index, 'subCategory', value)}
                      hasError={!draft.subCategory}
                    />
                  ) : config.showCategorySelector ? (
                    // Tâche principale avec catégories (personnel)
                    <CategorySelector
                      value={draft.category}
                      onChange={(value) => updateTaskDraft(index, 'category', value)}
                    />
                  ) : config.showPrioritySelector ? (
                    // Projet/équipe : montrer priorité au lieu de catégories
                    <PrioritySelector
                      value={draft.subCategory}
                      onChange={(value) => updateTaskDraft(index, 'subCategory', value)}
                      label="Priorité"
                    />
                  ) : null}

                  {/* Temps estimé */}
                  <TimeEstimateSelector
                    value={draft.estimatedTime}
                    onChange={(value) => updateTaskDraft(index, 'estimatedTime', value)}
                    hasError={!draft.estimatedTime}
                  />

                  {/* Planification - conditionnel */}
                  {config.showScheduling && (
                    <SchedulingSection
                      scheduledDate={draft.scheduledDate}
                      scheduledTime={draft.scheduledTime}
                      onDateChange={(date) => updateTaskDraft(index, 'scheduledDate', date)}
                      onTimeChange={(time) => updateTaskDraft(index, 'scheduledTime', time)}
                    />
                  )}

                  {/* Récurrence - conditionnel */}
                  {config.showRecurrence && (
                    <RecurrenceSection
                      isRecurring={draft.isRecurring || false}
                      recurrenceInterval={draft.recurrenceInterval}
                      onRecurringChange={(value) => updateTaskDraft(index, 'isRecurring', value)}
                      onIntervalChange={(value) => updateTaskDraft(index, 'recurrenceInterval', value)}
                      index={index}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bouton pour ajouter une autre tâche */}
          {!editingTask && config.showMultipleTasks && (
            <Button
              type="button"
              variant="outline"
              onClick={addNewTaskDraft}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une autre tâche
            </Button>
          )}

          {/* Bouton de validation */}
          <Button
            type="button"
            onClick={handleFinish}
            disabled={!canSubmit}
            className="w-full"
          >
            <Check className="w-4 h-4 mr-2" />
            {getSubmitLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
