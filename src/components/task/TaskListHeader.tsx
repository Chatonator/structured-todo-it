
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, SortAsc, X, Undo, Redo } from 'lucide-react';
import { TaskCategory, CATEGORY_CONFIG } from '@/types/task';

interface TaskListHeaderProps {
  tasksCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: TaskCategory | 'all';
  onCategoryFilterChange: (category: TaskCategory | 'all') => void;
  sortBy: 'name' | 'duration' | 'category';
  onSortChange: (sortBy: 'name' | 'duration' | 'category') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * Composant header pour la liste des tâches
 * Contient les contrôles de recherche, filtrage et tri
 */
const TaskListHeader: React.FC<TaskListHeaderProps> = ({
  tasksCount,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  return (
    <div className="p-3 border-b border-border bg-accent space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Tâches Actives ({tasksCount})
        </h2>
        
        {/* Historique */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-7 w-7 p-0 disabled:opacity-50"
            title="Annuler (Ctrl+Z)"
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-7 w-7 p-0 disabled:opacity-50"
            title="Refaire (Ctrl+Y)"
          >
            <Redo className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Recherche locale */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Rechercher dans les tâches..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-xs h-8 pr-8 border-border bg-background text-foreground"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Filtres et tri */}
      <div className="flex items-center gap-2">
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="h-7 text-xs flex-1 border-border bg-background text-foreground">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="all" className="text-foreground">Toutes catégories</SelectItem>
            {Object.keys(CATEGORY_CONFIG).map((category) => (
              <SelectItem key={category} value={category} className="text-foreground">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-7 text-xs flex-1 border-border bg-background text-foreground">
            <SortAsc className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="name" className="text-foreground">Nom</SelectItem>
            <SelectItem value="duration" className="text-foreground">Durée</SelectItem>
            <SelectItem value="category" className="text-foreground">Catégorie</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TaskListHeader;
