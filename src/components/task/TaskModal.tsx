import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Check, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Task, TaskCategory, SubTaskCategory, TaskContext, RecurrenceInterval } from '@/types/task';
import { TaskType, getTaskTypeConfig } from '@/config/taskTypeConfig';
import { TaskDraft, isTaskDraftValid, getDefaultsForTaskType } from '@/utils/taskValidationByType';
import TaskDraftForm from './TaskDraftForm';
import type { TeamMemberOption } from '@/components/task/fields/AssignmentSelector';

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
  teamMembers?: TeamMemberOption[];
}

interface ScheduleInfo {
  date?: Date;
  time?: string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, onClose, onAddTask, onUpdateTask, 
  parentTask, editingTask, projectId, taskType = 'personal', teamMembers
}) => {
  const config = getTaskTypeConfig(taskType);
  const defaults = getDefaultsForTaskType(taskType);
  
  const createEmptyDraft = (): TaskDraft => ({
    name: '', category: parentTask ? parentTask.category : (defaults.category || ''),
    subCategory: defaults.subCategory || '',
    context: parentTask ? parentTask.context : (defaults.context || ''),
    estimatedTime: '', isRecurring: false, assignedTo: null
  });

  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([createEmptyDraft()]);
  const [schedulingError, setSchedulingError] = useState<string>('');
  const [existingTimeEvent, setExistingTimeEvent] = useState<TimeEvent | null>(null);
  
  const { checkConflicts } = useTimeHub();
  const { getEntityEvent } = useTimeEventSync();

  useEffect(() => {
    const loadExistingEvent = async () => {
      if (editingTask) {
        const event = await getEntityEvent('task', editingTask.id);
        setExistingTimeEvent(event);
        setTaskDrafts([{
          name: editingTask.name, category: editingTask.category,
          subCategory: editingTask.subCategory || '', context: editingTask.context,
          estimatedTime: editingTask.estimatedTime,
          scheduledDate: event?.startsAt, scheduledTime: event?.startsAt ? format(event.startsAt, 'HH:mm') : undefined,
          isRecurring: !!event?.recurrence,
          recurrenceInterval: event?.recurrence?.frequency as RecurrenceInterval,
          assignedTo: (editingTask as any).assigned_to || null
        }]);
      } else {
        setTaskDrafts([createEmptyDraft()]);
      }
    };
    if (isOpen) loadExistingEvent();
  }, [isOpen, editingTask, getEntityEvent, taskType]);

  const resetModal = () => { setTaskDrafts([createEmptyDraft()]); setSchedulingError(''); setExistingTimeEvent(null); };
  const handleClose = () => { resetModal(); onClose(); };

  const addNewTaskDraft = () => {
    if (!editingTask && config.showMultipleTasks) setTaskDrafts([...taskDrafts, createEmptyDraft()]);
  };

  const updateTaskDraft = (index: number, field: keyof TaskDraft, value: string | number | Date | boolean | undefined) => {
    const updated = [...taskDrafts];
    updated[index] = { ...updated[index], [field]: value };
    setTaskDrafts(updated);
    
    if ((field === 'scheduledDate' || field === 'scheduledTime') && updated[index].scheduledDate && updated[index].scheduledTime) {
      setSchedulingError('');
    } else if ((field === 'scheduledDate' || field === 'scheduledTime') && (updated[index].scheduledDate || updated[index].scheduledTime)) {
      if (!updated[index].scheduledDate || !updated[index].scheduledTime) setSchedulingError('Date + heure obligatoires pour la planification');
    }
  };

  const removeTaskDraft = (index: number) => {
    if (taskDrafts.length > 1 && !editingTask) setTaskDrafts(taskDrafts.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    const hasIncomplete = taskDrafts.some(d => (d.scheduledDate && !d.scheduledTime) || (!d.scheduledDate && d.scheduledTime));
    if (hasIncomplete) { setSchedulingError('Date + heure obligatoires pour la planification'); return; }

    const isSubTask = !!parentTask;
    const validTasks = taskDrafts.filter(d => isTaskDraftValid(d, taskType, isSubTask));
    
    if (editingTask && onUpdateTask) {
      const draft = validTasks[0];
      if (draft) {
        const updates: Partial<Task> & { _scheduleInfo?: ScheduleInfo; assigned_to?: string | null } = {
          name: draft.name.trim(), category: (draft.category || config.defaults.category || 'Quotidien') as TaskCategory,
          subCategory: draft.subCategory as SubTaskCategory || undefined,
          context: (draft.context || config.defaults.context || 'Pro') as TaskContext,
          estimatedTime: Number(draft.estimatedTime),
        };
        if (config.showAssignment && draft.assignedTo !== undefined) updates.assigned_to = draft.assignedTo;
        (updates as any)._scheduleInfo = { date: draft.scheduledDate, time: draft.scheduledTime, isRecurring: draft.isRecurring, recurrenceInterval: draft.recurrenceInterval };
        onUpdateTask(editingTask.id, updates);
      }
    } else if (onAddTask) {
      for (const draft of validTasks) {
        const level = parentTask ? Math.min((parentTask.level + 1), 2) as 0 | 1 | 2 : 0;
        const taskData: Omit<Task, 'id' | 'createdAt'> & { assigned_to?: string | null } = {
          name: draft.name.trim(),
          category: parentTask ? parentTask.category : (draft.category || config.defaults.category || 'Quotidien') as TaskCategory,
          subCategory: draft.subCategory ? draft.subCategory as SubTaskCategory : undefined,
          context: (draft.context || config.defaults.context || 'Pro') as TaskContext,
          estimatedTime: Number(draft.estimatedTime), parentId: parentTask?.id, level,
          isExpanded: true, isCompleted: false, projectId, projectStatus: projectId ? 'todo' : undefined,
        };
        if (config.showAssignment && draft.assignedTo) taskData.assigned_to = draft.assignedTo;
        (taskData as any)._scheduleInfo = { date: draft.scheduledDate, time: draft.scheduledTime, isRecurring: draft.isRecurring, recurrenceInterval: draft.recurrenceInterval };
        onAddTask(taskData);
      }
    }
    handleClose();
  };

  const isSubTask = !!parentTask;
  const allValid = taskDrafts.length > 0 && taskDrafts.every(d => isTaskDraftValid(d, taskType, isSubTask));
  const validCount = taskDrafts.filter(d => isTaskDraftValid(d, taskType, isSubTask)).length;
  const showLimitWarning = parentTask && taskDrafts.length > 3;
  const canSubmit = allValid && !schedulingError;
  const shouldUseGrid = taskDrafts.length >= 2 && !editingTask && config.showMultipleTasks;
  const gridCols = taskDrafts.length >= 4 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2';

  const getTitle = () => {
    if (editingTask) return `Modifier "${editingTask.name}"`;
    if (parentTask) return `Créer des sous-tâches pour "${parentTask.name}"`;
    return config.labels.title;
  };

  const getSubmitLabel = () => {
    if (editingTask) return 'Enregistrer les modifications';
    if (validCount > 1) return config.labels.submitMultipleButton(validCount);
    return config.labels.submitButton;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`w-full max-w-4xl max-h-[85vh] overflow-y-auto sm:max-w-md md:max-w-2xl lg:max-w-4xl ${shouldUseGrid ? 'lg:min-w-[800px]' : ''}`}>
        <DialogHeader><DialogTitle>{getTitle()}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          {showLimitWarning && (
            <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Vous avez dépassé la limite recommandée de 3 sous-tâches.</AlertDescription></Alert>
          )}
          {schedulingError && (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{schedulingError}</AlertDescription></Alert>
          )}

          <div className={shouldUseGrid ? `grid ${gridCols} gap-3 md:gap-4` : 'space-y-3 md:space-y-4'}>
            {taskDrafts.map((draft, index) => (
              <TaskDraftForm
                key={index}
                draft={draft}
                index={index}
                taskType={taskType}
                isSubTask={isSubTask}
                isEditing={!!editingTask}
                canRemove={taskDrafts.length > 1 && !editingTask}
                parentTask={parentTask}
                teamMembers={teamMembers}
                onUpdate={updateTaskDraft}
                onRemove={removeTaskDraft}
              />
            ))}
          </div>

          {!editingTask && config.showMultipleTasks && (
            <Button type="button" variant="outline" onClick={addNewTaskDraft} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" />Ajouter une autre tâche
            </Button>
          )}

          <Button type="button" onClick={handleFinish} disabled={!canSubmit} className="w-full">
            <Check className="w-4 h-4 mr-2" />{getSubmitLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
