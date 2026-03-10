import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, Lightbulb, MessageSquarePlus, Inbox, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from 'lucide-react';
import { useMyReports, type BugReport } from '@/hooks/useBugReports';
import BugReportForm from './BugReportForm';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BugHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Report form (tab 1) ───

const ReportForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  return <BugReportForm onSuccess={onSuccess} />;
};

// ─── Reports list (tab 2) ───

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'Ouvert', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  in_progress: { label: 'En cours', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  resolved: { label: 'Résolu ✓', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  closed: { label: 'Fermé', className: 'bg-muted text-muted-foreground border-border' },
};

const severityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Faible', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  medium: { label: 'Moyen', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  high: { label: 'Élevé', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  critical: { label: 'Critique', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const ReportItem: React.FC<{ report: BugReport }> = ({ report }) => {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[report.status] || { label: report.status, className: '' };
  const severity = severityConfig[report.severity] || null;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button className="w-full flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors text-left" onClick={() => setExpanded(!expanded)}>
        <div className="mt-0.5 shrink-0">
          {report.type === 'bug' ? <Bug className="w-4 h-4 text-destructive" /> : <Lightbulb className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">{report.title}</span>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', status.className)}>{status.label}</Badge>
            {report.type === 'bug' && severity && <Badge variant="outline" className={cn('text-xs', severity.className)}>{severity.label}</Badge>}
            {report.type === 'feature_request' && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">💡 Amélioration</Badge>}
            <span className="text-xs text-muted-foreground">{format(new Date(report.created_at), 'dd MMM yyyy', { locale: fr })}</span>
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{report.description}</p>
          {report.screenshot_url && (
            <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="w-3 h-3" /> Voir la capture d'écran
            </a>
          )}
          {report.admin_notes && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-2">
              <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-primary mb-1">Réponse de l'équipe</p>
                <p className="text-sm text-foreground">{report.admin_notes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ReportsList: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'bug' | 'feature_request'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const { data: reports = [], isLoading } = useMyReports();

  const filtered = reports.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {([['all', 'Tous'], ['bug', '🐛 Bugs'], ['feature_request', '💡 Améliorations']] as const).map(([v, l]) => (
            <Button key={v} variant={typeFilter === v ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setTypeFilter(v)}>{l}</Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {([['all', 'Tous statuts'], ['open', 'Ouverts'], ['in_progress', 'En cours'], ['resolved', 'Résolus'], ['closed', 'Fermés']] as const).map(([v, l]) => (
            <Button key={v} variant={statusFilter === v ? 'secondary' : 'ghost'} size="sm" className="h-6 text-xs" onClick={() => setStatusFilter(v)}>{l}</Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm text-muted-foreground">{reports.length === 0 ? "Aucun signalement pour l'instant." : 'Aucun résultat pour ces filtres.'}</p>
          </div>
        ) : (
          filtered.map(r => <ReportItem key={r.id} report={r} />)
        )}
      </div>
    </div>
  );
};

// ─── Main BugHub ───

const BugHub: React.FC<BugHubProps> = ({ open, onOpenChange }) => {
  const { data: reports = [] } = useMyReports();
  const openCount = reports.filter(r => r.status === 'open' || r.status === 'in_progress').length;
  const [activeTab, setActiveTab] = useState('report');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Signalements & demandes</DialogTitle>
          <DialogDescription>Signalez un problème ou suivez vos demandes.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="report" className="flex-1 gap-1.5">
              <MessageSquarePlus className="w-4 h-4" /> Signaler
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5">
              <Inbox className="w-4 h-4" /> Mes demandes
              {openCount > 0 && (
                <Badge variant="outline" className="ml-1 bg-destructive/10 text-destructive border-destructive/20 text-[10px] px-1.5 py-0">
                  {openCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="flex-1 overflow-y-auto">
            <ReportForm onSuccess={() => setActiveTab('history')} />
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto">
            <ReportsList />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BugHub;


