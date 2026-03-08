import React, { useState, useEffect, useCallback } from 'react';
import { useBugReportsList, useUpdateBugReport, type BugReport } from '@/hooks/useBugReports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Bug, ExternalLink, Monitor, ChevronDown, ChevronUp,
  Lightbulb, Sparkles, Send, Trash2, Users, BarChart3,
  CheckCircle2, AlertTriangle, Clock, TrendingUp, Bell,
  Search, UserCircle, ListTodo, Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ─── Constants ───
const statusColors: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive border-destructive/20',
  in_progress: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-600 border-green-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
};
const statusLabels: Record<string, string> = {
  open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé',
};
const severityColors: Record<string, string> = {
  low: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};
const severityLabels: Record<string, string> = {
  low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique',
};

// ─── Admin Stats Dashboard ───
interface AdminStats {
  total_users: number;
  users_last_7d: number;
  total_bugs: number;
  open_bugs: number;
  total_suggestions: number;
  open_suggestions: number;
  total_teams: number;
  total_updates: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (!error && data) setStats(data as unknown as AdminStats);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Chargement des stats…</div>;
  if (!stats) return <div className="text-center py-8 text-muted-foreground text-sm">Impossible de charger les statistiques</div>;

  const cards = [
    { label: 'Utilisateurs', value: stats.total_users, sub: `+${stats.users_last_7d} cette semaine`, icon: Users, color: 'text-primary' },
    { label: 'Bugs ouverts', value: stats.open_bugs, sub: `${stats.total_bugs} au total`, icon: Bug, color: 'text-destructive' },
    { label: 'Suggestions', value: stats.open_suggestions, sub: `${stats.total_suggestions} au total`, icon: Lightbulb, color: 'text-primary' },
    { label: 'Équipes', value: stats.total_teams, sub: `${stats.total_updates} mises à jour`, icon: Users, color: 'text-muted-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <Card key={i}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
              <c.icon className={cn('w-4 h-4', c.color)} />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ─── Users Management ───
interface AdminUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  task_count: number;
  completed_count: number;
  habit_count: number;
  report_count: number;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_admin_users_list', { _limit: 100, _offset: 0 });
      if (!error && data) setUsers(data as unknown as AdminUser[]);
      setLoading(false);
    })();
  }, []);

  const handleNotifyUser = async (user: AdminUser) => {
    const message = prompt(`Message pour ${user.display_name || user.email} :`);
    if (!message?.trim()) return;
    const { error } = await supabase.rpc('send_admin_notification', {
      _target_user_id: user.user_id,
      _title: '📬 Message de l\'administrateur',
      _message: message.trim(),
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Notification envoyée', description: `Message envoyé à ${user.display_name || user.email}` });
    }
  };

  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (u.display_name?.toLowerCase().includes(s)) || (u.email?.toLowerCase().includes(s));
  });

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.map(user => (
          <Card key={user.user_id} className="overflow-hidden">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(user.display_name || user.email || '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.display_name || 'Sans nom'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1" title="Tâches">
                    <ListTodo className="w-3 h-3" />
                    {user.completed_count}/{user.task_count}
                  </span>
                  <span className="flex items-center gap-1" title="Habitudes">
                    <TrendingUp className="w-3 h-3" />
                    {user.habit_count}
                  </span>
                  <span className="flex items-center gap-1" title="Reports">
                    <Bug className="w-3 h-3" />
                    {user.report_count}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 hidden md:block">
                  {format(new Date(user.created_at), 'dd MMM yy', { locale: fr })}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleNotifyUser(user)} title="Envoyer une notification">
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Changelog Admin ───
const ChangelogAdmin: React.FC = () => {
  const { toast } = useToast();
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [updateType, setUpdateType] = useState('feature');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase.from('app_updates').select('*').order('created_at', { ascending: false });
    setHistory(data ?? []);
    // Pre-fill version from last published entry
    if (data && data.length > 0 && !version) {
      const lastVersion = data[0].version;
      if (lastVersion) setVersion(lastVersion);
    }
    setLoadingHistory(false);
  };

  useEffect(() => { fetchHistory(); }, []);

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
      toast({ title: 'Publié ✨' });
      setVersion(''); setTitle(''); setMessage(''); setUpdateType('feature');
      fetchHistory();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('app_updates').delete().eq('id', id);
    setHistory(prev => prev.filter(u => u.id !== id));
    toast({ title: 'Supprimé' });
  };

  const typeEmoji: Record<string, string> = { feature: '✨', fix: '🔧', improvement: '⚡' };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Publier une mise à jour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Version (ex: 1.2.0)" value={version} onChange={e => setVersion(e.target.value)} className="w-32" />
            <Select value={updateType} onValueChange={setUpdateType}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="feature">✨ Feature</SelectItem>
                <SelectItem value="fix">🔧 Fix</SelectItem>
                <SelectItem value="improvement">⚡ Amélioration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Titre *" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optionnel)" value={message} onChange={e => setMessage(e.target.value)} rows={3} />
          <Button onClick={handlePublish} disabled={!title.trim() || sending} className="gap-2">
            <Send className="w-4 h-4" />
            Publier
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune publication.</p>
          ) : (
            <div className="space-y-2">
              {history.map(u => (
                <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <span className="text-lg">{typeEmoji[u.update_type] ?? '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{u.title}</span>
                      {u.version && <Badge variant="outline" className="text-[10px] px-1.5">{u.version}</Badge>}
                    </div>
                    {u.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.message}</p>}
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{format(new Date(u.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(u.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Enhanced Bug Reports ───
const BugReportsTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: bugs = [], isLoading } = useBugReportsList(statusFilter, typeFilter);
  const updateBug = useUpdateBugReport();
  const { toast } = useToast();

  // Filter by severity + search
  const filtered = bugs.filter(b => {
    if (severityFilter !== 'all' && b.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!b.title.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(b => b.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach(id => {
      updateBug.mutate({ id, status: action });
    });
    toast({ title: `${selectedIds.size} rapport(s) mis à jour` });
    setSelectedIds(new Set());
  };

  const handleStatusChange = (bug: BugReport, newStatus: string) => {
    updateBug.mutate({ id: bug.id, status: newStatus });
  };

  const handleSaveNotes = (bug: BugReport) => {
    const notes = adminNotes[bug.id] ?? bug.admin_notes ?? '';
    updateBug.mutate({ id: bug.id, admin_notes: notes });

    // Also send notification to the user
    if (notes.trim()) {
      supabase.rpc('send_admin_notification', {
        _target_user_id: bug.user_id,
        _title: `💬 Réponse à votre ${bug.type === 'bug' ? 'bug' : 'suggestion'} : ${bug.title.slice(0, 50)}`,
        _message: notes.slice(0, 200),
        _metadata: { bug_report_id: bug.id },
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les rapports…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Type :</span>
          {[{ v: 'all', l: 'Tous' }, { v: 'bug', l: '🐛 Bugs' }, { v: 'feature_request', l: '💡 Suggestions' }].map(({ v, l }) => (
            <Button key={v} variant={typeFilter === v ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setTypeFilter(v)}>{l}</Button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Statut :</span>
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'secondary' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'Tous' : statusLabels[s]}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Sévérité :</span>
          {['all', 'low', 'medium', 'high', 'critical'].map(s => (
            <Button key={s} variant={severityFilter === s ? 'secondary' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setSeverityFilter(s)}>
              {s === 'all' ? 'Toutes' : severityLabels[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">{selectedIds.size} sélectionné(s)</span>
          <div className="flex gap-1 ml-auto">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkAction('resolved')}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Résoudre
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkAction('closed')}>
              Fermer
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkAction('in_progress')}>
              <Clock className="w-3 h-3 mr-1" /> En cours
            </Button>
          </div>
        </div>
      )}

      {/* Header with select all */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === filtered.length && filtered.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-xs text-muted-foreground">{filtered.length} rapport(s)</span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Aucun signalement trouvé.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(bug => {
            const isExpanded = expandedId === bug.id;
            return (
              <Card key={bug.id} className={cn("overflow-hidden transition-all", selectedIds.has(bug.id) && "ring-1 ring-primary/30")}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.has(bug.id)}
                      onCheckedChange={() => toggleSelect(bug.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : bug.id)}>
                      {bug.type === 'bug' ? <Bug className="w-4 h-4 text-destructive shrink-0" /> : <Lightbulb className="w-4 h-4 text-primary shrink-0" />}
                      <Badge className={cn(statusColors[bug.status] || '')} variant="outline">{statusLabels[bug.status] || bug.status}</Badge>
                      {bug.type === 'bug' && bug.severity && (
                        <Badge className={cn(severityColors[bug.severity] || '')} variant="outline">{severityLabels[bug.severity]}</Badge>
                      )}
                      <span className="text-sm font-medium flex-1 truncate">{bug.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{format(new Date(bug.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
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
                      {bug.user_agent && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{bug.user_agent.slice(0, 80)}…</span>}
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
                      <Textarea
                        placeholder="Notes / réponse (sera notifiée à l'utilisateur)…"
                        value={adminNotes[bug.id] ?? bug.admin_notes ?? ''}
                        onChange={e => setAdminNotes(prev => ({ ...prev, [bug.id]: e.target.value }))}
                        rows={2}
                        className="text-xs"
                      />
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => handleSaveNotes(bug)}>
                        <Send className="w-3 h-3" />
                        Sauvegarder & notifier
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main Admin View ───
const BugReportsAdmin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Administration</h1>
          </div>
        </div>

        {/* Stats Dashboard */}
        <AdminDashboard />

        {/* Tabs */}
        <Tabs defaultValue="bugs">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="bugs" className="gap-1.5">
              <Bug className="w-3.5 h-3.5" /> Rapports
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-3.5 h-3.5" /> Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="changelog" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Changelog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bugs" className="space-y-4 mt-4">
            <BugReportsTab />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <UsersManagement />
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
