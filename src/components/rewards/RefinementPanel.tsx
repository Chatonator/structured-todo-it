import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UnrefinedTask } from '@/types/gamification';
import { Pickaxe, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    <Card className="p-4 border-primary/20 h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pickaxe className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Travail accompli</h3>
          </div>
          {tasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {tasks.length} en attente
            </Badge>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune tâche à raffiner</p>
            <p className="text-xs text-muted-foreground/60">Complétez des tâches pour gagner des points</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {tasks.map(task => (
                <div
                  key={task.transactionId}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selected.has(task.transactionId)}
                    onCheckedChange={() => toggle(task.transactionId)}
                  />
                  <div
                    className={`w-1 h-6 rounded-full ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Autres}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate text-justify">{task.taskName}</p>
                    <p className="text-[10px] text-muted-foreground">{task.category}</p>
                  </div>
                  {task.weeksElapsed > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-destructive shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      <span>-{Math.round(task.decayPct)}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleRefine}
              disabled={refining}
              size="sm"
              className="w-full"
            >
              <Pickaxe className="w-3.5 h-3.5 mr-1.5" />
              {refining ? 'Raffinage...' : label}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default RefinementPanel;
