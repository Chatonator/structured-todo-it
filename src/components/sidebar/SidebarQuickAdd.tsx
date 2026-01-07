import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { TaskCategory, TaskContext, getCategoryDisplayName } from '@/types/task';
import { validateTask, sanitizeTask } from '@/utils/taskValidation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarQuickAddProps {
  onAddTask: (task: any) => void;
  isCollapsed: boolean;
}

const SidebarQuickAdd: React.FC<SidebarQuickAddProps> = ({ onAddTask, isCollapsed }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [context, setContext] = useState<TaskContext>('Perso');
  const [category, setCategory] = useState<TaskCategory>('Obligation');
  const [estimatedTime, setEstimatedTime] = useState<string>('30');

  const handleSubmit = () => {
    const taskData = {
      name: name.trim(),
      context,
      category,
      estimatedTime: parseInt(estimatedTime),
      level: 0 as const,
      isExpanded: true,
      isCompleted: false
    };

    // Validation
    const errors = validateTask(taskData);
    if (errors.length > 0) {
      toast({
        title: "Erreur de validation",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    // Sanitisation et création
    const sanitized = sanitizeTask(taskData);
    onAddTask(sanitized);

    // Réinitialiser et fermer
    setName('');
    setIsOpen(false);
    
    toast({
      title: "Tâche créée",
      description: `${taskData.name} a été ajoutée avec succès`,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Mode collapsed: ne rien afficher
  if (isCollapsed) {
    return null;
  }

  // Mode expanded: section collapsible
  return (
    <SidebarGroup>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="w-full justify-between hover:bg-sidebar-accent">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="font-medium">Nouvelle tâche</span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarGroupContent className="p-3 space-y-3 bg-sidebar-accent/30 rounded-lg mt-2">
            <Input
              placeholder="Titre de la tâche..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm bg-background"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2">
              <Select value={context} onValueChange={(value) => setContext(value as TaskContext)}>
                <SelectTrigger className="text-xs h-8 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pro">💼 Pro</SelectItem>
                  <SelectItem value="Perso">🏠 Perso</SelectItem>
                </SelectContent>
              </Select>

              <Select value={estimatedTime} onValueChange={setEstimatedTime}>
                <SelectTrigger className="text-xs h-8 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1h</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2h</SelectItem>
                  <SelectItem value="180">3h</SelectItem>
                  <SelectItem value="240">4h</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)}>
              <SelectTrigger className="text-xs h-8 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Obligation">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-category-obligation" />
                    {getCategoryDisplayName('Obligation')}
                  </span>
                </SelectItem>
                <SelectItem value="Quotidien">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-category-quotidien" />
                    {getCategoryDisplayName('Quotidien')}
                  </span>
                </SelectItem>
                <SelectItem value="Envie">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-category-envie" />
                    {getCategoryDisplayName('Envie')}
                  </span>
                </SelectItem>
                <SelectItem value="Autres">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-category-autres" />
                    {getCategoryDisplayName('Autres')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleSubmit}
              className="w-full h-8 text-xs"
              size="sm"
              disabled={!name.trim()}
            >
              <Plus className="w-3 h-3 mr-1" />
              Créer la tâche
            </Button>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
};

export default SidebarQuickAdd;
