import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TaskCategory, SubTaskCategory, TaskContext, RecurrenceInterval } from '@/types/task';
import { TaskType, getTaskTypeConfig } from '@/config/taskTypeConfig';
import { TaskDraft, isTaskDraftValid } from '@/utils/taskValidationByType';
import {
  PrioritySelector,
  SchedulingSection,
  RecurrenceSection,
  AssignmentSelector
} from '@/components/task/fields';
import { EisenhowerSelector } from '@/components/common/EisenhowerSelector';
import { ContextPillSelector } from '@/components/common/ContextPillSelector';
import type { TeamMemberOption } from '@/components/task/fields/AssignmentSelector';
import type { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { Settings2 } from 'lucide-react';
import DurationPicker from '@/components/task/fields/DurationPicker';

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

  return (
    <div className="space-y-5">
      {/* ─── Name ─── */}
      <div>
        <Input
          type="text"
          value={draft.name}
          onChange={(e) => onUpdate(index, 'name', e.target.value)}
          placeholder="Titre *"
          autoFocus
          className={cn(
            'text-base h-11 font-medium placeholder:text-muted-foreground/60 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors',
            !draft.name.trim() && 'border-destructive'
          )}
        />
      </div>

      {/* ─── Context pills ─── */}
      {parentTask ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Contexte hérité</span>
          <Badge variant="outline" className="text-xs bg-accent/50">
            {draft.context || parentTask.context}
          </Badge>
        </div>
      ) : config.showContextSelector ? (
        <ContextPillSelector
          value={draft.context}
          onChange={(ctx) => onUpdate(index, 'context', ctx)}
        />
      ) : null}

      {/* ─── Eisenhower / Priority ─── */}
      {parentTask ? (
        <PrioritySelector value={draft.subCategory} onChange={(v) => onUpdate(index, 'subCategory', v)} hasError={!draft.subCategory} />
      ) : config.showCategorySelector ? (
        <EisenhowerSelector value={draft.category as any} onChange={(v) => onUpdate(index, 'category', v)} />
      ) : config.showPrioritySelector ? (
        <PrioritySelector value={draft.subCategory} onChange={(v) => onUpdate(index, 'subCategory', v)} label="Priorité" />
      ) : null}

      {/* ─── Duration picker ─── */}
      <DurationPicker
        value={draft.estimatedTime}
        onChange={(v) => onUpdate(index, 'estimatedTime', v)}
        hasError={!draft.estimatedTime}
      />

      {/* ─── Assignment (teams) ─── */}
      {config.showAssignment && teamMembers && teamMembers.length > 0 && (
        <AssignmentSelector value={draft.assignedTo || null} onChange={(userId) => onUpdate(index, 'assignedTo', userId)} members={teamMembers} />
      )}

      {/* ─── Advanced options (collapsible) ─── */}
      {!parentTask && (config.showScheduling || config.showRecurrence) && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-2 group">
            <Settings2 className="w-3.5 h-3.5" />
            <span>Options avancées</span>
            <div className="flex-1 h-px bg-border group-hover:bg-muted-foreground/30 transition-colors" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
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
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default TaskDraftForm;
