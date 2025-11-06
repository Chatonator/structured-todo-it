import React, { useState } from 'react';
import { TaskCategory, TaskContext, getCategoryDisplayName } from '@/types/task';
import { validateTask, sanitizeTask } from '@/utils/taskValidation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickAddTaskProps {
  onAddTask: (task: any) => void;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ onAddTask }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [context, setContext] = useState<TaskContext>('Perso');
  const [category, setCategory] = useState<TaskCategory>('Obligation');
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

      <Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)}>
        <SelectTrigger className="text-xs h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Obligation">{getCategoryDisplayName('Obligation')}</SelectItem>
          <SelectItem value="Quotidien">{getCategoryDisplayName('Quotidien')}</SelectItem>
          <SelectItem value="Envie">{getCategoryDisplayName('Envie')}</SelectItem>
          <SelectItem value="Autres">{getCategoryDisplayName('Autres')}</SelectItem>
        </SelectContent>
      </Select>

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
