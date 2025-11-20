import { Task } from '@/types/task';
import { TaskProjectStatus } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock } from 'lucide-react';

interface KanbanBoardProps {
  tasks: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
  onStatusChange: (taskId: string, newStatus: TaskProjectStatus) => void;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
}

export const KanbanBoard = ({ 
  tasks, 
  onStatusChange, 
  onTaskClick,
  onToggleComplete 
}: KanbanBoardProps) => {
  const columns = [
    { status: 'todo' as TaskProjectStatus, title: 'À faire', tasks: tasks.todo, color: 'bg-muted' },
    { status: 'in-progress' as TaskProjectStatus, title: 'En cours', tasks: tasks.inProgress, color: 'bg-project/10' },
    { status: 'done' as TaskProjectStatus, title: 'Terminé', tasks: tasks.done, color: 'bg-green-50' }
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskProjectStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, newStatus);
    }
  };

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
                  className="cursor-move hover:shadow-md transition-shadow"
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
