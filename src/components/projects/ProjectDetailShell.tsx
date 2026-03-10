import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, ArrowUpDown, CheckCircle2, Edit, Eye, EyeOff, Filter, ListPlus, Search, Settings2, Trash2, X } from 'lucide-react';
import { KanbanBoard, KanbanColumn } from './KanbanBoard';
import { KanbanColumnManager } from './KanbanColumnManager';
import type { Task } from '@/types/task';

interface ProjectDetailShellProps {
  project: {
    name: string;
    icon?: string;
    description?: string;
    showInSidebar?: boolean;
  };
  statusBadge: {
    label: string;
    className: string;
  };
  titleBadge?: React.ReactNode;
  statsGridClassName: string;
  statsCards: React.ReactNode[];
  boardHeaderAside?: React.ReactNode;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  priorityOptions: Array<{ value: string; label: string }>;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOptions: Array<{ value: string; label: string }>;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  activeFilterBadges: React.ReactNode[];
  filteredTasksByColumn: Record<string, Task[]>;
  columns: KanbanColumn[];
  onStatusChange: (taskId: string, status: string) => Promise<unknown>;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  renderTaskBadge?: (task: Task) => React.ReactNode;
  showColumnManager: boolean;
  onOpenColumnManager: () => void;
  onCloseColumnManager: () => void;
  onColumnsChange: (columns: KanbanColumn[]) => Promise<void>;
  onBack: () => void;
  onEdit: () => void;
  onComplete?: () => void;
  onDelete: () => void;
  onToggleSidebar: () => void;
  onCreateTask: () => void;
  showCompleteAction: boolean;
  taskModal?: React.ReactNode;
}

const ProjectDetailShell: React.FC<ProjectDetailShellProps> = ({
  project,
  statusBadge,
  titleBadge,
  statsGridClassName,
  statsCards,
  boardHeaderAside,
  searchQuery,
  onSearchQueryChange,
  priorityFilter,
  onPriorityFilterChange,
  priorityOptions,
  sortBy,
  onSortByChange,
  sortOptions,
  hasActiveFilters,
  clearFilters,
  activeFilterBadges,
  filteredTasksByColumn,
  columns,
  onStatusChange,
  onTaskClick,
  onToggleComplete,
  onDeleteTask,
  renderTaskBadge,
  showColumnManager,
  onOpenColumnManager,
  onCloseColumnManager,
  onColumnsChange,
  onBack,
  onEdit,
  onComplete,
  onDelete,
  onToggleSidebar,
  onCreateTask,
  showCompleteAction,
  taskModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{project.icon || '📚'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  {titleBadge}
                </div>
                <Badge className={`${statusBadge.className} mt-1`}>
                  {statusBadge.label}
                </Badge>
              </div>
            </div>

            {project.description && (
              <p className="text-muted-foreground max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card">
            <Switch
              id="show-in-sidebar"
              checked={project.showInSidebar ?? false}
              onCheckedChange={onToggleSidebar}
            />
            <Label htmlFor="show-in-sidebar" className="text-sm cursor-pointer flex items-center gap-1">
              {project.showInSidebar ? (
                <><Eye className="w-4 h-4 text-project" /> Sidebar</>
              ) : (
                <><EyeOff className="w-4 h-4 text-muted-foreground" /> Sidebar</>
              )}
            </Label>
          </div>

          <Button variant="outline" size="sm" className="h-auto py-2" onClick={onOpenColumnManager}>
            <Settings2 className="w-4 h-4" />
          </Button>

          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>

          {showCompleteAction && onComplete && (
            <Button
              variant="outline"
              onClick={onComplete}
              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Terminer
            </Button>
          )}

          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>

          <Button onClick={onCreateTask} className="bg-project hover:bg-project/90 text-white">
            <ListPlus className="w-4 h-4 mr-2" />
            Ajouter au projet
          </Button>
        </div>
      </div>

      <div className={statsGridClassName}>
        {statsCards.map((card, index) => (
          <React.Fragment key={index}>{card}</React.Fragment>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="pl-10 bg-background"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="w-4 h-4" />
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={priorityFilter !== 'all' ? 'default' : 'outline'} className="gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {priorityFilter === 'all' ? 'Priorité' : priorityFilter}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrer par priorité</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {priorityOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onPriorityFilterChange(option.value)}
                className={priorityFilter === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={sortBy !== 'none' ? 'default' : 'outline'} className="gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">Trier</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Trier les tâches</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortByChange(option.value)}
                className={sortBy === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <span>Filtres actifs :</span>
          {activeFilterBadges}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tableau Kanban</h2>
          {boardHeaderAside ?? (
            <Button variant="outline" size="sm" onClick={onOpenColumnManager}>
              <Settings2 className="w-4 h-4 mr-2" />
              Colonnes
            </Button>
          )}
        </div>

        <KanbanBoard
          tasksByColumn={filteredTasksByColumn}
          columns={columns}
          onStatusChange={onStatusChange}
          onTaskClick={onTaskClick}
          onToggleComplete={onToggleComplete}
          onDeleteTask={onDeleteTask}
          renderTaskBadge={renderTaskBadge}
        />
      </div>

      <KanbanColumnManager
        columns={columns}
        onColumnsChange={onColumnsChange}
        isOpen={showColumnManager}
        onClose={onCloseColumnManager}
      />

      {taskModal}
    </div>
  );
};

export default ProjectDetailShell;
