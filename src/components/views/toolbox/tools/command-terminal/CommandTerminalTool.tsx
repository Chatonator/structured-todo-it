import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, CopyPlus, Download, Eraser, FileUp, Play, Save, Sparkles, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { loadStorage, saveStorage } from '@/lib/storage';
import { ToolProps } from '../types';
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks';
import { useUnifiedProjects } from '@/hooks/useUnifiedProjects';
import { useDecks } from '@/hooks/useDecks';
import { useHabits } from '@/hooks/useHabits';
import { useProjects } from '@/hooks/useProjects';
import { Habit } from '@/types/habit';
import { categoryFromEisenhower, eisenhowerFromCategory, SubTaskCategory, Task, TaskCategory, TaskContext } from '@/types/task';
import { COMMAND_EXAMPLES, COMMAND_RULES, COMMAND_SYNTAX, ParsedCommand, getHelpScript, parseCommandScript } from './commandLanguage';

type LogLevel = 'info' | 'success' | 'error';

interface ExecutionLog {
  lineNumber: number;
  level: LogLevel;
  message: string;
}

interface StoredScript {
  name: string;
  script: string;
  updatedAt: string;
}

const DEFAULT_SCRIPT = [
  'let sprint = "Migration design system"',
  '# Crée plusieurs objets rapidement',
  'task "Préparer la roadmap" --context pro --time 45 --category obligation --priority important',
  'project $sprint --context pro --color #0f766e --icon 🚀',
  'habit "Lire 20 minutes" --context perso --time 20 --frequency daily --icon 📚',
  'habit "Sport" --time 40 --frequency weekly --days 0,2,4 --locked true --unlock-type streak --unlock-value 7 --requires-habit "Lire 20 minutes"',
  'find task where context=pro and status=active and project=$sprint',
  'complete-many task --context pro --status active --limit 5',
  'update task "Préparer la roadmap" --time 60',
].join('\n');

const STORAGE_KEYS = {
  history: 'toolbox.commandTerminal.history',
  favorites: 'toolbox.commandTerminal.favorites',
  jsonMode: 'toolbox.commandTerminal.jsonMode',
} as const;

const SCRIPT_TEMPLATES: StoredScript[] = [
  {
    name: 'Sprint Projet',
    updatedAt: 'template',
    script: [
      'let sprint = "Projet Sprint"',
      'project $sprint --context pro --color #0f766e --icon 🚀',
      'task "Préparer backlog" --context pro --time 45 --project $sprint',
      'task "Animer sprint planning" --context pro --time 60 --project $sprint',
      'find task where project=$sprint and status=active',
    ].join('\n'),
  },
  {
    name: 'Pack Habitudes',
    updatedAt: 'template',
    script: [
      'habit "Lire 20 minutes" --context perso --time 20 --frequency daily --icon 📚',
      'habit "Sport" --context perso --time 40 --frequency weekly --days 1,3,5 --icon 💪',
      'list habit --context perso --limit 10',
    ].join('\n'),
  },
  {
    name: 'Audit IA',
    updatedAt: 'template',
    script: [
      'stats task',
      'stats project',
      'stats habit',
      'find task where status=active and context=pro',
      'list project --status active --limit 10 --json true',
    ].join('\n'),
  },
];

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

const BULK_CONFIRM_THRESHOLD = 10;
const SCRIPT_MUTATION_THRESHOLD = 12;
const CONFIRM_TOKEN = 'CONFIRM';
const MUTATING_ACTIONS = new Set([
  'create',
  'update',
  'complete',
  'plan',
  'assign',
  'delete',
  'complete-many',
  'delete-many',
  'update-many',
]);

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

function parseOptionalBoolean(value?: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseBoolean(value);
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

function parsePositiveInteger(value: string | undefined, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} invalide: ${value}`);
  }

  return parsed;
}

function requireFlag(flags: Record<string, string>, key: string, message: string): string {
  const value = flags[key];
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function buildHabitPayload(
  command: ParsedCommand,
  baseHabit?: Habit,
  decks?: Array<{ id: string; name: string }>,
  defaultDeckId?: string | null,
  availableHabits?: Habit[]
) {
  const frequency = command.flags.frequency
    ? HABIT_FREQUENCY_MAP[command.flags.frequency.toLowerCase()] || (baseHabit?.frequency ?? 'daily')
    : (baseHabit?.frequency ?? 'daily');
  const targetDays = command.flags.days ? parseDays(command.flags.days) : baseHabit?.targetDays;
  const count = command.flags.count ? parsePositiveInteger(command.flags.count, 'count') : undefined;
  const deckId = command.flags.deck
    ? resolveDeckId(command.flags.deck, decks || [], defaultDeckId ?? null)
    : (baseHabit?.deckId ?? defaultDeckId ?? null);
  const isChallenge = command.flags.challenge !== undefined
    ? parseBoolean(command.flags.challenge)
    : (baseHabit?.isChallenge ?? false);
  const isLocked = command.flags.locked !== undefined
    ? parseBoolean(command.flags.locked)
    : (baseHabit?.isLocked ?? false);
  const challengeDurationDays = isChallenge
    ? (command.flags['challenge-days']
        ? parsePositiveInteger(command.flags['challenge-days'], 'challenge-days')
        : (baseHabit?.challengeDurationDays ?? 30))
    : undefined;
  const challengeEndAction = isChallenge
    ? ((command.flags['challenge-end'] as Habit['challengeEndAction'] | undefined) ?? baseHabit?.challengeEndAction ?? 'archive')
    : undefined;
  const unlockType = isLocked
    ? ((command.flags['unlock-type'] as Habit['unlockCondition'] extends infer U ? any : never) ?? baseHabit?.unlockCondition?.type ?? 'streak')
    : undefined;
  const unlockValue = isLocked && unlockType !== 'manual'
    ? (command.flags['unlock-value']
        ? parsePositiveInteger(command.flags['unlock-value'], 'unlock-value')
        : (baseHabit?.unlockCondition?.value ?? 7))
    : undefined;
  const prerequisiteHabitName = command.flags['requires-habit'];
  const prerequisiteHabitId = isLocked && unlockType !== 'manual'
    ? (
        prerequisiteHabitName
          ? findByName((availableHabits || []).filter(habit => habit.id !== baseHabit?.id), prerequisiteHabitName)?.id
          : baseHabit?.unlockCondition?.prerequisiteHabitId
      )
    : undefined;

  if (!deckId) {
    throw new Error('Aucun deck disponible. Créez un deck ou utilisez --deck avec un id valide.');
  }

  if (frequency === 'weekly' && (!targetDays || targetDays.length === 0)) {
    throw new Error('Une habitude weekly exige --days 0,2,4');
  }

  if (frequency === 'monthly' && (!targetDays || targetDays.length === 0)) {
    throw new Error('Une habitude monthly exige --days 1,15');
  }

  if (frequency === 'x-times-per-week' && !count && !baseHabit?.timesPerWeek) {
    throw new Error('Une habitude x-week exige --count');
  }

  if (frequency === 'x-times-per-month' && !count && !baseHabit?.timesPerMonth) {
    throw new Error('Une habitude x-month exige --count');
  }

  if (isLocked && unlockType !== 'manual' && !prerequisiteHabitId) {
    throw new Error('Une habitude verrouillée exige --requires-habit "Nom"');
  }

  return {
    deckId,
    frequency,
    targetDays,
    isChallenge,
    challengeDurationDays,
    challengeEndAction,
    isLocked,
    unlockCondition: isLocked
      ? {
          type: unlockType || 'streak',
          value: unlockType === 'manual' ? undefined : unlockValue,
          prerequisiteHabitId: unlockType === 'manual' ? undefined : prerequisiteHabitId,
        }
      : undefined,
    timesPerWeek: frequency === 'x-times-per-week' ? (count || baseHabit?.timesPerWeek || 3) : undefined,
    timesPerMonth: frequency === 'x-times-per-month' ? (count || baseHabit?.timesPerMonth || 4) : undefined,
  };
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

function findByName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const normalized = name.trim().toLowerCase();
  return items.find(item => item.name.trim().toLowerCase() === normalized);
}

function parseDate(value?: string): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Date invalide. Utilisez --date YYYY-MM-DD');
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Date invalide: ${value}`);
  }

  return parsed;
}

function parseTimeValue(value?: string): string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    throw new Error('Heure invalide. Utilisez --time HH:MM');
  }

  return value;
}

function hasConfirmToken(command: ParsedCommand): boolean {
  return command.flags.confirm === CONFIRM_TOKEN;
}

function isDryRun(command: ParsedCommand): boolean {
  return parseBoolean(command.flags['dry-run']);
}

function isMutatingAction(action: ParsedCommand['action']): boolean {
  return MUTATING_ACTIONS.has(action);
}

function matchesText(name: string, text?: string): boolean {
  if (!text) {
    return true;
  }

  return name.toLowerCase().includes(text.toLowerCase());
}

function matchesStatus(isCompleted: boolean, status?: string): boolean {
  if (!status || status === 'all') {
    return true;
  }

  if (status === 'completed') {
    return isCompleted;
  }

  if (status === 'active') {
    return !isCompleted;
  }

  return true;
}

function parseLimit(value?: string): number {
  if (!value) {
    return 20;
  }

  return parsePositiveInteger(value, 'limit');
}

function formatSearchResults(title: string, items: string[], total: number): string {
  if (total === 0) {
    return `${title}: aucun résultat`;
  }

  const suffix = total > items.length ? ` (+${total - items.length} autres)` : '';
  return `${title}: ${items.join(' | ')}${suffix}`;
}

function formatInspectRecord(title: string, entries: Array<[string, string | number | boolean | undefined]>): string {
  const formatted = entries
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${String(value)}`);

  return `${title}: ${formatted.join(' | ') || 'aucune donnée'}`;
}

function formatStructuredMessage(command: ParsedCommand, log: ExecutionLog): string {
  return JSON.stringify({
    line: command.lineNumber,
    action: command.action,
    entity: command.entity ?? null,
    level: log.level,
    message: log.message,
  });
}

function normalizeStatus(value?: string): 'active' | 'completed' | 'all' {
  if (!value || value === 'all') {
    return 'all';
  }

  return value === 'completed' ? 'completed' : 'active';
}

const CommandTerminalTool: React.FC<ToolProps> = () => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [favorites, setFavorites] = useState<StoredScript[]>([]);
  const [history, setHistory] = useState<StoredScript[]>([]);
  const [jsonMode, setJsonMode] = useState(false);
  const [scriptLabel, setScriptLabel] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const tasks = useUnifiedTasks();
  const projects = useUnifiedProjects();
  const { decks, defaultDeckId } = useDecks();
  const habits = useHabits(null);
  const personalProjects = useProjects(!projects.isTeamMode);

  const parsePreview = useMemo(() => parseCommandScript(script), [script]);
  const modeLabel = projects.isTeamMode ? `Equipe: ${projects.teamName || 'active'}` : 'Personnel';
  const executionPlan = useMemo(
    () => parsePreview.commands.map((command, index) => `${index + 1}. ${command.action} ${command.entity ?? ''} ${command.label ?? ''}`.trim()),
    [parsePreview.commands]
  );

  useEffect(() => {
    setFavorites(loadStorage<StoredScript[]>(STORAGE_KEYS.favorites, []));
    setHistory(loadStorage<StoredScript[]>(STORAGE_KEYS.history, []));
    setJsonMode(loadStorage<boolean>(STORAGE_KEYS.jsonMode, false));
  }, []);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.history, history);
  }, [history]);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.jsonMode, jsonMode);
  }, [jsonMode]);

  const appendLogs = (entries: ExecutionLog[]) => {
    setLogs(previous => [...entries, ...previous].slice(0, 40));
  };

  const saveCurrentScript = (target: 'favorite' | 'history') => {
    const name = scriptLabel.trim() || `Script ${new Date().toLocaleString('fr-FR')}`;
    const entry: StoredScript = {
      name,
      script,
      updatedAt: new Date().toISOString(),
    };

    if (target === 'favorite') {
      setFavorites(previous => [entry, ...previous.filter(item => item.name !== name)].slice(0, 12));
      return;
    }

    setHistory(previous => [entry, ...previous.filter(item => item.script !== script)].slice(0, 12));
  };

  const exportScript = () => {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(scriptLabel.trim() || 'todo-it-script').replace(/\s+/g, '-').toLowerCase()}.todoit.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importScript = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const content = await file.text();
    setScript(content);
    setScriptLabel(file.name.replace(/\.[^.]+$/, ''));
    event.target.value = '';
  };

  const getTaskMatches = (command: ParsedCommand) => {
    const projectId = command.flags.project ? findByName(projects.projects, command.flags.project)?.id : undefined;
    return tasks.tasks.filter(task => (
      matchesText(task.name, command.flags.text || command.label) &&
      matchesStatus(task.isCompleted, normalizeStatus(command.flags.status)) &&
      (!command.flags.context || task.context === normalizeContext(command.flags.context)) &&
      (!command.flags.project || projectId === task.projectId)
    ));
  };

  const getProjectMatches = (command: ParsedCommand) => {
    const status = normalizeStatus(command.flags.status);
    return projects.projects.filter(project => (
      matchesText(project.name, command.flags.text || command.label) &&
      (status === 'all'
        ? true
        : status === 'completed'
          ? project.status === 'completed'
          : project.status !== 'completed')
    ));
  };

  const getHabitMatches = (command: ParsedCommand) => {
    return habits.habits.filter(habit => (
      matchesText(habit.name, command.flags.text || command.label) &&
      (!command.flags.context || habit.context === normalizeContext(command.flags.context))
    ));
  };

  const assertBulkSafety = (command: ParsedCommand, matchedCount: number) => {
    if (isDryRun(command)) {
      return;
    }

    if (command.action === 'delete' || command.action === 'delete-many') {
      if (!hasConfirmToken(command)) {
        throw new Error('Suppression bloquée. Ajoutez --confirm CONFIRM.');
      }
    }

    if (['complete-many', 'delete-many', 'update-many'].includes(command.action) && matchedCount > BULK_CONFIRM_THRESHOLD && !hasConfirmToken(command)) {
      throw new Error(`Action massive bloquée au-delà de ${BULK_CONFIRM_THRESHOLD} éléments. Ajoutez --confirm CONFIRM.`);
    }
  };

  const maybeReturnDryRun = (command: ParsedCommand, label: string, items: string[], total: number): ExecutionLog | null => {
    if (!isDryRun(command)) {
      return null;
    }

    return {
      lineNumber: command.lineNumber,
      level: 'info',
      message: `Simulation ${label}: ${formatSearchResults(`${total} élément(s)`, items, total)}`,
    };
  };

  const runCommand = async (command: ParsedCommand): Promise<ExecutionLog> => {
    if (command.action === 'help') {
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: 'Aide chargée dans l’éditeur.',
      };
    }

    if (command.action === 'schema' && command.entity === 'task') {
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: 'Schema task: requis=name,time; options=context,category,priority,important,urgent,date,time,project; defauts=context Perso, category Autres seulement si coherent.',
      };
    }

    if (command.action === 'schema' && command.entity === 'project') {
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: 'Schema project: requis=name; options=context,description,color,icon,date; defauts=icon, color, status planning.',
      };
    }

    if (command.action === 'schema' && command.entity === 'habit') {
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: 'Schema habit: requis=name; options=context,time,frequency,days,count,deck,challenge,challenge-days,challenge-end,locked,unlock-type,unlock-value,requires-habit; contraintes=weekly/monthly exigent days, x-week/x-month exigent count.',
      };
    }

    if (command.action === 'stats' && command.entity === 'task') {
      const completed = tasks.tasks.filter(task => task.isCompleted).length;
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: `Stats task: total=${tasks.tasks.length} | active=${tasks.tasks.length - completed} | completed=${completed}`,
      };
    }

    if (command.action === 'stats' && command.entity === 'project') {
      const completed = projects.projects.filter(project => project.status === 'completed').length;
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: `Stats project: total=${projects.projects.length} | active=${projects.projects.length - completed} | completed=${completed}`,
      };
    }

    if (command.action === 'stats' && command.entity === 'habit') {
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: `Stats habit: total=${habits.habits.length} | perso=${habits.habits.filter(habit => habit.context === 'Perso').length} | pro=${habits.habits.filter(habit => habit.context === 'Pro').length}`,
      };
    }

    if (command.action === 'inspect' && command.entity === 'task') {
      const task = findByName(tasks.tasks, command.label!);
      if (!task) {
        throw new Error(`Tâche introuvable: ${command.label}`);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatInspectRecord(`Task ${task.name}`, [
          ['context', task.context],
          ['category', task.category],
          ['priority', task.subCategory],
          ['time', task.estimatedTime],
          ['completed', task.isCompleted],
          ['projectId', task.projectId],
          ['projectStatus', task.projectStatus],
          ['actualTime', task.actualTime],
        ]),
      };
    }

    if (command.action === 'inspect' && command.entity === 'project') {
      const project = findByName(projects.projects, command.label!);
      if (!project) {
        throw new Error(`Projet introuvable: ${command.label}`);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatInspectRecord(`Project ${project.name}`, [
          ['status', project.status],
          ['color', project.color],
          ['icon', project.icon],
          ['progress', project.progress],
          ['targetDate', project.targetDate?.toISOString().slice(0, 10)],
          ['team', !!project.teamId],
        ]),
      };
    }

    if (command.action === 'inspect' && command.entity === 'habit') {
      const habit = findByName(habits.habits, command.label!);
      if (!habit) {
        throw new Error(`Habitude introuvable: ${command.label}`);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatInspectRecord(`Habit ${habit.name}`, [
          ['context', habit.context],
          ['frequency', habit.frequency],
          ['time', habit.estimatedTime],
          ['deckId', habit.deckId],
          ['locked', habit.isLocked],
          ['challenge', habit.isChallenge],
          ['timesPerWeek', habit.timesPerWeek],
          ['timesPerMonth', habit.timesPerMonth],
        ]),
      };
    }

    if (command.action === 'create' && command.entity === 'task') {
      const dryRun = maybeReturnDryRun(command, 'creation tâche', [command.label!], 1);
      if (dryRun) return dryRun;
      const explicitTime = requireFlag(command.flags, 'time', 'Une tâche exige --time. Aucun défaut n’est appliqué à la durée.');
      const category = normalizeCategory(command.flags);
      const subCategory = normalizePriority(command.flags.priority);
      const context = normalizeContext(command.flags.context);
      const estimatedTime = parseMinutes(explicitTime, 30);
      const eisenhower = eisenhowerFromCategory(category);
      const targetProject = command.flags.project ? findByName(projects.projects, command.flags.project) : undefined;

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
        projectId: targetProject?.id,
        projectStatus: targetProject ? 'todo' : undefined,
        isImportant: eisenhower.isImportant,
        isUrgent: eisenhower.isUrgent,
        actualTime: undefined,
        ...(tasks.isTeamMode && targetProject ? { project_id: targetProject.id } : {}),
      } satisfies Omit<Task, 'id' | 'createdAt'>);

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Tâche créée: ${command.label}`,
      };
    }

    if (command.action === 'create' && command.entity === 'project') {
      const dryRun = maybeReturnDryRun(command, 'creation projet', [command.label!], 1);
      if (dryRun) return dryRun;
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

    if (command.action === 'create' && command.entity === 'habit') {
      const dryRun = maybeReturnDryRun(command, 'creation habitude', [command.label!], 1);
      if (dryRun) return dryRun;
      const habitConfig = buildHabitPayload(command, undefined, decks, defaultDeckId, habits.habits);
      const challengeStartDate = habitConfig.isChallenge ? new Date() : undefined;
      const challengeEndDate = habitConfig.isChallenge && habitConfig.challengeDurationDays
        ? new Date(challengeStartDate!.getTime() + habitConfig.challengeDurationDays * 24 * 60 * 60 * 1000)
        : undefined;

      const created = await habits.createHabit({
        userId: '',
        name: command.label!,
        category: CATEGORY_MAP[command.flags.category?.toLowerCase() || 'quotidien'] || 'Quotidien',
        context: normalizeContext(command.flags.context),
        estimatedTime: parseMinutes(command.flags.time, 15),
        description: command.flags.description,
        deckId: habitConfig.deckId,
        frequency: habitConfig.frequency,
        timesPerWeek: habitConfig.timesPerWeek,
        timesPerMonth: habitConfig.timesPerMonth,
        targetDays: ['weekly', 'monthly', 'custom'].includes(habitConfig.frequency) ? habitConfig.targetDays : undefined,
        isActive: true,
        updatedAt: new Date(),
        order: 0,
        icon: command.flags.icon,
        color: command.flags.color,
        isChallenge: habitConfig.isChallenge,
        challengeStartDate,
        challengeEndDate,
        challengeDurationDays: habitConfig.challengeDurationDays,
        challengeEndAction: habitConfig.challengeEndAction,
        isLocked: habitConfig.isLocked,
        unlockCondition: habitConfig.unlockCondition,
      });

      if (!created) {
        throw new Error('La création de l’habitude a échoué');
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Habitude créée: ${command.label}`,
      };
    }

    if (command.action === 'update' && command.entity === 'task') {
      const existingTask = findByName(tasks.tasks, command.label!);
      if (!existingTask) {
        throw new Error(`Tâche introuvable: ${command.label}`);
      }
      const dryRun = maybeReturnDryRun(command, 'mise a jour tâche', [existingTask.name], 1);
      if (dryRun) return dryRun;

      const nextCategory = command.flags.category || command.flags.important || command.flags.urgent
        ? normalizeCategory(command.flags)
        : existingTask.category;
      const eisenhower = eisenhowerFromCategory(nextCategory);

      await tasks.updateTask(existingTask.id, {
        name: command.flags.name || existingTask.name,
        context: command.flags.context ? normalizeContext(command.flags.context) : existingTask.context,
        estimatedTime: command.flags.time ? parseMinutes(command.flags.time, existingTask.estimatedTime) : existingTask.estimatedTime,
        category: nextCategory,
        subCategory: command.flags.priority ? normalizePriority(command.flags.priority) : existingTask.subCategory,
        isImportant: eisenhower.isImportant,
        isUrgent: eisenhower.isUrgent,
      });

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Tâche mise à jour: ${existingTask.name}`,
      };
    }

    if (command.action === 'update' && command.entity === 'project') {
      const existingProject = findByName(projects.projects, command.label!);
      if (!existingProject) {
        throw new Error(`Projet introuvable: ${command.label}`);
      }
      const dryRun = maybeReturnDryRun(command, 'mise a jour projet', [existingProject.name], 1);
      if (dryRun) return dryRun;

      const success = await projects.updateProject(existingProject.id, {
        name: command.flags.name || existingProject.name,
        description: command.flags.description ?? existingProject.description,
        icon: command.flags.icon ?? existingProject.icon,
        color: command.flags.color ?? existingProject.color,
        targetDate: command.flags.date ? parseDate(command.flags.date) : existingProject.targetDate,
      } as any);

      if (!success) {
        throw new Error('La mise à jour du projet a échoué');
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Projet mis à jour: ${existingProject.name}`,
      };
    }

    if (command.action === 'update' && command.entity === 'habit') {
      const existingHabit = findByName(habits.habits, command.label!);
      if (!existingHabit) {
        throw new Error(`Habitude introuvable: ${command.label}`);
      }
      const dryRun = maybeReturnDryRun(command, 'mise a jour habitude', [existingHabit.name], 1);
      if (dryRun) return dryRun;

      const habitConfig = buildHabitPayload(command, existingHabit, decks, defaultDeckId, habits.habits);
      const challengeStartDate = habitConfig.isChallenge
        ? (existingHabit.challengeStartDate || new Date())
        : undefined;
      const challengeEndDate = habitConfig.isChallenge && habitConfig.challengeDurationDays
        ? new Date(challengeStartDate!.getTime() + habitConfig.challengeDurationDays * 24 * 60 * 60 * 1000)
        : undefined;
      const success = await habits.updateHabit(existingHabit.id, {
        name: command.flags.name || existingHabit.name,
        context: command.flags.context ? normalizeContext(command.flags.context) : existingHabit.context,
        estimatedTime: command.flags.time ? parseMinutes(command.flags.time, existingHabit.estimatedTime) : existingHabit.estimatedTime,
        description: command.flags.description ?? existingHabit.description,
        icon: command.flags.icon ?? existingHabit.icon,
        color: command.flags.color ?? existingHabit.color,
        frequency: habitConfig.frequency,
        timesPerWeek: habitConfig.timesPerWeek,
        timesPerMonth: habitConfig.timesPerMonth,
        targetDays: habitConfig.targetDays,
        isChallenge: habitConfig.isChallenge,
        challengeStartDate,
        challengeEndDate,
        challengeDurationDays: habitConfig.challengeDurationDays,
        challengeEndAction: habitConfig.challengeEndAction,
        isLocked: habitConfig.isLocked,
        unlockCondition: habitConfig.unlockCondition,
      });

      if (!success) {
        throw new Error('La mise à jour de l’habitude a échoué');
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Habitude mise à jour: ${existingHabit.name}`,
      };
    }

    if (command.action === 'complete' && command.entity === 'task') {
      const existingTask = findByName(tasks.tasks, command.label!);
      if (!existingTask) {
        throw new Error(`Tâche introuvable: ${command.label}`);
      }
      const dryRun = maybeReturnDryRun(command, 'completion tâche', [existingTask.name], 1);
      if (dryRun) return dryRun;

      if (existingTask.isCompleted) {
        return {
          lineNumber: command.lineNumber,
          level: 'info',
          message: `Tâche déjà terminée: ${existingTask.name}`,
        };
      }

      await tasks.toggleTaskCompletion(existingTask.id);
      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Tâche terminée: ${existingTask.name}`,
      };
    }

    if (command.action === 'complete' && command.entity === 'project') {
      const existingProject = findByName(projects.projects, command.label!);
      if (!existingProject) {
        throw new Error(`Projet introuvable: ${command.label}`);
      }
      const dryRun = maybeReturnDryRun(command, 'completion projet', [existingProject.name], 1);
      if (dryRun) return dryRun;

      const success = await projects.completeProject(existingProject.id);
      if (!success) {
        throw new Error('La complétion du projet a échoué');
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Projet terminé: ${existingProject.name}`,
      };
    }

    if (command.action === 'complete' && command.entity === 'habit') {
      const existingHabit = findByName(habits.habits, command.label!);
      if (!existingHabit) {
        throw new Error(`Habitude introuvable: ${command.label}`);
      }
      const dryRun = maybeReturnDryRun(command, 'completion habitude', [existingHabit.name], 1);
      if (dryRun) return dryRun;

      const success = await habits.toggleCompletion(existingHabit.id);
      if (!success) {
        throw new Error('La complétion de l’habitude a échoué');
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Habitude cochée pour aujourd’hui: ${existingHabit.name}`,
      };
    }

    if (command.action === 'plan' && command.entity === 'task') {
      const existingTask = findByName(tasks.tasks, command.label!);
      if (!existingTask) {
        throw new Error(`Tâche introuvable: ${command.label}`);
      }
      const dryRun = maybeReturnDryRun(command, 'planification tâche', [existingTask.name], 1);
      if (dryRun) return dryRun;

      const scheduledDate = parseDate(command.flags.date);
      const scheduledTime = parseTimeValue(command.flags.time);

      if (tasks.isTeamMode) {
        await tasks.updateTask(existingTask.id, {
          scheduledDate,
          scheduledTime,
        } as any);
      } else {
        await tasks.updateTask(existingTask.id, {
          _scheduleInfo: { date: scheduledDate, time: scheduledTime },
        } as any);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Tâche planifiée: ${existingTask.name}`,
      };
    }

    if (command.action === 'assign' && command.entity === 'task') {
      const existingTask = findByName(tasks.tasks, command.label!);
      if (!existingTask) {
        throw new Error(`Tâche introuvable: ${command.label}`);
      }

      const projectName = command.flags.project;
      if (!projectName) {
        throw new Error('Projet cible manquant. Utilisez --project "Nom du projet"');
      }

      const project = findByName(projects.projects, projectName);
      if (!project) {
        throw new Error(`Projet introuvable: ${projectName}`);
      }
      const dryRun = maybeReturnDryRun(command, 'affectation tâche', [`${existingTask.name} -> ${project.name}`], 1);
      if (dryRun) return dryRun;

      if (tasks.isTeamMode) {
        await tasks.updateTask(existingTask.id, {
          project_id: project.id,
          projectStatus: existingTask.projectStatus || 'todo',
        } as any);
      } else {
        const rawTask = personalProjects.projects ? tasks.tasks.find(task => task.id === existingTask.id) : existingTask;
        const success = await personalProjects.assignTaskToProject(existingTask.id, project.id, {
          category: rawTask?.category,
          context: rawTask?.context,
          estimatedTime: rawTask?.estimatedTime,
          level: rawTask?.level,
          isExpanded: rawTask?.isExpanded,
          subCategory: rawTask?.subCategory,
          projectStatus: rawTask?.projectStatus || 'todo',
          actualTime: rawTask?.actualTime,
        } as any);

        if (!success) {
          throw new Error('L’affectation au projet a échoué');
        }
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Tâche affectée au projet: ${existingTask.name} -> ${project.name}`,
      };
    }

    if (command.action === 'delete' && command.entity === 'task') {
      const existingTask = findByName(tasks.tasks, command.label!);
      if (!existingTask) {
        throw new Error(`Tâche introuvable: ${command.label}`);
      }
      assertBulkSafety(command, 1);
      const dryRun = maybeReturnDryRun(command, 'suppression tâche', [existingTask.name], 1);
      if (dryRun) return dryRun;

      await tasks.removeTask(existingTask.id);
      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Tâche supprimée: ${existingTask.name}`,
      };
    }

    if (command.action === 'delete' && command.entity === 'project') {
      const existingProject = findByName(projects.projects, command.label!);
      if (!existingProject) {
        throw new Error(`Projet introuvable: ${command.label}`);
      }
      assertBulkSafety(command, 1);
      const dryRun = maybeReturnDryRun(command, 'suppression projet', [existingProject.name], 1);
      if (dryRun) return dryRun;

      const success = await projects.deleteProject(existingProject.id);
      if (!success) {
        throw new Error('La suppression du projet a échoué');
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Projet supprimé: ${existingProject.name}`,
      };
    }

    if (command.action === 'delete' && command.entity === 'habit') {
      const existingHabit = findByName(habits.habits, command.label!);
      if (!existingHabit) {
        throw new Error(`Habitude introuvable: ${command.label}`);
      }
      assertBulkSafety(command, 1);
      const dryRun = maybeReturnDryRun(command, 'suppression habitude', [existingHabit.name], 1);
      if (dryRun) return dryRun;

      const success = await habits.deleteHabit(existingHabit.id);
      if (!success) {
        throw new Error('La suppression de l’habitude a échoué');
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: `Habitude supprimée: ${existingHabit.name}`,
      };
    }

    if (command.action === 'find' && command.entity === 'task') {
      const limit = parseLimit(command.flags.limit);
      const filteredTasks = getTaskMatches(command);

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatSearchResults(
          `${filteredTasks.length} tâche(s)`,
          filteredTasks.slice(0, limit).map(task => `${task.name} [${task.context}]`),
          filteredTasks.length
        ),
      };
    }

    if (command.action === 'find' && command.entity === 'project') {
      const limit = parseLimit(command.flags.limit);
      const filteredProjects = getProjectMatches(command);

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatSearchResults(
          `${filteredProjects.length} projet(s)`,
          filteredProjects.slice(0, limit).map(project => `${project.name} [${project.status}]`),
          filteredProjects.length
        ),
      };
    }

    if (command.action === 'find' && command.entity === 'habit') {
      const limit = parseLimit(command.flags.limit);
      const filteredHabits = getHabitMatches(command);

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatSearchResults(
          `${filteredHabits.length} habitude(s)`,
          filteredHabits.slice(0, limit).map(habit => `${habit.name} [${habit.frequency}]`),
          filteredHabits.length
        ),
      };
    }

    if (command.action === 'list' && command.entity === 'task') {
      const limit = parseLimit(command.flags.limit);
      const listedTasks = getTaskMatches({ ...command, flags: { ...command.flags, text: command.flags.text || '' } });

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatSearchResults(
          `${listedTasks.length} tâche(s)`,
          listedTasks.slice(0, limit).map(task => `${task.name} [${task.context}]`),
          listedTasks.length
        ),
      };
    }

    if (command.action === 'list' && command.entity === 'project') {
      const limit = parseLimit(command.flags.limit);
      const listedProjects = getProjectMatches({ ...command, flags: { ...command.flags, text: command.flags.text || '' } });

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatSearchResults(
          `${listedProjects.length} projet(s)`,
          listedProjects.slice(0, limit).map(project => `${project.name} [${project.status}]`),
          listedProjects.length
        ),
      };
    }

    if (command.action === 'list' && command.entity === 'habit') {
      const limit = parseLimit(command.flags.limit);
      const listedHabits = getHabitMatches({ ...command, flags: { ...command.flags, text: command.flags.text || '' } });

      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: formatSearchResults(
          `${listedHabits.length} habitude(s)`,
          listedHabits.slice(0, limit).map(habit => `${habit.name} [${habit.frequency}]`),
          listedHabits.length
        ),
      };
    }

    if (command.action === 'complete-many' && command.entity === 'task') {
      const limit = parseLimit(command.flags.limit);
      const matches = getTaskMatches(command).slice(0, limit).filter(task => !task.isCompleted);
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'completion massive tâche', matches.map(task => task.name), matches.length);
      if (dryRun) return dryRun;

      for (const task of matches) {
        await tasks.toggleTaskCompletion(task.id);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(
          `${matches.length} tâche(s) complétée(s)`,
          matches.map(task => task.name),
          matches.length
        ),
      };
    }

    if (command.action === 'complete-many' && command.entity === 'project') {
      const limit = parseLimit(command.flags.limit);
      const matches = getProjectMatches(command).slice(0, limit).filter(project => project.status !== 'completed');
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'completion massive projet', matches.map(project => project.name), matches.length);
      if (dryRun) return dryRun;

      for (const project of matches) {
        await projects.completeProject(project.id);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(`${matches.length} projet(s) terminé(s)`, matches.map(project => project.name), matches.length),
      };
    }

    if (command.action === 'complete-many' && command.entity === 'habit') {
      const limit = parseLimit(command.flags.limit);
      const matches = getHabitMatches(command).slice(0, limit);
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'completion massive habitude', matches.map(habit => habit.name), matches.length);
      if (dryRun) return dryRun;

      for (const habit of matches) {
        await habits.toggleCompletion(habit.id);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(`${matches.length} habitude(s) cochée(s)`, matches.map(habit => habit.name), matches.length),
      };
    }

    if (command.action === 'delete-many' && command.entity === 'task') {
      const limit = parseLimit(command.flags.limit);
      const matches = getTaskMatches(command).slice(0, limit);
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'suppression massive tâche', matches.map(task => task.name), matches.length);
      if (dryRun) return dryRun;

      for (const task of matches) {
        await tasks.removeTask(task.id);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(`${matches.length} tâche(s) supprimée(s)`, matches.map(task => task.name), matches.length),
      };
    }

    if (command.action === 'delete-many' && command.entity === 'project') {
      const limit = parseLimit(command.flags.limit);
      const matches = getProjectMatches(command).slice(0, limit);
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'suppression massive projet', matches.map(project => project.name), matches.length);
      if (dryRun) return dryRun;

      for (const project of matches) {
        await projects.deleteProject(project.id);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(`${matches.length} projet(s) supprimé(s)`, matches.map(project => project.name), matches.length),
      };
    }

    if (command.action === 'delete-many' && command.entity === 'habit') {
      const limit = parseLimit(command.flags.limit);
      const matches = getHabitMatches(command).slice(0, limit);
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'suppression massive habitude', matches.map(habit => habit.name), matches.length);
      if (dryRun) return dryRun;

      for (const habit of matches) {
        await habits.deleteHabit(habit.id);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(`${matches.length} habitude(s) supprimée(s)`, matches.map(habit => habit.name), matches.length),
      };
    }

    if (command.action === 'update-many' && command.entity === 'task') {
      const limit = parseLimit(command.flags.limit);
      const matches = getTaskMatches(command).slice(0, limit);
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'mise a jour massive tâche', matches.map(task => task.name), matches.length);
      if (dryRun) return dryRun;

      for (const task of matches) {
        const nextCategory = command.flags.category || command.flags.important || command.flags.urgent
          ? normalizeCategory(command.flags)
          : task.category;
        const eisenhower = eisenhowerFromCategory(nextCategory);
        await tasks.updateTask(task.id, {
          context: command.flags.context ? normalizeContext(command.flags.context) : task.context,
          estimatedTime: command.flags.time ? parseMinutes(command.flags.time, task.estimatedTime) : task.estimatedTime,
          category: nextCategory,
          subCategory: command.flags.priority ? normalizePriority(command.flags.priority) : task.subCategory,
          isImportant: eisenhower.isImportant,
          isUrgent: eisenhower.isUrgent,
        });
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(`${matches.length} tâche(s) mise(s) à jour`, matches.map(task => task.name), matches.length),
      };
    }

    if (command.action === 'update-many' && command.entity === 'project') {
      const limit = parseLimit(command.flags.limit);
      const matches = getProjectMatches(command).slice(0, limit);
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'mise a jour massive projet', matches.map(project => project.name), matches.length);
      if (dryRun) return dryRun;

      for (const project of matches) {
        await projects.updateProject(project.id, {
          color: command.flags.color ?? project.color,
          icon: command.flags.icon ?? project.icon,
          description: command.flags.description ?? project.description,
          targetDate: command.flags.date ? parseDate(command.flags.date) : project.targetDate,
        } as any);
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(`${matches.length} projet(s) mis à jour`, matches.map(project => project.name), matches.length),
      };
    }

    if (command.action === 'update-many' && command.entity === 'habit') {
      const limit = parseLimit(command.flags.limit);
      const matches = getHabitMatches(command).slice(0, limit);
      assertBulkSafety(command, matches.length);
      const dryRun = maybeReturnDryRun(command, 'mise a jour massive habitude', matches.map(habit => habit.name), matches.length);
      if (dryRun) return dryRun;

      for (const habit of matches) {
        const habitConfig = buildHabitPayload(command, habit, decks, defaultDeckId, habits.habits);
        const challengeStartDate = habitConfig.isChallenge
          ? (habit.challengeStartDate || new Date())
          : undefined;
        const challengeEndDate = habitConfig.isChallenge && habitConfig.challengeDurationDays
          ? new Date(challengeStartDate!.getTime() + habitConfig.challengeDurationDays * 24 * 60 * 60 * 1000)
          : undefined;

        await habits.updateHabit(habit.id, {
          context: command.flags.context ? normalizeContext(command.flags.context) : habit.context,
          estimatedTime: command.flags.time ? parseMinutes(command.flags.time, habit.estimatedTime) : habit.estimatedTime,
          description: command.flags.description ?? habit.description,
          icon: command.flags.icon ?? habit.icon,
          color: command.flags.color ?? habit.color,
          frequency: habitConfig.frequency,
          timesPerWeek: habitConfig.timesPerWeek,
          timesPerMonth: habitConfig.timesPerMonth,
          targetDays: habitConfig.targetDays,
          isChallenge: habitConfig.isChallenge,
          challengeStartDate,
          challengeEndDate,
          challengeDurationDays: habitConfig.challengeDurationDays,
          challengeEndAction: habitConfig.challengeEndAction,
          isLocked: habitConfig.isLocked,
          unlockCondition: habitConfig.unlockCondition,
        });
      }

      return {
        lineNumber: command.lineNumber,
        level: 'success',
        message: formatSearchResults(`${matches.length} habitude(s) mise(s) à jour`, matches.map(habit => habit.name), matches.length),
      };
    }

    throw new Error('Commande non prise en charge');
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

    const mutatingCommands = parseResult.commands.filter(command => isMutatingAction(command.action));
    if (mutatingCommands.length > SCRIPT_MUTATION_THRESHOLD && mutatingCommands.some(command => !hasConfirmToken(command))) {
      appendLogs([{
        lineNumber: 0,
        level: 'error',
        message: `Script bloqué: plus de ${SCRIPT_MUTATION_THRESHOLD} mutations sans --confirm CONFIRM.`,
      }]);
      return;
    }

    setIsRunning(true);
    const nextLogs: ExecutionLog[] = [];

    for (const command of parseResult.commands) {
      try {
        if (command.action === 'help') {
          setScript(getHelpScript());
        }
        const log = await runCommand(command);
        const shouldJson = jsonMode || parseBoolean(command.flags.json);
        nextLogs.push(shouldJson ? { ...log, message: formatStructuredMessage(command, log) } : log);
      } catch (error) {
        const fallbackLog = {
          lineNumber: command.lineNumber,
          level: 'error',
          message: error instanceof Error ? error.message : 'Erreur inattendue',
        } satisfies ExecutionLog;
        const shouldJson = jsonMode || parseBoolean(command.flags.json);
        nextLogs.push(shouldJson ? { ...fallbackLog, message: formatStructuredMessage(command, fallbackLog) } : fallbackLog);
      }
    }

    appendLogs(nextLogs.reverse());
    saveCurrentScript('history');
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
                <Input
                  value={scriptLabel}
                  onChange={(event) => setScriptLabel(event.target.value)}
                  placeholder="Nom du script"
                  className="h-8 w-40 border-slate-700 bg-slate-900 text-slate-100"
                />
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
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  onClick={() => saveCurrentScript('favorite')}
                >
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
                  onClick={() => setJsonMode(value => !value)}
                >
                  JSON
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  onClick={exportScript}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  onClick={() => importInputRef.current?.click()}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Import
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
            <input
              ref={importInputRef}
              type="file"
              accept=".txt,.todoit,.json"
              className="hidden"
              onChange={importScript}
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
            <CardTitle className="text-base">Plan d'exécution</CardTitle>
            <CardDescription>Prévisualisation multi-étapes du script courant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.keys(parsePreview.variables).length > 0 && (
              <div className="space-y-2 rounded-xl bg-muted/40 p-3">
                <p className="font-medium text-foreground">Variables</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parsePreview.variables).map(([key, value]) => (
                    <Badge key={key} variant="outline">{key}={value}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2 rounded-xl bg-muted/40 p-3">
              {executionPlan.length === 0 ? (
                <p className="text-muted-foreground">Aucune étape détectée.</p>
              ) : (
                executionPlan.map(step => (
                  <div key={step} className="font-mono text-xs text-muted-foreground">{step}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Favoris et Modèles</CardTitle>
            <CardDescription>Scripts réutilisables pour humain et IA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Modèles</p>
              <div className="grid gap-2">
                {SCRIPT_TEMPLATES.map(template => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => {
                      setScript(template.script);
                      setScriptLabel(template.name);
                    }}
                    className="rounded-xl border px-3 py-2 text-left text-sm hover:border-primary/50"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Sparkles className="h-4 w-4" />
                      {template.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Favoris</p>
              {favorites.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun favori enregistré.</p>
              ) : (
                <div className="grid gap-2">
                  {favorites.map(item => (
                    <button
                      key={`${item.name}-${item.updatedAt}`}
                      type="button"
                      onClick={() => {
                        setScript(item.script);
                        setScriptLabel(item.name);
                      }}
                      className="rounded-xl border px-3 py-2 text-left text-sm hover:border-primary/50"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString('fr-FR')}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Historique</p>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune exécution enregistrée.</p>
              ) : (
                <div className="grid gap-2">
                  {history.map(item => (
                    <button
                      key={`${item.name}-${item.updatedAt}`}
                      type="button"
                      onClick={() => {
                        setScript(item.script);
                        setScriptLabel(item.name);
                      }}
                      className="rounded-xl border px-3 py-2 text-left text-sm hover:border-primary/50"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString('fr-FR')}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Syntaxe</CardTitle>
            <CardDescription>Point d’entrée lisible pour l’utilisateur, directement dans l’outil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">task</Badge>
              <Badge variant="secondary">project</Badge>
              <Badge variant="secondary">habit</Badge>
              <Badge variant="outline">update</Badge>
              <Badge variant="outline">complete</Badge>
              <Badge variant="outline">plan</Badge>
              <Badge variant="outline">assign</Badge>
              <Badge variant="outline">delete</Badge>
              <Badge variant="outline">find</Badge>
              <Badge variant="outline">list</Badge>
              <Badge variant="outline">complete-many</Badge>
              <Badge variant="outline">update-many</Badge>
              <Badge variant="outline">delete-many</Badge>
              <Badge variant="outline">schema</Badge>
              <Badge variant="outline">inspect</Badge>
              <Badge variant="outline">stats</Badge>
              <Badge variant="outline">help</Badge>
            </div>
            <div className="space-y-2 rounded-xl bg-muted/40 p-3 font-mono text-xs">
              {COMMAND_SYNTAX.map(rule => (
                <div key={rule} className="break-all text-muted-foreground">
                  {rule}
                </div>
              ))}
            </div>
            <Separator />
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
              <p className="text-muted-foreground">`--challenge true`, `--challenge-days 30`, `--challenge-end archive|delete|convert`</p>
              <p className="text-muted-foreground">`--locked true`, `--unlock-type streak|total_completions|manual`, `--unlock-value 7`, `--requires-habit "Nom"`</p>
              <p className="text-muted-foreground">`--date YYYY-MM-DD`, `--time HH:MM`, `--project "Nom du projet"`</p>
              <p className="text-muted-foreground">`--text "mot clé"`, `--status active|completed|all`, `--limit 20`</p>
              <p className="text-muted-foreground">`--confirm CONFIRM`, `--dry-run true`</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Valeurs par défaut</p>
              <p className="text-muted-foreground">Projet: icône, couleur et statut peuvent être omis.</p>
              <p className="text-muted-foreground">Habitude: fréquence `daily`, état actif, challenge désactivé et verrouillage désactivé peuvent être implicites.</p>
              <p className="text-muted-foreground">Tâche: le nom et `--time` sont obligatoires. Aucun défaut n’est appliqué à la durée.</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium text-foreground">IA Friendly</p>
              <p className="text-muted-foreground">Utilisez `schema`, `inspect`, `stats`, `find` et `list` pour explorer le contexte sans accès au code.</p>
              <p className="text-muted-foreground">Utilisez `--dry-run true` avant une mutation, puis `--confirm CONFIRM` pour les suppressions ou gros volumes.</p>
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
