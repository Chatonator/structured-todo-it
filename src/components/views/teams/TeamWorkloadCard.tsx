import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamMember } from '@/hooks/useTeams';

interface TeamWorkloadCardProps {
  members: TeamMember[];
  memberStats: Map<string, { assigned: number; completed: number }>;
  currentUserId: string | null;
}

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getLoadColor = (assigned: number): string => {
  if (assigned > 10) return 'text-destructive';
  if (assigned >= 5) return 'text-orange-500';
  return 'text-emerald-500';
};

const getProgressColor = (assigned: number): string => {
  if (assigned > 10) return '[&>div]:bg-destructive';
  if (assigned >= 5) return '[&>div]:bg-orange-500';
  return '[&>div]:bg-emerald-500';
};

export const TeamWorkloadCard: React.FC<TeamWorkloadCardProps> = ({ members, memberStats, currentUserId }) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Charge de travail</CardTitle>
                <CardDescription className="ml-1">
                  {members.length} membre{members.length > 1 ? 's' : ''}
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
          <CardContent className="pt-0 space-y-3">
            {members.map((member) => {
              const stats = memberStats.get(member.user_id) || { assigned: 0, completed: 0 };
              const progressValue = stats.assigned > 0 ? Math.round((stats.completed / stats.assigned) * 100) : 0;
              const displayName = member.profiles?.display_name || 'Membre';
              const isMe = member.user_id === currentUserId;

              return (
                <div key={member.user_id} className="flex items-center gap-3">
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarFallback className={cn(
                      "text-[10px]",
                      isMe ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {displayName}
                        {isMe && <span className="text-xs text-muted-foreground ml-1">(moi)</span>}
                      </span>
                      {stats.assigned > 0 ? (
                        <span className={cn("text-xs font-medium", getLoadColor(stats.assigned))}>
                          {stats.completed}/{stats.assigned}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucune tâche</span>
                      )}
                    </div>
                    {stats.assigned > 0 && (
                      <Progress
                        value={progressValue}
                        className={cn("h-1.5", getProgressColor(stats.assigned))}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default TeamWorkloadCard;
