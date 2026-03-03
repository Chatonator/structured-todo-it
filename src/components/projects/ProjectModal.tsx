import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PROJECT_ICONS, PROJECT_STATUS_CONFIG } from '@/types/project';
import { UnifiedProject } from '@/types/teamProject';
import { Project } from '@/types/project';
import { TaskContext, TaskCategory } from '@/types/task';
import { eisenhowerFromCategory, categoryFromEisenhower } from '@/types/item';
import { useTeamContext } from '@/contexts/TeamContext';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export const ProjectModal = ({ open, onClose, onSave, project, initialName, teamId }: ProjectModalProps) => {
  const { teams, currentTeam } = useTeamContext();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [color, setColor] = useState('#a78bfa');
  const [status, setStatus] = useState('planning');
  const [targetDate, setTargetDate] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [context, setContext] = useState<TaskContext>('Perso');
  const [category, setCategory] = useState<TaskCategory>('Autres');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setIcon(project.icon || '📚');
      setColor(project.color);
      setStatus(project.status);
      setTargetDate(project.targetDate ? project.targetDate.toISOString().split('T')[0] : '');
      setSelectedTeamId(null);
      // Restore context & eisenhower from project metadata if available
      const meta = (project as any).metadata || {};
      setContext((meta.context as TaskContext) || 'Perso');
      const flags = eisenhowerFromCategory((meta.category as TaskCategory) || 'Autres');
      setCategory((meta.category as TaskCategory) || 'Autres');
    } else {
      setName(initialName || '');
      setDescription('');
      setIcon('📚');
      setColor('#a78bfa');
      setStatus('planning');
      setTargetDate('');
      setSelectedTeamId(teamId || currentTeam?.id || null);
      setContext('Perso');
      setCategory('Autres');
    }
  }, [project, initialName, open, teamId, currentTeam?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const flags = eisenhowerFromCategory(category);
    
    onSave({
      name,
      description: description || undefined,
      icon,
      color,
      status,
      targetDate: targetDate ? new Date(targetDate) : undefined,
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

  const flags = eisenhowerFromCategory(category);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{modalTitle}</DialogTitle>
            {isTeamMode && (
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                Équipe
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du projet *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Écrire un livre"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre projet..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icône</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_ICONS.map((i) => (
                    <SelectItem key={i} value={i}>
                      <span className="text-xl">{i}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-md border border-border cursor-pointer bg-transparent p-0.5"
                />
                <div
                  className="w-6 h-6 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground">{color}</span>
              </div>
            </div>
          </div>

          {/* Contexte Pro/Perso */}
          <div className="space-y-2">
            <Label>Contexte</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setContext('Pro')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer border',
                  context === 'Pro'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'text-muted-foreground bg-background hover:bg-accent/50 border-border'
                )}
              >
                💼 Pro
              </button>
              <button
                type="button"
                onClick={() => setContext('Perso')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer border',
                  context === 'Perso'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'text-muted-foreground bg-background hover:bg-accent/50 border-border'
                )}
              >
                🏠 Perso
              </button>
            </div>
          </div>

          {/* Important / Urgent toggles */}
          <div className="space-y-2">
            <Label>Importance</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCategory(categoryFromEisenhower({ ...flags, isImportant: !flags.isImportant }))}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer border',
                  flags.isImportant
                    ? 'bg-category-envie/15 text-category-envie border-category-envie/30'
                    : 'text-muted-foreground bg-background hover:bg-accent/50 border-border'
                )}
              >
                ⭐ Important
              </button>
              <button
                type="button"
                onClick={() => setCategory(categoryFromEisenhower({ ...flags, isUrgent: !flags.isUrgent }))}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer border',
                  flags.isUrgent
                    ? 'bg-category-quotidien/15 text-category-quotidien border-category-quotidien/30'
                    : 'text-muted-foreground bg-background hover:bg-accent/50 border-border'
                )}
              >
                ⚡ Urgent
              </button>
            </div>
          </div>

          {project && (
            <div className="space-y-2">
              <Label>Statut</Label>
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

          <div className="space-y-2">
            <Label htmlFor="targetDate">Date cible (optionnelle)</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {project ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
