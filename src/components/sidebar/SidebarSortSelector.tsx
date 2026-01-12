import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type SortField = 'name' | 'category' | 'estimatedTime' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export const defaultSortConfig: SortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'Date' },
  { value: 'name', label: 'Nom' },
  { value: 'category', label: 'Catégorie' },
  { value: 'estimatedTime', label: 'Durée' },
];

// Category priority order for sorting
export const CATEGORY_SORT_ORDER: Record<string, number> = {
  'Obligation': 1, // Crucial
  'Envie': 2,      // Envies
  'Quotidien': 3,  // Régulier
  'Autres': 4,     // Optionnel
};

interface SidebarSortSelectorProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

const SidebarSortSelector: React.FC<SidebarSortSelectorProps> = ({
  sortConfig,
  onSortChange,
}) => {
  const currentLabel = sortOptions.find(o => o.value === sortConfig.field)?.label || 'Trier';

  const handleFieldChange = (field: string) => {
    onSortChange({ ...sortConfig, field: field as SortField });
  };

  const toggleDirection = () => {
    onSortChange({
      ...sortConfig,
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title={`Trier par ${currentLabel}`}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-popover z-50">
        <DropdownMenuRadioGroup value={sortConfig.field} onValueChange={handleFieldChange}>
          {sortOptions.map(option => (
            <DropdownMenuRadioItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            toggleDirection();
          }}
          className="w-full justify-start text-xs h-7"
        >
          {sortConfig.direction === 'asc' ? (
            <>
              <ArrowUp className="w-3 h-3 mr-2" />
              Croissant
            </>
          ) : (
            <>
              <ArrowDown className="w-3 h-3 mr-2" />
              Décroissant
            </>
          )}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SidebarSortSelector;
