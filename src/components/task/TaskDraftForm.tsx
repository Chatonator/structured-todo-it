import React from 'react';
import { Button } from '@/components/ui/button';
import { TaskCategory, SubTaskCategory, TaskContext, RecurrenceInterval } from '@/types/task';
import { TaskType, getTaskTypeConfig } from '@/config/taskTypeConfig';
import { TaskDraft, isTaskDraftValid } from '@/utils/taskValidationByType';
import {
  NameField,
  ContextSelector,
  CategorySelector,
  PrioritySelector,
  TimeEstimateSelector,
  SchedulingSection,
  RecurrenceSection,
  AssignmentSelector
} from '@/components/task/fields';
import type { TeamMemberOption } from '@/components/task/fields/AssignmentSelector';
import type { Task } from '@/types/task';

interface TaskDraftFormProps {
  draft: TaskDraft;
  index: number;
  taskType: TaskType;
  isSubTask: boolean;
  isEditing: boolean;
  canRemove: boolean;
  parentTask?: Task;
  teamMembers?: TeamMemberOption[];
  onUpdate: (index: number, field: keyof TaskDraft, value: string | number | Date | boolean | undefined) => void;
  onRemove: (index: number) => void;
}

const TaskDraftForm: React.FC<TaskDraftFormProps> = ({
  draft, index, taskType, isSubTask, isEditing, canRemove,
  parentTask, teamMembers, onUpdate, onRemove,
}) => {
  const config = getTaskTypeConfig(taskType);
  const isValid = isTaskDraftValid(draft, taskType, isSubTask);

  return (
    <div className={`p-3 md:p-4 border rounded-lg space-y-3 md:space-y-4 ${
      !isValid ? 'border-destructive bg-destructive/10' : 'bg-card border-border'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {isEditing ? config.labels.editTitle : `Tâche ${index + 1}`}
        </span>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} className="h-6 w-6 p-0 text-destructive">
            ×
          </Button>
        )}
      </div>

      <NameField value={draft.name} onChange={(v) => onUpdate(index, 'name', v)} hasError={!draft.name.trim()} />

      {config.showContextSelector && (
        <ContextSelector
          value={draft.context}
          onChange={(v) => onUpdate(index, 'context', v)}
          hasError={!draft.context}
          required={config.requiredFields.includes('context')}
        />
      )}

      {parentTask ? (
        <PrioritySelector value={draft.subCategory} onChange={(v) => onUpdate(index, 'subCategory', v)} hasError={!draft.subCategory} />
      ) : config.showCategorySelector ? (
        <CategorySelector value={draft.category} onChange={(v) => onUpdate(index, 'category', v)} />
      ) : config.showPrioritySelector ? (
        <PrioritySelector value={draft.subCategory} onChange={(v) => onUpdate(index, 'subCategory', v)} label="Priorité" />
      ) : null}

      {config.showAssignment && teamMembers && teamMembers.length > 0 && (
        <AssignmentSelector value={draft.assignedTo || null} onChange={(userId) => onUpdate(index, 'assignedTo', userId)} members={teamMembers} />
      )}

      <TimeEstimateSelector value={draft.estimatedTime} onChange={(v) => onUpdate(index, 'estimatedTime', v)} hasError={!draft.estimatedTime} />

      {config.showScheduling && (
        <SchedulingSection
          scheduledDate={draft.scheduledDate}
          scheduledTime={draft.scheduledTime}
          onDateChange={(d) => onUpdate(index, 'scheduledDate', d)}
          onTimeChange={(t) => onUpdate(index, 'scheduledTime', t)}
        />
      )}

      {config.showRecurrence && (
        <RecurrenceSection
          isRecurring={draft.isRecurring || false}
          recurrenceInterval={draft.recurrenceInterval as RecurrenceInterval | undefined}
          onRecurringChange={(v) => onUpdate(index, 'isRecurring', v)}
          onIntervalChange={(v) => onUpdate(index, 'recurrenceInterval', v)}
          index={index}
        />
      )}
    </div>
  );
};

export default TaskDraftForm;
