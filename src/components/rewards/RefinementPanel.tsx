import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UnrefinedTask } from '@/types/gamification';
import { Pickaxe, Clock, AlertTriangle } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Obligation: 'bg-orange-500',
  Envie: 'bg-emerald-500',
  Quotidien: 'bg-sky-500',
  Autres: 'bg-muted-foreground',
};

interface RefinementPanelProps {
  tasks: UnrefinedTask[];
  onRefine: (transactionIds?: string[]) => Promise<void>;
  onReload: () => void;
}

const RefinementPanel: React.FC<RefinementPanelProps> = ({ tasks, onRefine, onReload }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refining, setRefining] = useState(false);

  if (tasks.length === 0) return null;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefine = async () => {
    setRefining(true);
    try {
      const ids = selected.size > 0 ? Array.from(selected) : undefined;
      await onRefine(ids);
      setSelected(new Set());
      onReload();
    } finally {
      setRefining(false);
    }
  };

  const hasSelection = selected.size > 0;
  const label = hasSelection
    ? `Raffiner ${selected.size} tâche${selected.size > 1 ? 's' : ''}`
    : `Raffiner tout (${tasks.length})`;

  return (
    <Card className="p-6 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pickaxe className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Travail accompli</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {tasks.length} en attente
          </Badge>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.map(task => (
            <div
              key={task.transactionId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={selected.has(task.transactionId)}
                onCheckedChange={() => toggle(task.transactionId)}
              />
              <div
                className={`w-1 h-8 rounded-full ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Autres}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.taskName}</p>
                <p className="text-xs text-muted-foreground">{task.category}</p>
              </div>
              {task.weeksElapsed > 0 && (
                <div className="flex items-center gap-1 text-xs text-destructive shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  <span>-{Math.round(task.decayPct)}% ({task.weeksElapsed} sem.)</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleRefine}
          disabled={refining}
          className="w-full"
        >
          <Pickaxe className="w-4 h-4 mr-2" />
          {refining ? 'Raffinage...' : label}
        </Button>
      </div>
    </Card>
  );
};

export default RefinementPanel;
