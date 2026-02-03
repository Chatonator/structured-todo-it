import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Filter, X, User, Folder, Users, AlertCircle } from 'lucide-react';
import { TaskCategory, TaskContext, SubTaskCategory, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG } from '@/types/task';
import { getCategoryClasses, getPriorityClasses, getContextIcon } from '@/lib/styling';

export interface TimelineTaskFilters {
  categories: TaskCategory[];
  contexts: TaskContext[];
  priorities: SubTaskCategory[];
  sources: ('free' | 'project' | 'team')[];
}

interface TimelineFiltersProps {
  filters: TimelineTaskFilters;
  onFiltersChange: (filters: TimelineTaskFilters) => void;
  className?: string;
}

const CATEGORIES: TaskCategory[] = ['Obligation', 'Quotidien', 'Envie', 'Autres'];
const CONTEXTS: TaskContext[] = ['Pro', 'Perso'];
const PRIORITIES: SubTaskCategory[] = ['Le plus important', 'Important', 'Peut attendre', "Si j'ai le temps"];
const SOURCES = [
  { id: 'free' as const, label: 'Tâches libres', icon: User },
  { id: 'project' as const, label: 'Projets', icon: Folder },
  { id: 'team' as const, label: 'Équipe', icon: Users }
];

/**
 * Composant de filtres pour le panneau de tâches Timeline
 */
export const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  filters,
  onFiltersChange,
  className
}) => {
  const activeFiltersCount = 
    filters.categories.length + 
    filters.contexts.length + 
    filters.priorities.length + 
    filters.sources.length;

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

  const togglePriority = (priority: SubTaskCategory) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: newPriorities });
  };

  const toggleSource = (source: 'free' | 'project' | 'team') => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source];
    onFiltersChange({ ...filters, sources: newSources });
  };

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      contexts: [],
      priorities: [],
      sources: []
    });
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={activeFiltersCount > 0 ? "secondary" : "ghost"} 
            size="sm" 
            className="h-7 px-2 text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-72 p-3" align="start">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filtres</span>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={clearFilters}
                >
                  <X className="w-3 h-3 mr-1" />
                  Effacer
                </Button>
              )}
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Source</Label>
              <div className="flex flex-wrap gap-1">
                {SOURCES.map(source => {
                  const Icon = source.icon;
                  const isActive = filters.sources.includes(source.id);
                  return (
                    <Button
                      key={source.id}
                      variant={isActive ? "secondary" : "outline"}
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => toggleSource(source.id)}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {source.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Priorités */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Priorité
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {PRIORITIES.map(priority => {
                  const isActive = filters.priorities.includes(priority);
                  const config = SUB_CATEGORY_CONFIG[priority];
                  return (
                    <button
                      key={priority}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => togglePriority(priority)}
                    >
                      <span className={cn("w-2 h-2 rounded-full", config?.color?.split(' ')[0] || 'bg-muted')} />
                      <span className="truncate">{priority}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Catégories */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Catégorie</Label>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map(category => {
                  const isActive = filters.categories.includes(category);
                  return (
                    <Button
                      key={category}
                      variant={isActive ? "secondary" : "outline"}
                      size="sm"
                      className={cn(
                        "h-6 text-xs px-2",
                        isActive && getCategoryClasses(category, 'badge')
                      )}
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Contextes */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Contexte</Label>
              <div className="flex gap-2">
                {CONTEXTS.map(context => {
                  const isActive = filters.contexts.includes(context);
                  return (
                    <Button
                      key={context}
                      variant={isActive ? "secondary" : "outline"}
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => toggleContext(context)}
                    >
                      <span className="mr-1">{getContextIcon(context)}</span>
                      {context}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick filter badges */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.sources.map(source => {
            const sourceConfig = SOURCES.find(s => s.id === source);
            const Icon = sourceConfig?.icon || User;
            return (
              <Badge 
                key={source} 
                variant="secondary" 
                className="h-5 text-[10px] px-1.5 cursor-pointer hover:bg-destructive/10"
                onClick={() => toggleSource(source)}
              >
                <Icon className="w-2.5 h-2.5 mr-0.5" />
                {sourceConfig?.label}
                <X className="w-2.5 h-2.5 ml-0.5" />
              </Badge>
            );
          })}
          {filters.priorities.slice(0, 2).map(priority => (
            <Badge 
              key={priority} 
              variant="secondary" 
              className="h-5 text-[10px] px-1.5 cursor-pointer hover:bg-destructive/10"
              onClick={() => togglePriority(priority)}
            >
              {priority}
              <X className="w-2.5 h-2.5 ml-0.5" />
            </Badge>
          ))}
          {filters.priorities.length > 2 && (
            <Badge variant="outline" className="h-5 text-[10px] px-1.5">
              +{filters.priorities.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineFilters;
