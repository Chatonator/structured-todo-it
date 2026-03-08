import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { TeamMemberOption } from '@/components/task/fields/AssignmentSelector';
import type { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { Clock, CalendarDays, RefreshCw, Settings2, Users, Timer } from 'lucide-react';

// Time chips for quick selection
const TIME_CHIPS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
];

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
          placeholder={isEditing ? 'Nom de la tâche...' : 'Que dois-tu faire ?'}
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
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Contexte</Label>
          <div className="flex gap-2">
            {(['Pro', 'Perso'] as const).map((ctx) => {
              const isSelected = draft.context === ctx;
              const isPro = ctx === 'Pro';
              return (
                <button
                  key={ctx}
                  type="button"
                  onClick={() => onUpdate(index, 'context', ctx)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                    isSelected
                      ? isPro
                        ? 'bg-context-pro/15 border-context-pro text-context-pro shadow-sm'
                        : 'bg-context-perso/15 border-context-perso text-context-perso shadow-sm'
                      : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <span>{isPro ? '💼' : '🏠'}</span>
                  <span>{ctx}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ─── Eisenhower / Priority ─── */}
      {parentTask ? (
        <PrioritySelector value={draft.subCategory} onChange={(v) => onUpdate(index, 'subCategory', v)} hasError={!draft.subCategory} />
      ) : config.showCategorySelector ? (
        <EisenhowerSelector value={draft.category as any} onChange={(v) => onUpdate(index, 'category', v)} />
      ) : config.showPrioritySelector ? (
        <PrioritySelector value={draft.subCategory} onChange={(v) => onUpdate(index, 'subCategory', v)} label="Priorité" />
      ) : null}

      {/* ─── Time estimate chips ─── */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          Durée estimée
        </Label>
        <div className="flex gap-1.5 flex-wrap">
          {TIME_CHIPS.map((chip) => {
            const isSelected = Number(draft.estimatedTime) === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => onUpdate(index, 'estimatedTime', chip.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        {!draft.estimatedTime && (
          <p className="text-[10px] text-destructive">Requis</p>
        )}
      </div>

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
