
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
      <Button 
        onClick={() => setIsOpen(true)}
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nouvelle tâche
      </Button>
    );
  }

  return (
    <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-blue-900">Créer une nouvelle tâche</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nom de la tâche */}
        <div>
          <Label htmlFor="task-name" className="text-sm font-medium text-gray-700">
            Nom de la tâche *
          </Label>
          <Input
            id="task-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Que devez-vous faire ?"
            className="mt-1"
            autoFocus
          />
        </div>

        {/* Catégorie */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Catégorie *
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
              <label
                key={cat}
                className={`
                  flex items-center space-x-2 p-2 border rounded cursor-pointer transition-all
                  ${category === cat 
                    ? `${config.color} border-current` 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={category === cat}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Temps estimé */}
        <div>
          <Label htmlFor="estimated-time" className="text-sm font-medium text-gray-700">
            Temps estimé *
          </Label>
          <Select value={estimatedTime.toString()} onValueChange={(value) => setEstimatedTime(Number(value))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Combien de temps ?" />
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

        {/* Boutons d'action */}
        <div className="flex space-x-2 pt-2">
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
            Ajouter la tâche
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
