import React, { useState } from 'react';
import { Clock, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';
import TaskItem from '@/components/task/TaskItem';

interface SidebarTasksSectionProps {
  tasks: Task[];
  pinnedTasks: string[];
  selectedTasks: string[];
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  canHaveSubTasks: (task: Task) => boolean;
  onToggleSelection: (taskId: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onCreateSubTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onAssignToProject: (taskId: string, projectId: string) => Promise<boolean>;
  allTasks: Task[]; // Pour le reorder global
}

/**
 * Section affichant la liste des tâches avec header et toggle vue étendue
 */
const SidebarTasksSection: React.FC<SidebarTasksSectionProps> = ({
  tasks,
  pinnedTasks,
  selectedTasks,
  getSubTasks,
  calculateTotalTime,
  canHaveSubTasks,
  onToggleSelection,
  onToggleExpansion,
  onToggleCompletion,
  onTogglePinTask,
  onRemoveTask,
  onCreateSubTask,
  onEditTask,
  onAssignToProject,
  allTasks
}) => {
  const [isExtendedView, setIsExtendedView] = useState(false);

  // Tri avec épinglées en tête
  const sortedTasks = [...tasks].sort((a, b) => {
    const aPinned = pinnedTasks.includes(a.id);
    const bPinned = pinnedTasks.includes(b.id);
    return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
  });

  // Rendu récursif d'une tâche avec ses sous-tâches
  const renderTask = (task: Task): React.ReactNode => {
    const subTasks = getSubTasks(task.id).filter(t => !t.isCompleted);
    const totalTime = calculateTotalTime(task);
    const isSelected = selectedTasks.includes(task.id);
    const isPinned = pinnedTasks.includes(task.id);

    return (
      <div 
        key={task.id}
        data-category={task.category}
        className={`task-item ${isPinned ? 'task-pinned' : ''}`}
      >
        <TaskItem
          task={task}
          subTasks={subTasks}
          totalTime={totalTime}
          isSelected={isSelected}
          isPinned={isPinned}
          canHaveSubTasks={canHaveSubTasks(task)}
          forceExtended={isExtendedView}
          onToggleSelection={onToggleSelection}
          onToggleExpansion={onToggleExpansion}
          onToggleCompletion={onToggleCompletion}
          onTogglePinTask={onTogglePinTask}
          onRemoveTask={onRemoveTask}
          onCreateSubTask={onCreateSubTask}
          onEditTask={onEditTask}
          onAssignToProject={onAssignToProject}
        />

        {/* Sous-tâches */}
        {subTasks.length > 0 && task.isExpanded && (
          <div className="mt-1 space-y-1">
            {subTasks.map(subTask => renderTask(subTask))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* En-tête */}
      <div className="relative px-3 pb-2 pt-2 border-b border-border bg-background">
        <h2 className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wide">
          Tâches Actives ({sortedTasks.length})
        </h2>
      </div>

      {/* Toggle vue étendue */}
      <div className="px-3 py-2 border-b border-border bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExtendedView(!isExtendedView)}
          className="w-full justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {isExtendedView ? (
            <>
              <ChevronsUp className="w-4 h-4 mr-2" />
              Vue condensée
            </>
          ) : (
            <>
              <ChevronsDown className="w-4 h-4 mr-2" />
              Vue étendue
            </>
          )}
        </Button>
      </div>

      {/* Liste des tâches */}
      <div className="p-2 space-y-1">
        {sortedTasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-3">
                <Clock className="w-8 h-8 mx-auto mb-2" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Aucune tâche active
              </h3>
              <p className="text-xs text-muted-foreground">
                Créez votre première tâche !
              </p>
            </div>
          </div>
        ) : (
          sortedTasks.map(task => renderTask(task))
        )}
      </div>
    </>
  );
};

export default SidebarTasksSection;
