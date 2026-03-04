import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bug, Lightbulb, Upload, X, Loader2, MessageSquarePlus, Inbox, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from 'lucide-react';
import { useSubmitBugReport, useMyReports, type BugReport } from '@/hooks/useBugReports';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BugHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Report form (tab 1) ───

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Faible', color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/30' },
  { value: 'medium', label: 'Moyen', color: 'text-yellow-600', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { value: 'high', label: 'Élevé', color: 'text-orange-600', bg: 'bg-orange-500/10 border-orange-500/30' },
  { value: 'critical', label: 'Critique', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
];

const ReportForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [type, setType] = useState<'bug' | 'feature_request'>('bug');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { submitBugReport, isSubmitting } = useSubmitBugReport();

  const handleFile = (file: File | undefined) => {
    if (!file || file.size > 5 * 1024 * 1024) return;
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const reset = () => {
    setTitle(''); setDescription(''); setType('bug'); setSeverity('medium');
    removeScreenshot();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    const success = await submitBugReport(title, description, type, severity, screenshot);
    if (success) { reset(); onSuccess(); }
  };

  return (
    <div className="space-y-5">
      {/* Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Type de signalement</Label>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setType('bug')}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
              type === 'bug' ? 'border-destructive bg-destructive/5' : 'border-border bg-muted/30 hover:bg-muted/60')}>
            <Bug className={cn('w-6 h-6', type === 'bug' ? 'text-destructive' : 'text-muted-foreground')} />
            <div>
              <div className={cn('font-semibold text-sm', type === 'bug' ? 'text-destructive' : 'text-foreground')}>🐛 Bug</div>
              <div className="text-xs text-muted-foreground mt-0.5">Quelque chose ne fonctionne pas</div>
            </div>
          </button>
          <button type="button" onClick={() => setType('feature_request')}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
              type === 'feature_request' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/60')}>
            <Lightbulb className={cn('w-6 h-6', type === 'feature_request' ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <div className={cn('font-semibold text-sm', type === 'feature_request' ? 'text-primary' : 'text-foreground')}>💡 Amélioration</div>
              <div className="text-xs text-muted-foreground mt-0.5">Une idée ou suggestion</div>
            </div>
          </button>
        </div>
      </div>

      {/* Severity */}
      {type === 'bug' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sévérité</Label>
          <div className="flex gap-2 flex-wrap">
            {SEVERITY_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setSeverity(opt.value)}
                className={cn('px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  severity === opt.value ? `${opt.bg} ${opt.color}` : 'border-border text-muted-foreground hover:border-muted-foreground')}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bug-title" className="text-sm font-medium">
            {type === 'bug' ? 'Titre du bug' : "Titre de l'amélioration"} *
          </Label>
          <span className="text-xs text-muted-foreground">{title.length}/200</span>
        </div>
        <Input id="bug-title" placeholder={type === 'bug' ? 'Ex: Le bouton ne répond pas sur mobile...' : 'Ex: Ajouter un mode sombre...'} value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bug-desc" className="text-sm font-medium">
            {type === 'bug' ? 'Étapes pour reproduire' : "Description de l'idée"} *
          </Label>
          <span className="text-xs text-muted-foreground">{description.length}/2000</span>
        </div>
        <Textarea id="bug-desc" placeholder={type === 'bug' ? '1. Aller sur...\n2. Cliquer sur...\n3. Observer que...' : "Décrivez votre idée, le problème qu'elle résoudrait..."} value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={4} />
      </div>

      {/* Screenshot */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Capture d'écran <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-36 rounded-lg border border-border" />
            <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80" onClick={removeScreenshot}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            onClick={() => fileRef.current?.click()}
            className={cn('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground hover:bg-muted/30')}>
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Cliquer</span> ou glisser une image ici</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF — max 5 Mo</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !description.trim()}
          className={type === 'feature_request' ? '' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {type === 'bug' ? '🐛 Signaler le bug' : "💡 Soumettre l'idée"}
        </Button>
      </div>
    </div>
  );
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
