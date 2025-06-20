import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { Task, TaskCategory, TIME_OPTIONS, CATEGORY_CONFIG } from '@/types/task';

interface TaskFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [estimatedTime, setEstimatedTime] = useState<number | ''>('');

  // Réinitialiser le formulaire
  const resetForm = () => {
    setName('');
    setCategory('');
    setEstimatedTime('');
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs
    if (!name.trim()) {
      alert('Veuillez saisir un nom de tâche');
      return;
    }
    if (!category) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }
    if (!estimatedTime) {
      alert('Veuillez sélectionner un temps estimé');
      return;
    }

    // Créer la tâche
    onAddTask({
      name: name.trim(),
      category,
      estimatedTime: Number(estimatedTime)
    });

    // Réinitialiser et fermer
    resetForm();
    setIsOpen(false);
    console.log('Tâche créée:', { name, category, estimatedTime });
  };

  // Gérer l'annulation
  const handleCancel = () => {
    resetForm();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="mb-4">
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 w-full max-w-md">
      <div className="p-3 border-2 border-blue-200 rounded-lg bg-blue-50 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Nouvelle tâche</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Nom de la tâche - compact */}
          <div>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la tâche..."
              className="text-sm h-8"
              autoFocus
            />
          </div>

          {/* Catégorie - boutons compacts avec icônes */}
          <div>
            <Label className="text-xs text-gray-700 mb-1 block">
              Catégorie
            </Label>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat as TaskCategory)}
                  className={`
                    flex items-center space-x-1 p-1.5 text-xs border rounded transition-all
                    ${category === cat 
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

          {/* Temps estimé - compact */}
          <div>
            <Select value={estimatedTime.toString()} onValueChange={(value) => setEstimatedTime(Number(value))}>
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

          {/* Boutons d'action - compacts */}
          <div className="flex space-x-2 pt-1">
            <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7">
              Ajouter
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="text-xs h-7">
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
