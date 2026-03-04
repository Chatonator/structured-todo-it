import React, { useState } from 'react';
import { useBugReportsList, useUpdateBugReport, type BugReport } from '@/hooks/useBugReports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Bug, ExternalLink, Monitor, ChevronDown, ChevronUp, Lightbulb, Sparkles, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive border-destructive/20',
  in_progress: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-600 border-green-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const severityColors: Record<string, string> = {
  low: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const severityLabels: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique',
};

/** Changelog admin sub-component */
const ChangelogAdmin: React.FC = () => {
  const { toast } = useToast();
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [updateType, setUpdateType] = useState('feature');
  const [sending, setSending] = useState(false);

  const handlePublish = async () => {
    if (!title.trim()) return;
    setSending(true);
    const { error } = await supabase.from('app_updates').insert({
      version: version.trim() || null,
      title: title.trim(),
      message: message.trim() || null,
      update_type: updateType,
    } as any);
    setSending(false);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Publié ✨', description: 'La mise à jour sera visible par tous les utilisateurs.' });
      setVersion('');
      setTitle('');
      setMessage('');
      setUpdateType('feature');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Publier une mise à jour
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Version (ex: 1.2.0)" value={version} onChange={e => setVersion(e.target.value)} className="w-32" />
          <Select value={updateType} onValueChange={setUpdateType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feature">✨ Feature</SelectItem>
              <SelectItem value="fix">🔧 Fix</SelectItem>
              <SelectItem value="improvement">⚡ Amélioration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Titre de la mise à jour *" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea placeholder="Description (optionnel)" value={message} onChange={e => setMessage(e.target.value)} rows={3} />
        <Button onClick={handlePublish} disabled={!title.trim() || sending} className="gap-2">
          <Send className="w-4 h-4" />
          Publier
        </Button>
      </CardContent>
    </Card>
  );
};

const BugReportsAdmin: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { data: bugs = [], isLoading } = useBugReportsList(statusFilter, typeFilter);
  const updateBug = useUpdateBugReport();
  const navigate = useNavigate();

  const handleStatusChange = (bug: BugReport, newStatus: string) => {
    updateBug.mutate({ id: bug.id, status: newStatus });
  };

  const handleSaveNotes = (bugId: string) => {
    updateBug.mutate({ id: bugId, admin_notes: adminNotes[bugId] ?? '' });
  };

  const bugCount = bugs.filter(b => b.type === 'bug').length;
  const featureCount = bugs.filter(b => b.type === 'feature_request').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Administration</h1>
          </div>
        </div>

        <Tabs defaultValue="bugs">
          <TabsList>
            <TabsTrigger value="bugs" className="gap-1.5">
              <Bug className="w-3.5 h-3.5" /> Bug Reports
              <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">{bugs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="changelog" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Changelog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bugs" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center mr-1">Type :</span>
                {[{ v: 'all', l: 'Tous' }, { v: 'bug', l: '🐛 Bugs' }, { v: 'feature_request', l: '💡 Améliorations' }].map(({ v, l }) => (
                  <Button key={v} variant={typeFilter === v ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(v)}>{l}</Button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center mr-1">Statut :</span>
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
                  <Button key={s} variant={statusFilter === s ? 'secondary' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
                    {s === 'all' ? 'Tous' : statusLabels[s]}
                  </Button>
                ))}
              </div>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : bugs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucun signalement trouvé.</div>
            ) : (
              <div className="space-y-3">
                {bugs.map((bug) => {
                  const isExpanded = expandedId === bug.id;
                  return (
                    <Card key={bug.id} className="overflow-hidden">
                      <CardHeader className="cursor-pointer py-3 px-4" onClick={() => setExpandedId(isExpanded ? null : bug.id)}>
                        <div className="flex items-center gap-3">
                          {bug.type === 'bug' ? <Bug className="w-4 h-4 text-destructive shrink-0" /> : <Lightbulb className="w-4 h-4 text-primary shrink-0" />}
                          <Badge className={cn(statusColors[bug.status] || '')} variant="outline">{statusLabels[bug.status] || bug.status}</Badge>
                          {bug.type === 'bug' && bug.severity && (
                            <Badge className={cn(severityColors[bug.severity] || '')} variant="outline">{severityLabels[bug.severity] || bug.severity}</Badge>
                          )}
                          <CardTitle className="text-sm font-medium flex-1 truncate">{bug.title}</CardTitle>
                          <span className="text-xs text-muted-foreground shrink-0">{format(new Date(bug.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{bug.description}</p>
                          {bug.screenshot_url && (
                            <a href={bug.screenshot_url} target="_blank" rel="noopener noreferrer">
                              <img src={bug.screenshot_url} alt="Screenshot" className="max-h-48 rounded-md border border-border hover:opacity-80 transition-opacity" />
                            </a>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {bug.page_url && <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />{bug.page_url}</span>}
                            {bug.user_agent && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{bug.user_agent.slice(0, 80)}...</span>}
                          </div>
                          <div className="flex items-center gap-3 pt-2 border-t border-border">
                            <Select value={bug.status} onValueChange={(val) => handleStatusChange(bug, val)}>
                              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Ouvert</SelectItem>
                                <SelectItem value="in_progress">En cours</SelectItem>
                                <SelectItem value="resolved">Résolu</SelectItem>
                                <SelectItem value="closed">Fermé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Textarea placeholder="Notes / réponse visible par l'utilisateur..." value={adminNotes[bug.id] ?? bug.admin_notes ?? ''} onChange={(e) => setAdminNotes((prev) => ({ ...prev, [bug.id]: e.target.value }))} rows={2} className="text-xs" />
                            <Button size="sm" variant="outline" onClick={() => handleSaveNotes(bug.id)}>Sauvegarder la réponse</Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="changelog" className="mt-4">
            <ChangelogAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BugReportsAdmin;
