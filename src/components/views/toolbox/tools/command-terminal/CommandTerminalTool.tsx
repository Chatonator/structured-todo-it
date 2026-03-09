import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CopyPlus, Eraser, Play, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ToolProps } from '../types';
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks';
import { useUnifiedProjects } from '@/hooks/useUnifiedProjects';
import { useDecks } from '@/hooks/useDecks';
import { useHabits } from '@/hooks/useHabits';
import { Habit } from '@/types/habit';
import { categoryFromEisenhower, eisenhowerFromCategory, SubTaskCategory, Task, TaskCategory, TaskContext } from '@/types/task';
import { COMMAND_EXAMPLES, COMMAND_RULES, ParsedCommand, getHelpScript, parseCommandScript } from './commandLanguage';

type LogLevel = 'info' | 'success' | 'error';

interface ExecutionLog {
  lineNumber: number;
  level: LogLevel;
  message: string;
}

const DEFAULT_SCRIPT = [
  '# Crée plusieurs objets rapidement',
  'task "Préparer la roadmap" --context pro --time 45 --category obligation --priority important',
  'project "Migration design system" --context pro --color #0f766e --icon 🚀',
  'habit "Lire 20 minutes" --context perso --time 20 --frequency daily --icon 📚',
].join('\n');

const PRIORITY_MAP: Record<string, SubTaskCategory> = {
  critical: 'Le plus important',
  highest: 'Le plus important',
  important: 'Important',
  later: 'Peut attendre',
  optional: 'Si j\'ai le temps',
};

const CATEGORY_MAP: Record<string, TaskCategory> = {
  obligation: 'Obligation',
  quotidien: 'Quotidien',
  envie: 'Envie',
  autres: 'Autres',
  optional: 'Autres',
};

const CONTEXT_MAP: Record<string, TaskContext> = {
  pro: 'Pro',
  perso: 'Perso',
  personal: 'Perso',
};

const HABIT_FREQUENCY_MAP: Record<string, Habit['frequency']> = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  custom: 'custom',
  'x-week': 'x-times-per-week',
  'x-times-per-week': 'x-times-per-week',
  'x-month': 'x-times-per-month',
  'x-times-per-month': 'x-times-per-month',
};

const LOG_STYLES: Record<LogLevel, string> = {
  info: 'border-slate-300/60 bg-slate-50 text-slate-700',
  success: 'border-emerald-300/60 bg-emerald-50 text-emerald-700',
  error: 'border-rose-300/60 bg-rose-50 text-rose-700',
};

const LOG_LABELS: Record<LogLevel, string> = {
  info: 'Info',
  success: 'OK',
  error: 'Erreur',
};

function normalizeContext(value?: string): TaskContext {
  if (!value) {
    return 'Perso';
  }

  return CONTEXT_MAP[value.toLowerCase()] || 'Perso';
}

function normalizeCategory(flags: Record<string, string>): TaskCategory {
  const categoryFlag = flags.category?.toLowerCase();
  if (categoryFlag && CATEGORY_MAP[categoryFlag]) {
    return CATEGORY_MAP[categoryFlag];
  }

  const important = parseBoolean(flags.important);
  const urgent = parseBoolean(flags.urgent);
  return categoryFromEisenhower({ isImportant: important, isUrgent: urgent });
}

function normalizePriority(value?: string): SubTaskCategory | undefined {
  if (!value) {
    return undefined;
  }

  return PRIORITY_MAP[value.toLowerCase()];
}

function parseBoolean(value?: string): boolean {
  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'oui'].includes(value.toLowerCase());
}

function parseMinutes(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Durée invalide: ${value}`);
  }

  return parsed;
}

function parseDays(value?: string): number[] | undefined {
  if (!value) {
    return undefined;
  }

  const days = value
    .split(',')
    .map(part => Number(part.trim()))
    .filter(day => Number.isInteger(day));

  if (days.length === 0) {
    throw new Error(`Jours invalides: ${value}`);
  }

  return Array.from(new Set(days));
}

function resolveDeckId(flagValue: string | undefined, decks: Array<{ id: string; name: string }>, defaultDeckId: string | null): string | null {
  if (!flagValue || flagValue === 'default') {
    return defaultDeckId;
  }

  const lower = flagValue.toLowerCase();
  const byId = decks.find(deck => deck.id === flagValue);
  if (byId) {
    return byId.id;
  }

  const byName = decks.find(deck => deck.name.toLowerCase() === lower);
  return byName?.id ?? null;
}

const CommandTerminalTool: React.FC<ToolProps> = () => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tasks = useUnifiedTasks();
  const projects = useUnifiedProjects();
  const { decks, defaultDeckId } = useDecks();
  const habits = useHabits(null);

  const parsePreview = useMemo(() => parseCommandScript(script), [script]);
  const modeLabel = projects.isTeamMode ? `Equipe: ${projects.teamName || 'active'}` : 'Personnel';

  const appendLogs = (entries: ExecutionLog[]) => {
    setLogs(previous => [...entries, ...previous].slice(0, 40));
  };

  const runCommand = async (command: ParsedCommand): Promise<ExecutionLog> => {
    if (command.kind === 'help') {
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: 'Aide chargée dans l’éditeur.',
      };
    }

    if (command.kind === 'task') {
      const category = normalizeCategory(command.flags);
      const subCategory = normalizePriority(command.flags.priority);
      const context = normalizeContext(command.flags.context);
      const estimatedTime = parseMinutes(command.flags.time, 30);
      const eisenhower = eisenhowerFromCategory(category);

      await tasks.addTask({
        name: command.label!,
        category,
        subCategory,
        context,
        estimatedTime,
        parentId: undefined,
        level: 0,
        isExpanded: true,
        isCompleted: false,
        duration: undefined,
        projectId: undefined,
        projectStatus: undefined,
        isImportant: eisenhower.isImportant,
        isUrgent: eisenhower.isUrgent,
        actualTime: undefined,
      } satisfies Omit<Task, 'id' | 'createdAt'>);

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Tâche créée: ${command.label}`,
      };
    }

    if (command.kind === 'project') {
      const category = normalizeCategory(command.flags);
      const eisenhower = eisenhowerFromCategory(category);
      const created = await projects.createProject(
        command.label!,
        command.flags.description,
        command.flags.icon,
        command.flags.color,
        normalizeContext(command.flags.context),
        eisenhower.isImportant,
        eisenhower.isUrgent
      );

      if (!created) {
        throw new Error('La création du projet a échoué');
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Projet créé: ${command.label}`,
      };
    }

    const frequency = HABIT_FREQUENCY_MAP[command.flags.frequency?.toLowerCase() || 'daily'] || 'daily';
    const targetDays = parseDays(command.flags.days);
    const count = command.flags.count ? Number(command.flags.count) : undefined;
    const deckId = resolveDeckId(command.flags.deck, decks, defaultDeckId);

    if (!deckId) {
      throw new Error('Aucun deck disponible. Créez un deck ou utilisez --deck avec un id valide.');
    }

    const created = await habits.createHabit({
      userId: '',
      name: command.label!,
      category: CATEGORY_MAP[command.flags.category?.toLowerCase() || 'quotidien'] || 'Quotidien',
      context: normalizeContext(command.flags.context),
      estimatedTime: parseMinutes(command.flags.time, 15),
      description: command.flags.description,
      deckId,
      frequency,
      timesPerWeek: frequency === 'x-times-per-week' ? count || 3 : undefined,
      timesPerMonth: frequency === 'x-times-per-month' ? count || 4 : undefined,
      targetDays: ['weekly', 'monthly', 'custom'].includes(frequency) ? targetDays : undefined,
      isActive: true,
      updatedAt: new Date(),
      order: 0,
      icon: command.flags.icon,
      color: command.flags.color,
      isChallenge: false,
      challengeStartDate: undefined,
      challengeEndDate: undefined,
      challengeDurationDays: undefined,
      challengeEndAction: undefined,
      isLocked: false,
      unlockCondition: undefined,
    });

    if (!created) {
      throw new Error('La création de l’habitude a échoué');
    }

    return {
      lineNumber: command.lineNumber,
      level: 'success',
      message: `Habitude créée: ${command.label}`,
    };
  };

  const handleRun = async () => {
    const parseResult = parseCommandScript(script);

    if (parseResult.errors.length > 0) {
      appendLogs(parseResult.errors.map(error => ({
        lineNumber: error.lineNumber,
        level: 'error',
        message: error.message,
      })));
      return;
    }

    if (parseResult.commands.length === 0) {
      appendLogs([{ lineNumber: 0, level: 'info', message: 'Aucune commande à exécuter.' }]);
      return;
    }

    setIsRunning(true);
    const nextLogs: ExecutionLog[] = [];

    for (const command of parseResult.commands) {
      try {
        if (command.kind === 'help') {
          setScript(getHelpScript());
        }
        const log = await runCommand(command);
        nextLogs.push(log);
      } catch (error) {
        nextLogs.push({
          lineNumber: command.lineNumber,
          level: 'error',
          message: error instanceof Error ? error.message : 'Erreur inattendue',
        });
      }
    }

    appendLogs(nextLogs.reverse());
    setIsRunning(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  onClick={() => setScript(DEFAULT_SCRIPT)}
                >
                  <CopyPlus className="mr-2 h-4 w-4" />
                  Exemple
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  onClick={() => setScript('')}
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Vider
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  onClick={handleRun}
                  disabled={isRunning}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isRunning ? 'Exécution...' : 'Exécuter'}
                </Button>
              </div>
            </div>

            <Textarea
              value={script}
              onChange={(event) => setScript(event.target.value)}
              placeholder='task "Nom de la tâche" --context perso --time 30'
              className="min-h-[360px] resize-none border-0 bg-transparent p-0 font-mono text-[13px] leading-6 text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
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

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Règles du langage</CardTitle>
            <CardDescription>Première version pensée pour la création rapide et en masse.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">task</Badge>
              <Badge variant="secondary">project</Badge>
              <Badge variant="secondary">habit</Badge>
              <Badge variant="outline">help</Badge>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              {COMMAND_RULES.map(rule => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Codes utiles</p>
              <p className="text-muted-foreground">`--context pro|perso`, `--category obligation|quotidien|envie|autres`, `--priority critical|important|later|optional`</p>
              <p className="text-muted-foreground">`--frequency daily|weekly|monthly|custom|x-week|x-month`, `--days 0,2,4`, `--count 3`, `--deck default`</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Exemples</CardTitle>
            <CardDescription>Ces lignes sont directement exécutables.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 rounded-xl bg-muted/40 p-3 font-mono text-xs">
              {COMMAND_EXAMPLES.map(example => (
                <div key={example} className="break-all text-muted-foreground">
                  {example}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                    className={cn('rounded-xl border px-3 py-2 text-sm', LOG_STYLES[log.level])}
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
                          {LOG_LABELS[log.level]} {log.lineNumber > 0 ? `· ligne ${log.lineNumber}` : ''}
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
      </div>
    </div>
  );
};

export default CommandTerminalTool;
