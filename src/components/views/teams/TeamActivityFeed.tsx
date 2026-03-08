import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, CheckCircle2, UserPlus, PlusCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TeamActivityEntry } from '@/hooks/useTeamActivity';
import type { TeamMember } from '@/hooks/useTeams';

interface TeamActivityFeedProps {
  activities: TeamActivityEntry[];
  members: TeamMember[];
  loading: boolean;
}

const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  task_created: { icon: PlusCircle, label: 'a créé', color: 'text-primary' },
  task_completed: { icon: CheckCircle2, label: 'a terminé', color: 'text-emerald-500' },
  task_assigned: { icon: UserPlus, label: 'a été assigné à', color: 'text-blue-500' },
};

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const TeamActivityFeed: React.FC<TeamActivityFeedProps> = ({ activities, members, loading }) => {
  const [open, setOpen] = useState(false);

  if (loading && activities.length === 0) return null;
  if (activities.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Activité récente</CardTitle>
                <CardDescription className="ml-1">
                  {activities.length} événement{activities.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-1">
            {activities.slice(0, 10).map((activity) => {
              const member = members.find(m => m.user_id === activity.user_id);
              const config = actionConfig[activity.action] || actionConfig.task_created;
              const Icon = config.icon;
              const displayName = member?.profiles?.display_name || 'Membre';

              return (
                <div key={activity.id} className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/30 transition-colors">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
                  <p className="text-sm flex-1 min-w-0 truncate">
                    <span className="font-medium">{displayName}</span>
                    {' '}{config.label}{' '}
                    <span className="text-muted-foreground">{activity.entity_name || 'une tâche'}</span>
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default TeamActivityFeed;
