import React, { useCallback } from 'react';
import { Task, SUB_CATEGORY_CONFIG, SubTaskCategory } from '@/types/task';
import { TaskProjectStatus } from '@/types/project';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Clock, Trash2 } from 'lucide-react';

// Priority badge component
const PriorityBadge = ({ priority }: { priority?: SubTaskCategory }) => {
  if (!priority) return null;
  
  const config = SUB_CATEGORY_CONFIG[priority];
  const priorityEmoji = {
    'Le plus important': '🔴',
    'Important': '🟠',
    'Peut attendre': '🟡',
    "Si j'ai le temps": '🟢'
  }[priority] || '';

  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${config?.color || ''}`}
    >
      {priorityEmoji} {priority}
    </Badge>
  );
};

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface KanbanBoardProps {
  tasks: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
  columns?: KanbanColumn[];
  onStatusChange: (taskId: string, newStatus: TaskProjectStatus) => void;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'todo', name: 'À faire', color: 'bg-muted', order: 0 },
  { id: 'in-progress', name: 'En cours', color: 'bg-project/10', order: 1 },
  { id: 'done', name: 'Terminé', color: 'bg-green-50 dark:bg-green-900/20', order: 2 }
];

const KanbanBoardComponent = ({ 
  tasks, 
  columns = DEFAULT_COLUMNS,
  onStatusChange, 
  onTaskClick,
  onToggleComplete,
  onDeleteTask
}: KanbanBoardProps) => {
  // Map columns to tasks
  const getTasksForColumn = useCallback((columnId: string): Task[] => {
    switch (columnId) {
      case 'todo': return tasks.todo;
      case 'in-progress': return tasks.inProgress;
      case 'done': return tasks.done;
      default: return [];
    }
  }, [tasks]);

  // Map column id to TaskProjectStatus
  const columnIdToStatus = useCallback((columnId: string): TaskProjectStatus => {
    switch (columnId) {
      case 'todo': return 'todo';
      case 'in-progress': return 'in-progress';
      case 'done': return 'done';
      default: return 'todo';
    }
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, columnIdToStatus(columnId));
    }
  }, [onStatusChange, columnIdToStatus]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      onDeleteTask(taskId);
    }
  }, [onDeleteTask]);

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sortedColumns.map((column) => {
        const columnTasks = getTasksForColumn(column.id);
        
        return (
          <div
            key={column.id}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`${column.color} rounded-t-lg p-3 border-b`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.name}</h3>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>
            </div>
            
            <div className="space-y-2 p-2 min-h-[200px] bg-muted/20 rounded-b-lg">
              {columnTasks.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Aucune tâche
                </p>
              ) : (
                columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="cursor-move hover:shadow-md transition-shadow group"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={() => onToggleComplete(task.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div 
                          className="flex-1 cursor-pointer" 
                          onClick={() => onTaskClick(task)}
                        >
                          <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {task.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <PriorityBadge priority={task.subCategory} />
                            {task.estimatedTime && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {task.estimatedTime}min
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteClick(e, task.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// React.memo pour éviter les re-renders inutiles
export const KanbanBoard = React.memo(KanbanBoardComponent);

// Export default columns for use in other components
export { DEFAULT_COLUMNS };
export type { KanbanColumn };
