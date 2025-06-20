
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check } from 'lucide-react';
import { Task, TaskCategory, TIME_OPTIONS, CATEGORY_CONFIG } from '@/types/task';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  parentTask?: Task; // Pour créer des sous-tâches
}

interface TaskDraft {
  name: string;
  category: TaskCategory | '';
  estimatedTime: number | '';
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onAddTask, parentTask }) => {
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([
    { name: '', category: '', estimatedTime: '' }
  ]);

  const resetModal = () => {
    setTaskDrafts([{ name: '', category: '', estimatedTime: '' }]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const addNewTaskDraft = () => {
    setTaskDrafts([...taskDrafts, { name: '', category: '', estimatedTime: '' }]);
  };

  const updateTaskDraft = (index: number, field: keyof TaskDraft, value: string | number) => {
    const updated = [...taskDrafts];
    updated[index] = { ...updated[index], [field]: value };
    setTaskDrafts(updated);
  };

  const removeTaskDraft = (index: number) => {
    if (taskDrafts.length > 1) {
      setTaskDrafts(taskDrafts.filter((_, i) => i !== index));
    }
  };

  const handleFinish = () => {
    const validTasks = taskDrafts.filter(draft => 
      draft.name.trim() && draft.category && draft.estimatedTime
    );

    validTasks.forEach(draft => {
      const level = parentTask ? (parentTask.level + 1) as 0 | 1 | 2 : 0;
      
      onAddTask({
        name: draft.name.trim(),
        category: draft.category as TaskCategory,
        estimatedTime: Number(draft.estimatedTime),
        parentId: parentTask?.id,
        level,
        isExpanded: true
      });
    });

    handleClose();
  };

  const isTaskValid = (task: TaskDraft) => 
    task.name.trim() && task.category && task.estimatedTime;

  const hasValidTasks = taskDrafts.some(isTaskValid);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {parentTask 
              ? `Créer des sous-tâches pour "${parentTask.name}"` 
              : 'Nouvelle(s) tâche(s)'
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {taskDrafts.map((draft, index) => (
            <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Tâche {index + 1}
                </span>
                {taskDrafts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTaskDraft(index)}
                    className="h-6 w-6 p-0 text-red-500"
                  >
                    ×
                  </Button>
                )}
              </div>

              {/* Nom de la tâche */}
              <div>
                <Input
                  type="text"
                  value={draft.name}
                  onChange={(e) => updateTaskDraft(index, 'name', e.target.value)}
                  placeholder="Nom de la tâche..."
                  className="text-sm"
                />
              </div>

              {/* Catégorie */}
              <div>
                <Label className="text-xs text-gray-700 mb-1 block">
                  Catégorie
                </Label>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateTaskDraft(index, 'category', cat)}
                      className={`
                        flex items-center space-x-1 p-1.5 text-xs border rounded transition-all
                        ${draft.category === cat 
                          ? `${config.color} border-current` 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-sm">{config.icon}</span>
                      <span className="font-medium truncate">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Temps estimé */}
              <div>
                <Select 
                  value={draft.estimatedTime.toString()} 
                  onValueChange={(value) => updateTaskDraft(index, 'estimatedTime', Number(value))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Temps estimé..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isTaskValid(draft) && (
                <div className="text-xs text-green-600 flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  Tâche prête
                </div>
              )}
            </div>
          ))}

          {/* Boutons d'action */}
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={addNewTaskDraft}
              className="text-xs"
              disabled={taskDrafts.length >= 3 && parentTask} // Limite à 3 sous-tâches
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter une tâche
            </Button>

            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleFinish}
                disabled={!hasValidTasks}
                className="text-xs bg-green-600 hover:bg-green-700"
              >
                <Check className="w-3 h-3 mr-1" />
                Terminer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
