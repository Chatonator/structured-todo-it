import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Task, TaskCategory, SubTaskCategory, TaskContext, RecurrenceInterval } from '@/types/task';
import { TaskType, getTaskTypeConfig } from '@/config/taskTypeConfig';
import { TaskDraft, isTaskDraftValid, getDefaultsForTaskType } from '@/utils/taskValidationByType';
import { canAddSubTask } from '@/utils/taskValidation';
import { MAX_CHILDREN_PER_TASK } from '@/lib/rewards/constants';
import TaskDraftForm from './TaskDraftForm';
import type { TeamMemberOption } from '@/components/task/fields/AssignmentSelector';
import { useToast } from '@/hooks/use-toast';

import { format } from 'date-fns';
import { useTimeHub } from '@/hooks/useTimeHub';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';
import { TimeEvent } from '@/lib/time/types';
import { supabase } from '@/integrations/supabase/client';

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
  defaultContext?: TaskContext;
}

interface ScheduleInfo {
  date?: Date;
  time?: string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, onClose, onAddTask, onUpdateTask, 
  parentTask, editingTask, projectId, taskType = 'personal', teamMembers, defaultContext
}) => {
  const config = getTaskTypeConfig(taskType);
  const defaults = getDefaultsForTaskType(taskType);
  
  const createEmptyDraft = (): TaskDraft => ({
    name: '', category: parentTask ? parentTask.category : (defaults.category || ''),
    subCategory: parentTask?.subCategory || defaults.subCategory || '',
    context: parentTask ? parentTask.context : (defaultContext || defaults.context || ''),
    estimatedTime: '', isRecurring: false, assignedTo: null
  });

  const [draft, setDraft] = useState<TaskDraft>(createEmptyDraft());
  const [schedulingError, setSchedulingError] = useState<string>('');
  const [existingTimeEvent, setExistingTimeEvent] = useState<TimeEvent | null>(null);
  const [existingSiblingCount, setExistingSiblingCount] = useState<number>(0);
  const [createdCount, setCreatedCount] = useState(0);
  
  const { checkConflicts } = useTimeHub();
  const { getEntityEvent } = useTimeEventSync();
  const { toast } = useToast();
  const [structuralError, setStructuralError] = useState<string>('');

  useEffect(() => {
    const loadOnOpen = async () => {
      if (parentTask && !editingTask) {
        const { data: siblingData } = await supabase
          .from('items')
          .select('id')
          .eq('parent_id', parentTask.id);
        setExistingSiblingCount(siblingData?.length ?? 0);
      } else {
        setExistingSiblingCount(0);
      }

      if (editingTask) {
        const event = await getEntityEvent('task', editingTask.id);
        setExistingTimeEvent(event);
        setDraft({
          name: editingTask.name, category: editingTask.category,
          subCategory: editingTask.subCategory || '', context: editingTask.context,
          estimatedTime: editingTask.estimatedTime,
          scheduledDate: event?.startsAt, scheduledTime: event?.startsAt ? format(event.startsAt, 'HH:mm') : undefined,
          isRecurring: !!event?.recurrence,
          recurrenceInterval: event?.recurrence?.frequency as RecurrenceInterval,
          assignedTo: (editingTask as any).assigned_to || null
        });
      } else {
        setDraft(createEmptyDraft());
      }
      setCreatedCount(0);
    };
    if (isOpen) loadOnOpen();
  }, [isOpen, editingTask, getEntityEvent, taskType, parentTask]);

  const resetForm = () => { setDraft(createEmptyDraft()); setSchedulingError(''); setStructuralError(''); };
  const handleClose = () => { resetForm(); setExistingTimeEvent(null); setExistingSiblingCount(0); setCreatedCount(0); onClose(); };

  const updateDraft = (index: number, field: keyof TaskDraft, value: string | number | Date | boolean | undefined) => {
    setDraft(prev => {
      const updated = { ...prev, [field]: value };
      if ((field === 'scheduledDate' || field === 'scheduledTime') && updated.scheduledDate && updated.scheduledTime) {
        setSchedulingError('');
      } else if ((field === 'scheduledDate' || field === 'scheduledTime') && (updated.scheduledDate || updated.scheduledTime)) {
        if (!updated.scheduledDate || !updated.scheduledTime) setSchedulingError('Date + heure obligatoires');
      }
      return updated;
    });
  };

  const buildTaskData = (d: TaskDraft): (Omit<Task, 'id' | 'createdAt'> & { assigned_to?: string | null }) | null => {
    const isSubTask = !!parentTask;
    if (!isTaskDraftValid(d, taskType, isSubTask)) return null;
    
    const level = parentTask ? Math.min((parentTask.level + 1), 2) as 0 | 1 | 2 : 0;
    const taskData: Omit<Task, 'id' | 'createdAt'> & { assigned_to?: string | null } = {
      name: d.name.trim(),
      category: parentTask ? parentTask.category : (d.category || config.defaults.category || 'low_priority') as TaskCategory,
      subCategory: d.subCategory ? d.subCategory as SubTaskCategory : undefined,
      context: parentTask ? parentTask.context as TaskContext : (d.context || config.defaults.context || 'Pro') as TaskContext,
      estimatedTime: Number(d.estimatedTime), parentId: parentTask?.id, level,
      isExpanded: true, isCompleted: false, projectId, projectStatus: projectId ? 'todo' : undefined,
    };
    if (config.showAssignment && d.assignedTo) taskData.assigned_to = d.assignedTo;
    (taskData as any)._scheduleInfo = { date: d.scheduledDate, time: d.scheduledTime, isRecurring: d.isRecurring, recurrenceInterval: d.recurrenceInterval };
    return taskData;
  };

  const handleSubmit = async () => {
    if ((draft.scheduledDate && !draft.scheduledTime) || (!draft.scheduledDate && draft.scheduledTime)) {
      setSchedulingError('Date + heure obligatoires'); return;
    }

    if (parentTask && !editingTask) {
      const { data: siblingData } = await supabase
        .from('items').select('id').eq('parent_id', parentTask.id);
      const siblingCount = siblingData?.length ?? 0;
      const check = canAddSubTask(parentTask.level, siblingCount);
      if (!check.allowed) {
        setStructuralError(check.reason || 'Limite structurelle atteinte');
        toast({ title: 'Limite atteinte', description: check.reason, variant: 'destructive', duration: 3000 });
        return;
      }
    }

    if (editingTask && onUpdateTask) {
      const isSubTask = !!parentTask;
      if (isTaskDraftValid(draft, taskType, isSubTask)) {
        const updates: Partial<Task> & { _scheduleInfo?: ScheduleInfo; assigned_to?: string | null } = {
          name: draft.name.trim(), category: (draft.category || config.defaults.category || 'low_priority') as TaskCategory,
          subCategory: draft.subCategory as SubTaskCategory || undefined,
          context: parentTask ? parentTask.context as TaskContext : (draft.context || config.defaults.context || 'Pro') as TaskContext,
          estimatedTime: Number(draft.estimatedTime),
          projectStatus: editingTask.projectStatus,
        };
        if (config.showAssignment && draft.assignedTo !== undefined) updates.assigned_to = draft.assignedTo;
        (updates as any)._scheduleInfo = { date: draft.scheduledDate, time: draft.scheduledTime, isRecurring: draft.isRecurring, recurrenceInterval: draft.recurrenceInterval };
        onUpdateTask(editingTask.id, updates);
      }
      handleClose();
    } else if (onAddTask) {
      const taskData = buildTaskData(draft);
      if (taskData) {
        onAddTask(taskData);
        setCreatedCount(prev => prev + 1);
        resetForm();
        // Stay open for multi-creation
      }
    }
  };

  const handleSubmitAndClose = async () => {
    if (editingTask) {
      await handleSubmit();
      return;
    }
    // For creation: submit then close
    if ((draft.scheduledDate && !draft.scheduledTime) || (!draft.scheduledDate && draft.scheduledTime)) {
      setSchedulingError('Date + heure obligatoires'); return;
    }
    if (onAddTask) {
      const taskData = buildTaskData(draft);
      if (taskData) {
        onAddTask(taskData);
      }
    }
    handleClose();
  };

  const isSubTask = !!parentTask;
  const isValid = isTaskDraftValid(draft, taskType, isSubTask);
  const remainingSlots = parentTask ? Math.max(0, MAX_CHILDREN_PER_TASK - existingSiblingCount) : Infinity;
  const showLimitInfo = parentTask && !editingTask && remainingSlots < Infinity;

  const getTitle = () => {
    if (editingTask) return `Modifier "${editingTask.name}"`;
    if (parentTask) return `Sous-tâche de "${parentTask.name}"`;
    return config.labels.title;
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-base font-semibold">{getTitle()}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {showLimitInfo && (
              <Alert className="py-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">
                  {existingSiblingCount > 0
                    ? `${existingSiblingCount} sous-tâche(s) — ${remainingSlots} place(s) restante(s)`
                    : `Max ${MAX_CHILDREN_PER_TASK} sous-tâches`}
                </AlertDescription>
              </Alert>
            )}
            {structuralError && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{structuralError}</AlertDescription>
              </Alert>
            )}
            {schedulingError && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs">{schedulingError}</AlertDescription>
              </Alert>
            )}

            {createdCount > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 rounded-lg px-3 py-2">
                <Sparkles className="w-3.5 h-3.5" />
                {createdCount} tâche{createdCount > 1 ? 's' : ''} créée{createdCount > 1 ? 's' : ''}
              </div>
            )}

            <TaskDraftForm
              draft={draft}
              index={0}
              taskType={taskType}
              isSubTask={isSubTask}
              isEditing={!!editingTask}
              canRemove={false}
              parentTask={parentTask}
              teamMembers={teamMembers}
              onUpdate={updateDraft}
              onRemove={() => {}}
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border p-4 space-y-2 bg-background">
          {editingTask ? (
            <Button onClick={handleSubmitAndClose} disabled={!isValid || !!schedulingError} className="w-full">
              <Check className="w-4 h-4 mr-2" />Enregistrer
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSubmit} disabled={!isValid || !!schedulingError} className="flex-1">
                <Sparkles className="w-4 h-4 mr-2" />Créer & continuer
              </Button>
              <Button onClick={handleSubmitAndClose} disabled={!isValid || !!schedulingError} className="flex-1">
                <Check className="w-4 h-4 mr-2" />Créer
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskModal;
