import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Reward } from '@/types/gamification';
import { Gift, Plus, Trash2, Lock } from 'lucide-react';

interface RewardsClaimProps {
  rewards: Reward[];
  pointsAvailable: number;
  onClaim: (reward: Reward) => Promise<boolean>;
  onCreate: (name: string, cost: number, icon: string) => Promise<void>;
  onDelete: (rewardId: string) => Promise<void>;
  onReload: () => void;
}

const ICONS = ['🎁', '☕', '🎮', '📚', '🍕', '🎬', '🌿', '🏃', '🎵', '💤'];

const RewardsClaim: React.FC<RewardsClaimProps> = ({
  rewards,
  pointsAvailable,
  onClaim,
  onCreate,
  onDelete,
  onReload,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [showConfirm, setShowConfirm] = useState<Reward | null>(null);
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newIcon, setNewIcon] = useState('🎁');

  const handleCreate = async () => {
    if (!newName.trim() || !newCost) return;
    await onCreate(newName.trim(), parseInt(newCost), newIcon);
    setNewName('');
    setNewCost('');
    setNewIcon('🎁');
    setShowCreate(false);
    onReload();
  };

  const handleClaim = async (reward: Reward) => {
    const success = await onClaim(reward);
    if (success) {
      setShowConfirm(null);
      onReload();
    }
  };

  const handleDelete = async (rewardId: string) => {
    await onDelete(rewardId);
    onReload();
  };

  return (
    <Card className="p-4 border-primary/20 h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Récompenses</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Ajouter
          </Button>
        </div>

        {rewards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Gift className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Ajoutez vos récompenses personnalisées</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {rewards.map(reward => {
            const canClaim = pointsAvailable >= reward.costPoints;
            return (
              <div key={reward.id} className={`flex items-center gap-2 p-2 rounded-lg transition-all ${canClaim ? 'bg-primary/5' : 'opacity-70'}`}>
                <span className="text-lg">{reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{reward.name}</p>
                  <p className="text-[10px] text-muted-foreground">{reward.costPoints} pts</p>
                </div>
                <div className="flex items-center gap-1">
                  {canClaim ? (
                    <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowConfirm(reward)}>
                      Claim
                    </Button>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-6 w-6 p-0"
                    onClick={() => handleDelete(reward.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle récompense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  className={`text-2xl p-1 rounded ${newIcon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'}`}
                  onClick={() => setNewIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
            <Input
              placeholder="Nom de la récompense"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Coût en points"
              value={newCost}
              onChange={e => setNewCost(e.target.value)}
              min="1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || !newCost}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm claim dialog */}
      <Dialog open={!!showConfirm} onOpenChange={() => setShowConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer</DialogTitle>
          </DialogHeader>
          <p className="text-foreground">
            Réclamer <strong>{showConfirm?.icon} {showConfirm?.name}</strong> pour <strong>{showConfirm?.costPoints} pts</strong> ?
          </p>
          <p className="text-sm text-muted-foreground">
            Solde restant : {pointsAvailable - (showConfirm?.costPoints ?? 0)} pts
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(null)}>Annuler</Button>
            <Button onClick={() => showConfirm && handleClaim(showConfirm)}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RewardsClaim;
