import React, { useState } from 'react';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTeamTasks, TeamTask } from '@/hooks/useTeamTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Plus, 
  MoreVertical, 
  Trash2, 
  UserPlus,
  CheckCircle2,
  Circle,
  Clock,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TeamMember } from '@/hooks/useTeams';

interface TeamTasksViewProps {
  onOpenTaskModal?: () => void;
}

// Helper to get display name from TeamMember
const getDisplayName = (member: TeamMember): string => {
  return member.profiles?.display_name || 'Membre';
};

const TeamTasksView: React.FC<TeamTasksViewProps> = ({ onOpenTaskModal }) => {
  const { currentTeam, teamMembers } = useTeamContext();
  const { tasks, loading, toggleComplete, deleteTask, assignTask } = useTeamTasks(currentTeam?.id ?? null);
  
  const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned'>('all');

  if (!currentTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Aucune équipe sélectionnée</h2>
        <p className="text-muted-foreground">
          Sélectionnez une équipe depuis le sélecteur de contexte pour voir les tâches partagées.
        </p>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'mine') return task.assigned_to !== null;
    if (filter === 'unassigned') return task.assigned_to === null;
    return true;
  });

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;

  const getMemberName = (userId: string | null): string | null => {
    if (!userId) return null;
    const member = teamMembers.find(m => m.user_id === userId);
    return member ? getDisplayName(member) : 'Membre';
  };

  const getMemberInitials = (userId: string | null): string => {
    const name = getMemberName(userId);
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {currentTeam.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {completedCount}/{totalCount} tâches terminées • {teamMembers.length} membres
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtres */}
          <div className="flex bg-muted/50 rounded-lg p-0.5">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'mine', label: 'Assignées' },
              { key: 'unassigned', label: 'Non assignées' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  filter === f.key 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {onOpenTaskModal && (
            <Button onClick={onOpenTaskModal} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle tâche</span>
            </Button>
          )}
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Circle className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                {filter === 'all' 
                  ? "Aucune tâche dans cette équipe"
                  : filter === 'mine'
                  ? "Aucune tâche vous est assignée"
                  : "Toutes les tâches sont assignées"}
              </p>
              {onOpenTaskModal && filter === 'all' && (
                <Button variant="outline" className="mt-4" onClick={onOpenTaskModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une tâche
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <TaskRow 
                key={task.id}
                task={task}
                teamMembers={teamMembers}
                onToggleComplete={() => toggleComplete(task.id, !task.isCompleted)}
                onDelete={() => deleteTask(task.id)}
                onAssign={(userId) => assignTask(task.id, userId)}
                getMemberName={getMemberName}
                getMemberInitials={getMemberInitials}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface TaskRowProps {
  task: TeamTask;
  teamMembers: TeamMember[];
  onToggleComplete: () => void;
  onDelete: () => void;
  onAssign: (userId: string | null) => void;
  getMemberName: (userId: string | null) => string | null;
  getMemberInitials: (userId: string | null) => string;
}

const TaskRow: React.FC<TaskRowProps> = ({ 
  task, 
  teamMembers, 
  onToggleComplete, 
  onDelete, 
  onAssign,
  getMemberName,
  getMemberInitials
}) => {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      task.isCompleted && "opacity-60"
    )}>
      <CardContent className="flex items-center gap-3 p-3">
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className="shrink-0"
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            task.isCompleted && "line-through text-muted-foreground"
          )}>
            {task.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {task.category && (
              <Badge variant="secondary" className="text-xs">
                {task.category}
              </Badge>
            )}
            {task.estimatedTime && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimatedTime}min
              </span>
            )}
          </div>
        </div>

        {/* Assignation */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5">
              {task.assigned_to ? (
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getMemberInitials(task.assigned_to)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <UserPlus className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem onClick={() => onAssign(null)}>
              <User className="w-4 h-4 mr-2" />
              Non assigné
            </DropdownMenuItem>
            {teamMembers.map(member => (
              <DropdownMenuItem 
                key={member.user_id}
                onClick={() => onAssign(member.user_id)}
              >
                <Avatar className="w-5 h-5 mr-2">
                  <AvatarFallback className="text-xs">
                    {getDisplayName(member).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {getDisplayName(member)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Menu actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default TeamTasksView;
