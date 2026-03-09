import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CopyPlus,
  Download,
  Eraser,
  FileUp,
  Play,
  Save,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ParsedCommand } from './commandLanguage';
import { ExecutionLog, StoredScript } from './terminalTypes';

interface ParsePreview {
  commands: ParsedCommand[];
  errors: Array<{ lineNumber: number; message: string }>;
  variables: Record<string, string>;
}

interface ExecutionPlan {
  actions: string[];
  counts: Record<string, number>;
}

interface ComposerProps {
  modeLabel: string;
  parsePreview: ParsePreview;
  script: string;
  scriptLabel: string;
  jsonMode: boolean;
  isRunning: boolean;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  onScriptChange: (value: string) => void;
  onScriptLabelChange: (value: string) => void;
  onExample: () => void;
  onClear: () => void;
  onFavorite: () => void;
  onToggleJson: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onRun: () => void | Promise<void>;
}

export function TerminalComposerCard({
  modeLabel,
  parsePreview,
  script,
  scriptLabel,
  jsonMode,
  isRunning,
  importInputRef,
  onScriptChange,
  onScriptLabelChange,
  onExample,
  onClear,
  onFavorite,
  onToggleJson,
  onExport,
  onImportClick,
  onImport,
  onRun,
}: ComposerProps) {
  return (
    <Card className="border-slate-200 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.92))] text-slate-100 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-200">
            {modeLabel}
          </Badge>
          <Badge variant="outline" className="border-slate-600 bg-slate-900/70 text-slate-300">
            {parsePreview.commands.length} commandes
          </Badge>
          {parsePreview.errors.length > 0 && (
            <Badge variant="outline" className="border-rose-400/40 bg-rose-500/10 text-rose-200">
              {parsePreview.errors.length} erreurs de syntaxe
            </Badge>
          )}
        </div>
        <CardTitle className="flex items-center gap-3 text-xl text-slate-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Terminal className="h-5 w-5" />
          </div>
          Terminal de création rapide
        </CardTitle>
        <CardDescription className="text-slate-300">
          Crée des tâches, projets et habitudes en série avec un langage de commandes réutilisable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-3">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              `todo-it-cli`
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={scriptLabel}
                onChange={(event) => onScriptLabelChange(event.target.value)}
                placeholder="Nom du script"
                className="h-8 w-40 border-slate-700 bg-slate-900 text-slate-100"
              />
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" onClick={onExample}>
                <CopyPlus className="mr-2 h-4 w-4" />
                Exemple
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" onClick={onClear}>
                <Eraser className="mr-2 h-4 w-4" />
                Vider
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" onClick={onFavorite}>
                <Save className="mr-2 h-4 w-4" />
                Favori
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn(
                  'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800',
                  jsonMode && 'border-emerald-500 bg-emerald-500/15 text-emerald-200'
                )}
                onClick={onToggleJson}
              >
                JSON
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" onClick={onExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" onClick={onImportClick}>
                <FileUp className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button type="button" size="sm" className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={onRun} disabled={isRunning}>
                <Play className="mr-2 h-4 w-4" />
                {isRunning ? 'Exécution...' : 'Exécuter'}
              </Button>
            </div>
          </div>

          <Textarea
            value={script}
            onChange={(event) => onScriptChange(event.target.value)}
            placeholder='task "Nom de la tâche" --context perso --time 30'
            className="min-h-[360px] resize-none border-0 bg-transparent p-0 font-mono text-[13px] leading-6 text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
          />
          <input
            ref={importInputRef}
            type="file"
            accept=".txt,.todoit,.json"
            className="hidden"
            onChange={onImport}
          />
        </div>

        {parsePreview.errors.length > 0 && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
            {parsePreview.errors.map(error => (
              <div key={`${error.lineNumber}-${error.message}`} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Ligne {error.lineNumber}: {error.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SummaryProps {
  parsePreview: ParsePreview;
  executionPlan: ExecutionPlan;
}

export function ScriptSummaryCard({ parsePreview, executionPlan }: SummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resume du script</CardTitle>
        <CardDescription>Ce que le script va faire, en langage simple.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-xl border bg-muted/30 p-3 text-muted-foreground">
          Cette zone sert juste a verifier rapidement ton script avant execution. Elle traduit le script en actions
          lisibles, sans montrer tout le detail technique.
        </div>
        <div className="space-y-2">
          <p className="font-medium">
            {parsePreview.commands.length === 0 ? 'Aucune action detectee' : `${parsePreview.commands.length} action(s) detectee(s)`}
          </p>
          {Object.keys(executionPlan.counts).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(executionPlan.counts).map(([action, count]) => (
                <Badge key={action} variant="outline">{action}: {count}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2 rounded-xl bg-muted/40 p-3">
          {executionPlan.actions.length === 0 ? (
            <p className="text-muted-foreground">Aucune etape detectee.</p>
          ) : (
            executionPlan.actions.map((step, index) => (
              <div key={`${index}-${step}`} className="text-sm text-muted-foreground">
                {index + 1}. {step}
              </div>
            ))
          )}
        </div>
        {Object.keys(parsePreview.variables).length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-start">Voir les variables techniques</Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-2 rounded-xl bg-muted/40 p-3">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parsePreview.variables).map(([key, value]) => (
                    <Badge key={key} variant="outline">{key}={value}</Badge>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

interface LibraryProps {
  templates: StoredScript[];
  favorites: StoredScript[];
  history: StoredScript[];
  onLoad: (item: StoredScript) => void;
}

export function ScriptLibraryCard({ templates, favorites, history, onLoad }: LibraryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Scripts</CardTitle>
        <CardDescription>Modèles, favoris et historique au même endroit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Modèles</TabsTrigger>
            <TabsTrigger value="favorites">Favoris</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="space-y-2">
            <div className="grid gap-2">
              {templates.map(template => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => onLoad(template)}
                  className="rounded-xl border px-3 py-2 text-left text-sm hover:border-primary/50"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4" />
                    {template.name}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="favorites" className="space-y-2">
            {favorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun favori enregistré.</p>
            ) : (
              <div className="grid gap-2">
                {favorites.map(item => (
                  <button
                    key={`${item.name}-${item.updatedAt}`}
                    type="button"
                    onClick={() => onLoad(item)}
                    className="rounded-xl border px-3 py-2 text-left text-sm hover:border-primary/50"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString('fr-FR')}</div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="history" className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune exécution enregistrée.</p>
            ) : (
              <div className="grid gap-2">
                {history.map(item => (
                  <button
                    key={`${item.name}-${item.updatedAt}`}
                    type="button"
                    onClick={() => onLoad(item)}
                    className="rounded-xl border px-3 py-2 text-left text-sm hover:border-primary/50"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString('fr-FR')}</div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface GuideProps {
  syntax: string[];
  rules: string[];
  externalAiPrompt: string;
  onCopyPrompt: () => void | Promise<void>;
}

export function GuideCard({ syntax, rules, externalAiPrompt, onCopyPrompt }: GuideProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Guide</CardTitle>
        <CardDescription>Version allégée pour tester le terminal plus vite.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Tabs defaultValue="essentiel" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="essentiel">Essentiel</TabsTrigger>
            <TabsTrigger value="avance">Avancé</TabsTrigger>
            <TabsTrigger value="ia">IA</TabsTrigger>
          </TabsList>
          <TabsContent value="essentiel" className="space-y-3">
            <div className="space-y-2 rounded-xl bg-muted/40 p-3 font-mono text-xs">
              <div>project "Nom" [--context pro|perso]</div>
              <div>task "Nom" --time 30 [--context pro|perso] [--project "Nom"]</div>
              <div>habit "Nom" --time 20 [--frequency daily|weekly|monthly]</div>
              <div>find task --text mot</div>
              <div>list project --status active</div>
            </div>
            <div className="space-y-2 text-muted-foreground">
              <p>Pour bien tester, commence par `project`, `task`, `habit`, `find`, `list`.</p>
              <p>Tâche: `--time` est obligatoire.</p>
              <p>Suppression: ajoute toujours `--confirm CONFIRM`.</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Parcours de test</p>
              <div className="space-y-2 rounded-xl bg-muted/40 p-3 font-mono text-xs">
                <div>1. project "Projet test" --context pro</div>
                <div>2. task "Tâche test" --time 30 --context pro --project "Projet test"</div>
                <div>3. habit "Habitude test" --time 15 --context perso --frequency daily</div>
                <div>4. find task --text test</div>
                <div>5. inspect task "Tâche test"</div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="avance" className="space-y-3">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-start">Voir la syntaxe complète</Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <div className="space-y-2 rounded-xl bg-muted/40 p-3 font-mono text-xs">
                  {syntax.map(rule => (
                    <div key={rule} className="break-all text-muted-foreground">
                      {rule}
                    </div>
                  ))}
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  {rules.map(rule => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
            <div className="space-y-2 text-muted-foreground">
              <p>`where`: `find task where context=perso and status=active`</p>
              <p>Variables: `let maison = "Maison"` puis `$maison`</p>
              <p>Massif: `complete-many`, `update-many`, `delete-many` avec `--dry-run true` avant.</p>
            </div>
          </TabsContent>
          <TabsContent value="ia" className="space-y-3">
            <div className="space-y-2 text-muted-foreground">
              <p>Explore le contexte via `schema`, `inspect`, `stats`, `find`, `list`.</p>
              <p>Utilise `--json true` ou le bouton `JSON` pour des réponses structurées.</p>
              <p>Utilise `--dry-run true` avant mutation, puis `--confirm CONFIRM` si nécessaire.</p>
            </div>
            <div className="space-y-3 rounded-xl bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">Prompt IA externe</p>
                <Button type="button" variant="outline" size="sm" onClick={onCopyPrompt}>
                  <CopyPlus className="mr-2 h-4 w-4" />
                  Copier
                </Button>
              </div>
              <Textarea
                value={externalAiPrompt}
                readOnly
                className="min-h-[220px] resize-none bg-background font-mono text-xs"
              />
            </div>
            <div className="space-y-2 rounded-xl bg-muted/40 p-3 font-mono text-xs">
              <div>schema habit</div>
              <div>inspect task "Faire la vaisselle"</div>
              <div>stats project</div>
              <div>find task where context=perso and status=active --json true</div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface LogsProps {
  logs: ExecutionLog[];
  styles: Record<ExecutionLog['level'], string>;
  labels: Record<ExecutionLog['level'], string>;
}

export function ExecutionLogCard({ logs, styles, labels }: LogsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Journal</CardTitle>
        <CardDescription>Résultat des dernières exécutions, ligne par ligne.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-3">
          <div className="space-y-2">
            {logs.length === 0 && (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Aucune exécution pour le moment.
              </div>
            )}
            {logs.map((log, index) => (
              <div
                key={`${log.lineNumber}-${index}-${log.message}`}
                className={cn('rounded-xl border px-3 py-2 text-sm', styles[log.level])}
              >
                <div className="flex items-start gap-2">
                  {log.level === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : log.level === 'error' ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <Terminal className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div>
                    <div className="font-medium">
                      {labels[log.level]} {log.lineNumber > 0 ? `· ligne ${log.lineNumber}` : ''}
                    </div>
                    <div>{log.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
