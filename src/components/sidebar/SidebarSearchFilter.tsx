import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TaskCategory, TaskContext, CATEGORY_DISPLAY_NAMES } from '@/types/task';
import { cn } from '@/lib/utils';

export interface TaskFilters {
  categories: TaskCategory[];
  contexts: TaskContext[];
  showPinned: boolean;
  showRecurring: boolean;
}

interface SidebarSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

const defaultFilters: TaskFilters = {
  categories: [],
  contexts: [],
  showPinned: false,
  showRecurring: false,
};

const SidebarSearchFilter: React.FC<SidebarSearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = 
    filters.categories.length > 0 || 
    filters.contexts.length > 0 || 
    filters.showPinned || 
    filters.showRecurring;

  const activeFilterCount = 
    filters.categories.length + 
    filters.contexts.length + 
    (filters.showPinned ? 1 : 0) + 
    (filters.showRecurring ? 1 : 0);

  const toggleCategory = (category: TaskCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const toggleContext = (context: TaskContext) => {
    const newContexts = filters.contexts.includes(context)
      ? filters.contexts.filter(c => c !== context)
      : [...filters.contexts, context];
    onFiltersChange({ ...filters, contexts: newContexts });
  };

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const categories: TaskCategory[] = ['Obligation', 'Quotidien', 'Envie', 'Autres'];
  const contexts: TaskContext[] = ['Pro', 'Perso'];

  return (
    <div className="px-3 py-2 space-y-2">
      {/* Barre de recherche + bouton filtre */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm bg-sidebar-accent/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
              onClick={() => onSearchChange('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 shrink-0",
                hasActiveFilters && "border-primary text-primary"
              )}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 bg-popover z-50" align="end">
            <div className="space-y-4">
              {/* Catégories */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Catégories</p>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(category => (
                    <label
                      key={category}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                        className="h-4 w-4"
                      />
                      <span className="truncate">{CATEGORY_DISPLAY_NAMES[category]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contexte */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Contexte</p>
                <div className="flex gap-4">
                  {contexts.map(context => (
                    <label
                      key={context}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.contexts.includes(context)}
                        onCheckedChange={() => toggleContext(context)}
                        className="h-4 w-4"
                      />
                      <span>{context === 'Pro' ? '💼 Pro' : '🏠 Perso'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Statut */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Statut</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={filters.showPinned}
                      onCheckedChange={(checked) => 
                        onFiltersChange({ ...filters, showPinned: checked === true })
                      }
                      className="h-4 w-4"
                    />
                    <span>📌 Épinglées uniquement</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={filters.showRecurring}
                      onCheckedChange={(checked) => 
                        onFiltersChange({ ...filters, showRecurring: checked === true })
                      }
                      className="h-4 w-4"
                    />
                    <span>🔄 Récurrentes uniquement</span>
                  </label>
                </div>
              </div>

              {/* Bouton reset */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Badges des filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {filters.categories.map(category => (
            <Badge
              key={category}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-destructive/20"
              onClick={() => toggleCategory(category)}
            >
              {CATEGORY_DISPLAY_NAMES[category]}
              <X className="w-2.5 h-2.5 ml-1" />
            </Badge>
          ))}
          {filters.contexts.map(context => (
            <Badge
              key={context}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-destructive/20"
              onClick={() => toggleContext(context)}
            >
              {context}
              <X className="w-2.5 h-2.5 ml-1" />
            </Badge>
          ))}
          {filters.showPinned && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-destructive/20"
              onClick={() => onFiltersChange({ ...filters, showPinned: false })}
            >
              📌 Épinglées
              <X className="w-2.5 h-2.5 ml-1" />
            </Badge>
          )}
          {filters.showRecurring && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-destructive/20"
              onClick={() => onFiltersChange({ ...filters, showRecurring: false })}
            >
              🔄 Récurrentes
              <X className="w-2.5 h-2.5 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarSearchFilter;
export { defaultFilters };
