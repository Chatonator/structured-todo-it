import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PROJECT_ICONS, PROJECT_STATUS_CONFIG } from '@/types/project';
import { UnifiedProject } from '@/types/teamProject';
import { Project } from '@/types/project';
import { TaskContext, TaskCategory } from '@/types/task';
import { eisenhowerFromCategory } from '@/types/item';
import { EisenhowerSelector } from '@/components/common/EisenhowerSelector';
import { ContextPillSelector } from '@/components/common/ContextPillSelector';
import { EmojiGrid } from '@/components/common/EmojiGrid';
import { useTeamContext } from '@/contexts/TeamContext';
import { Users, Check, CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    status?: string;
    targetDate?: Date;
    teamId?: string;
    context?: TaskContext;
    category?: TaskCategory;
    isImportant?: boolean;
    isUrgent?: boolean;
  }) => void;
  project?: Project | UnifiedProject | null;
  initialName?: string;
  teamId?: string;
  defaultContext?: TaskContext;
}

export const ProjectModal = ({ open, onClose, onSave, project, initialName, teamId, defaultContext }: ProjectModalProps) => {
  const { teams, currentTeam } = useTeamContext();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [color, setColor] = useState('#a78bfa');
  const [status, setStatus] = useState('planning');
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [context, setContext] = useState<TaskContext>('Perso');
  const [category, setCategory] = useState<TaskCategory>('low_priority');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setIcon(project.icon || '📚');
      setColor(project.color);
      setStatus(project.status);
      setTargetDate(project.targetDate || undefined);
      setSelectedTeamId(null);
      const meta = (project as any).metadata || {};
      setContext((meta.context as TaskContext) || 'Perso');
      setCategory((meta.category as TaskCategory) || 'low_priority');
    } else {
      setName(initialName || '');
      setDescription('');
      setIcon('📚');
      setColor('#a78bfa');
      setStatus('planning');
      setTargetDate(undefined);
      setSelectedTeamId(teamId || currentTeam?.id || null);
      setContext(defaultContext || 'Perso');
      setCategory('low_priority');
    }
  }, [project, initialName, open, teamId, currentTeam?.id]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const flags = eisenhowerFromCategory(category);
    onSave({
      name,
      description: description || undefined,
      icon,
      color,
      status,
      targetDate,
      teamId: selectedTeamId || undefined,
      context,
      category,
      isImportant: flags.isImportant,
      isUrgent: flags.isUrgent,
    });
  };

  const isExistingTeamProject = project && 'teamId' in project && !!project.teamId;
  const isTeamMode = !!teamId || isExistingTeamProject;

  const modalTitle = project 
    ? 'Modifier le projet' 
    : isTeamMode 
      ? "Nouveau projet d'équipe" 
      : 'Nouveau projet';

  const isValid = name.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base font-semibold">{modalTitle}</SheetTitle>
            {isTeamMode && (
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                Équipe
              </Badge>
            )}
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">
            {/* ─── Name ─── */}
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet *"
              autoFocus
              className={cn(
                'text-base h-11 font-medium placeholder:text-muted-foreground/60 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors',
                !name.trim() && 'border-destructive'
              )}
            />

            {/* ─── Context pills ─── */}
            <ContextPillSelector value={context} onChange={setContext} />

            {/* ─── Eisenhower ─── */}
            <EisenhowerSelector
              value={category}
              onChange={setCategory}
            />

            {/* ─── Description ─── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre projet..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* ─── Icon grid ─── */}
            <EmojiGrid value={icon} onChange={setIcon} options={PROJECT_ICONS} />

            {/* ─── Color ─── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Couleur</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                />
                <div
                  className="w-6 h-6 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground font-mono">{color}</span>
              </div>
            </div>

            {/* ─── Status (edit only) ─── */}
            {project && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ─── Target date (Calendar popover) ─── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date cible</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'flex-1 justify-start text-left font-normal',
                        !targetDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={targetDate}
                      onSelect={setTargetDate}
                      disabled={(date) => date < startOfDay(new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {targetDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setTargetDate(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Sticky footer ─── */}
        <div className="border-t border-border p-4 bg-background">
          <Button onClick={handleSubmit} disabled={!isValid} className="w-full">
            <Check className="w-4 h-4 mr-2" />
            {project ? 'Mettre à jour' : 'Créer le projet'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
