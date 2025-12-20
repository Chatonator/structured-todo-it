import React, { useCallback } from 'react';
import { Task } from '@/types/task';
import { TaskProjectStatus } from '@/types/project';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Clock, Trash2 } from 'lucide-react';

interface KanbanBoardProps {
  tasks: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
  onStatusChange: (taskId: string, newStatus: TaskProjectStatus) => void;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const KanbanBoardComponent = ({ 
  tasks, 
  onStatusChange, 
  onTaskClick,
  onToggleComplete,
  onDeleteTask
}: KanbanBoardProps) => {
  const columns = [
    { status: 'todo' as TaskProjectStatus, title: 'À faire', tasks: tasks.todo, color: 'bg-muted' },
    { status: 'in-progress' as TaskProjectStatus, title: 'En cours', tasks: tasks.inProgress, color: 'bg-project/10' },
    { status: 'done' as TaskProjectStatus, title: 'Terminé', tasks: tasks.done, color: 'bg-green-50 dark:bg-green-900/20' }
  ];

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: TaskProjectStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, newStatus);
    }
  }, [onStatusChange]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      onDeleteTask(taskId);
    }
  }, [onDeleteTask]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => (
        <div
          key={column.status}
          className="flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.status)}
        >
          <div className={`${column.color} rounded-t-lg p-3 border-b`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary">{column.tasks.length}</Badge>
            </div>
          </div>
          
          <div className="space-y-2 p-2 min-h-[200px] bg-muted/20 rounded-b-lg">
            {column.tasks.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Aucune tâche
              </p>
            ) : (
              column.tasks.map((task) => (
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
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
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
      ))}
    </div>
  );
};

// React.memo pour éviter les re-renders inutiles
export const KanbanBoard = React.memo(KanbanBoardComponent);
