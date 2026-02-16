import React, { useState } from 'react';
import { TaskCategory, TaskContext } from '@/types/task';
import { eisenhowerFromCategory, categoryFromEisenhower } from '@/types/item';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateTask, sanitizeTask } from '@/utils/taskValidation';
import { useToast } from '@/hooks/use-toast';

interface QuickAddTaskProps {
  onAddTask: (task: any) => void;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ onAddTask }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [context, setContext] = useState<TaskContext>('Perso');
  const [category, setCategory] = useState<TaskCategory>('Autres');
  const [estimatedTime, setEstimatedTime] = useState<string>('30');

  const handleSubmit = () => {
    const taskData = {
      name: name.trim(),
      context,
      category,
      estimatedTime: parseInt(estimatedTime),
      level: 0 as const,
      isExpanded: true,
      isCompleted: false
    };

    // Validation
    const errors = validateTask(taskData);
    if (errors.length > 0) {
      toast({
        title: "Erreur de validation",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    // Sanitisation et création
    const sanitized = sanitizeTask(taskData);
    onAddTask(sanitized);

    // Réinitialiser seulement le titre
    setName('');
    
    toast({
      title: "Tâche créée",
      description: `${taskData.name} a été ajoutée avec succès`,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 border-b border-border bg-accent/50 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Ajout rapide
      </h3>
      
      <Input
        placeholder="Titre de la tâche..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="text-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <Select value={context} onValueChange={(value) => setContext(value as TaskContext)}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pro">Pro</SelectItem>
            <SelectItem value="Perso">Perso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={estimatedTime} onValueChange={setEstimatedTime}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 min</SelectItem>
            <SelectItem value="30">30 min</SelectItem>
            <SelectItem value="45">45 min</SelectItem>
            <SelectItem value="60">1h</SelectItem>
            <SelectItem value="90">1h30</SelectItem>
            <SelectItem value="120">2h</SelectItem>
            <SelectItem value="180">3h</SelectItem>
            <SelectItem value="240">4h</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(() => {
        const flags = eisenhowerFromCategory(category);
        return (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCategory(categoryFromEisenhower({ ...flags, isImportant: !flags.isImportant }))}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer border',
                flags.isImportant
                  ? 'bg-category-envie/15 text-category-envie border-category-envie/30'
                  : 'text-muted-foreground bg-background border-border hover:bg-accent/50'
              )}
            >
              <span>⭐</span> Important
            </button>
            <button
              type="button"
              onClick={() => setCategory(categoryFromEisenhower({ ...flags, isUrgent: !flags.isUrgent }))}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer border',
                flags.isUrgent
                  ? 'bg-category-quotidien/15 text-category-quotidien border-category-quotidien/30'
                  : 'text-muted-foreground bg-background border-border hover:bg-accent/50'
              )}
            >
              <span>⚡</span> Urgent
            </button>
          </div>
        );
      })()}

      <Button 
        onClick={handleSubmit}
        className="w-full h-8 text-xs"
        size="sm"
      >
        <Plus className="w-3 h-3 mr-1" />
        Créer
      </Button>
    </div>
  );
};

export default QuickAddTask;
