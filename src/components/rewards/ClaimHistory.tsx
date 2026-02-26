import React from 'react';
import { Card } from '@/components/ui/card';
import { ClaimHistoryEntry } from '@/types/gamification';
import { History } from 'lucide-react';

interface ClaimHistoryProps {
  claims: ClaimHistoryEntry[];
}

const ClaimHistory: React.FC<ClaimHistoryProps> = ({ claims }) => {
  if (claims.length === 0) return null;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Historique des claims</h3>
      </div>

      <div className="space-y-2">
        {claims.map(claim => (
          <Card key={claim.id} className="p-3 flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{formatDate(claim.claimedAt)}</span>
            <span className="flex-1 text-sm font-medium text-foreground truncate">{claim.rewardName}</span>
            <span className="text-sm text-destructive font-medium">-{claim.costPoints} pts</span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClaimHistory;
