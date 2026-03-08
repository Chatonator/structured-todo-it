import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Users, Mail } from 'lucide-react';
import type { TeamInvitation } from '@/hooks/useTeams';

interface PendingInvitationsCardProps {
  invitations: TeamInvitation[];
  onRespond: (invitationId: string, accept: boolean) => Promise<boolean>;
}

export const PendingInvitationsCard: React.FC<PendingInvitationsCardProps> = ({ invitations, onRespond }) => {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleRespond = async (id: string, accept: boolean) => {
    setLoadingId(id);
    await onRespond(id, accept);
    setLoadingId(null);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">
            Invitation{invitations.length > 1 ? 's' : ''} en attente
          </CardTitle>
          <Badge variant="secondary" className="ml-auto">{invitations.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{inv.team_name}</p>
                <p className="text-xs text-muted-foreground">
                  Invité par {inv.inviter_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-destructive hover:text-destructive"
                onClick={() => handleRespond(inv.id, false)}
                disabled={loadingId === inv.id}
              >
                <X className="w-3.5 h-3.5" />
                Refuser
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1"
                onClick={() => handleRespond(inv.id, true)}
                disabled={loadingId === inv.id}
              >
                <Check className="w-3.5 h-3.5" />
                Accepter
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingInvitationsCard;
