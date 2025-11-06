import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SortAsc, X } from 'lucide-react';
import { TaskCategory, CATEGORY_CONFIG, getCategoryDisplayName } from '@/types/task';

interface SecondaryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: TaskCategory | 'all';
  onCategoryFilterChange: (category: TaskCategory | 'all') => void;
  sortBy: 'name' | 'duration' | 'category';
  onSortChange: (sortBy: 'name' | 'duration' | 'category') => void;
}

/**
 * Filtres secondaires : recherche, catégorie, tri
 */
const SecondaryFilters: React.FC<SecondaryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortChange
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 text-xs pl-7 pr-8 w-32 md:w-40 border-border bg-background"
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

      {/* Filtre catégorie */}
      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="h-8 text-xs w-32 border-border bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          <SelectItem value="all" className="text-xs">Toutes</SelectItem>
          {Object.keys(CATEGORY_CONFIG).map((category) => (
            <SelectItem key={category} value={category} className="text-xs">
              {getCategoryDisplayName(category as TaskCategory)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tri */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="h-8 text-xs w-28 border-border bg-background">
          <SortAsc className="w-3 h-3 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          <SelectItem value="name" className="text-xs">Nom</SelectItem>
          <SelectItem value="duration" className="text-xs">Durée</SelectItem>
          <SelectItem value="category" className="text-xs">Catégorie</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SecondaryFilters;
