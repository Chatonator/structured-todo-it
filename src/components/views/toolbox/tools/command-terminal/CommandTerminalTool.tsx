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

const DEFAULT_SCRIPT = [
  '# Crée plusieurs objets rapidement',
  'task "Préparer la roadmap" --context pro --time 45 --category obligation --priority important',
  'project "Migration design system" --context pro --color #0f766e --icon 🚀',
  'habit "Lire 20 minutes" --context perso --time 20 --frequency daily --icon 📚',
  'habit "Sport" --time 40 --frequency weekly --days 0,2,4 --locked true --unlock-type streak --unlock-value 7 --requires-habit "Lire 20 minutes"',
  'update task "Préparer la roadmap" --time 60',
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

const CommandTerminalTool: React.FC<ToolProps> = () => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tasks = useUnifiedTasks();
  const projects = useUnifiedProjects();
  const { decks, defaultDeckId } = useDecks();
  const habits = useHabits(null);
  const personalProjects = useProjects(!projects.isTeamMode);

  const parsePreview = useMemo(() => parseCommandScript(script), [script]);
  const modeLabel = projects.isTeamMode ? `Equipe: ${projects.teamName || 'active'}` : 'Personnel';

  const appendLogs = (entries: ExecutionLog[]) => {
    setLogs(previous => [...entries, ...previous].slice(0, 40));
  };

  const runCommand = async (command: ParsedCommand): Promise<ExecutionLog> => {
    if (command.action === 'help') {
      return {
        lineNumber: command.lineNumber,
        level: 'info',
        message: 'Aide chargée dans l’éditeur.',
      };
    }

    if (command.action === 'create' && command.entity === 'task') {
      const explicitTime = requireFlag(command.flags, 'time', 'Une tâche exige --time. Aucun défaut n’est appliqué à la durée.');
      const category = normalizeCategory(command.flags);
      const subCategory = normalizePriority(command.flags.priority);
      const context = normalizeContext(command.flags.context);
      const estimatedTime = parseMinutes(explicitTime, 30);
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

    if (command.action === 'create' && command.entity === 'project') {
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

    setIsRunning(true);
    const nextLogs: ExecutionLog[] = [];

    for (const command of parseResult.commands) {
      try {
        if (command.action === 'help') {
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
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Valeurs par défaut</p>
              <p className="text-muted-foreground">Projet: icône, couleur et statut peuvent être omis.</p>
              <p className="text-muted-foreground">Habitude: fréquence `daily`, état actif, challenge désactivé et verrouillage désactivé peuvent être implicites.</p>
              <p className="text-muted-foreground">Tâche: le nom et `--time` sont obligatoires. Aucun défaut n’est appliqué à la durée.</p>
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
