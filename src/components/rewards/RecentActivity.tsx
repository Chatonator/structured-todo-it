import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { XpTransaction, TransactionMetadata } from '@/types/gamification';
import { Activity, TrendingUp } from 'lucide-react';
import { logger } from '@/lib/logger';

interface RecentActivityProps {
  userId: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ userId }) => {
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('xp_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const formatted = (data || []).map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          sourceType: t.source_type,
          sourceId: t.source_id,
          xpGained: t.xp_gained,
          pointsGained: t.points_gained,
          description: t.description,
          metadata: t.metadata,
          isRefined: t.is_refined ?? false,
          refinedAt: t.refined_at ? new Date(t.refined_at) : null,
          createdAt: new Date(t.created_at),
        }));

        setTransactions(formatted);
      } catch (error: any) {
        logger.error('Failed to load transactions', { error: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'task': return '✅';
      case 'habit': return '💪';
      case 'streak_bonus': return '🔥';
      default: return '📊';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  const getFormulaDetail = (meta: TransactionMetadata | null) => {
    if (!meta?.formula) return null;
    const parts = [];
    if (meta.quadrantLabel) parts.push(meta.quadrantLabel);
    if (meta.bonusType !== 'none') {
      const labels: Record<string, string> = {
        'anti-zombie': '🧟 Anti-zombie',
        'deadline': '⏰ Deadline',
      };
      parts.push(labels[meta.bonusType] || meta.bonusType);
    }
    if (meta.capped) parts.push('⛔ Plafonné');
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Activité récente</h3>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucune activité récente</p>
          <p className="text-sm text-muted-foreground mt-1">Complétez des tâches pour gagner des points !</p>
        </div>
      )}

      {transactions.map(transaction => {
        const meta = transaction.metadata as TransactionMetadata | null;
        const detail = getFormulaDetail(meta);

        return (
          <Card key={transaction.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{getSourceIcon(transaction.sourceType)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{transaction.description || 'Activité'}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(transaction.createdAt)}</p>
                {detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
                )}
                {meta?.formula && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{meta.formula}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm font-semibold ${transaction.xpGained > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {transaction.xpGained > 0 ? `+${transaction.xpGained}` : '0'} pts
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default RecentActivity;
