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

export type SortField = 'name' | 'category' | 'estimatedTime' | 'createdAt' | 'context';
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
  { value: 'createdAt', label: 'Date de création' },
  { value: 'name', label: 'Nom' },
  { value: 'category', label: 'Catégorie' },
  { value: 'estimatedTime', label: 'Durée estimée' },
  { value: 'context', label: 'Contexte' },
];

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
    <div className="flex items-center gap-1 px-3 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-xs text-muted-foreground hover:text-foreground h-7"
          >
            <ArrowUpDown className="w-3 h-3 mr-2" />
            {currentLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuRadioGroup value={sortConfig.field} onValueChange={handleFieldChange}>
            {sortOptions.map(option => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDirection}
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title={sortConfig.direction === 'asc' ? 'Croissant' : 'Décroissant'}
      >
        {sortConfig.direction === 'asc' ? (
          <ArrowUp className="w-3.5 h-3.5" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
};

export default SidebarSortSelector;
