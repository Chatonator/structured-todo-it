import React from 'react';
import { cn } from '@/lib/utils';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Filter option type
export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

// Sort option type
export interface SortOption {
  value: string;
  label: string;
}

export interface ViewToolbarProps {
  // Search
  searchEnabled?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  
  // Filters
  filters?: {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  
  // Sort
  sortEnabled?: boolean;
  sortValue?: string;
  sortOptions?: SortOption[];
  onSortChange?: (value: string) => void;
  
  // Custom actions (right side)
  actions?: React.ReactNode;
  
  // Layout
  className?: string;
  compact?: boolean;
}

/**
 * ViewToolbar - Barre d'outils standardisée pour les vues
 * 
 * Fournit recherche, filtres, tri et actions personnalisées.
 * S'adapte automatiquement à la taille de l'écran.
 * 
 * @example
 * <ViewToolbar
 *   searchEnabled
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   filters={[
 *     {
 *       id: 'status',
 *       label: 'Statut',
 *       value: statusFilter,
 *       options: [{ value: 'all', label: 'Tous' }],
 *       onChange: setStatusFilter,
 *     }
 *   ]}
 *   sortEnabled
 *   sortValue={sortBy}
 *   sortOptions={[{ value: 'date', label: 'Date' }]}
 *   onSortChange={setSortBy}
 *   actions={<Button>Action</Button>}
 * />
 */
export const ViewToolbar: React.FC<ViewToolbarProps> = ({
  searchEnabled = false,
  searchValue = '',
  searchPlaceholder = 'Rechercher...',
  onSearchChange,
  filters = [],
  sortEnabled = false,
  sortValue,
  sortOptions = [],
  onSortChange,
  actions,
  className,
  compact = false,
}) => {
  const hasSearch = searchEnabled && onSearchChange;
  const hasFilters = filters.length > 0;
  const hasSort = sortEnabled && sortOptions.length > 0 && onSortChange;
  const hasActions = !!actions;

  // Don't render if nothing to show
  if (!hasSearch && !hasFilters && !hasSort && !hasActions) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center gap-3",
        compact ? "py-2" : "py-4",
        className
      )}
    >
      {/* Left side: Search + Filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Search */}
        {hasSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        )}

        {/* Filters */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
            {filters.map((filter) => (
              <Select
                key={filter.id}
                value={filter.value}
                onValueChange={filter.onChange}
              >
                <SelectTrigger className="h-9 min-w-[120px] max-w-[180px]">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}

        {/* Sort */}
        {hasSort && (
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={sortValue} onValueChange={onSortChange}>
              <SelectTrigger className="h-9 min-w-[120px] max-w-[160px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right side: Actions */}
      {hasActions && (
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};

export default ViewToolbar;
