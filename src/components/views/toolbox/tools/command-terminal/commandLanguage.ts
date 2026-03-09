export type CommandEntity = 'task' | 'project' | 'habit';
export type CommandAction = 'create' | 'update' | 'complete' | 'plan' | 'assign' | 'delete' | 'find' | 'list' | 'complete-many' | 'delete-many' | 'update-many' | 'help';

export interface ParsedCommand {
  lineNumber: number;
  raw: string;
  action: CommandAction;
  entity?: CommandEntity;
  label?: string;
  flags: Record<string, string>;
}

export interface ParseError {
  lineNumber: number;
  message: string;
  raw: string;
}

export interface ParseResult {
  commands: ParsedCommand[];
  errors: ParseError[];
}

export const COMMAND_EXAMPLES = [
  'task "Préparer le sprint" --context pro --time 45 --category obligation --priority important',
  'project "Refonte site vitrine" --context pro --description "Landing + contenu" --color #0f766e --icon 🚀',
  'habit "Lire 20 minutes" --context perso --time 20 --frequency daily --icon 📚',
  'habit "Sport" --frequency weekly --days 0,2,4 --deck default',
  'update task "Préparer le sprint" --name "Préparer le sprint Q2" --time 60',
  'complete project "Refonte site vitrine"',
  'plan task "Préparer le sprint Q2" --date 2026-03-10 --time 14:30',
  'assign task "Préparer le sprint Q2" --project "Refonte site vitrine"',
  'delete habit "Lire 20 minutes"',
  'find task --text sprint --context pro --status active',
  'list project --status completed --limit 10',
  'complete-many task --context pro --status active --limit 5',
  'update-many task --project "Migration design system" --priority important',
  'delete-many habit --text test --limit 3',
];

export const COMMAND_RULES = [
  'Une commande par ligne.',
  'Les commentaires commencent par #.',
  'Les noms avec espaces doivent être entre guillemets.',
  'Les options utilisent le format --cle valeur.',
  'Les alias t, p et h sont acceptés.',
  'Les actions disponibles sont create implicite, update, complete, plan, assign, delete, find, list, complete-many, delete-many et update-many.',
  'Les tâches exigent une durée explicite à la création: --time est obligatoire.',
  'Les valeurs par défaut ne sont utilisées que si elles restent cohérentes avec les règles métier.',
  'Les commandes de masse utilisent les mêmes filtres que find/list.',
];

export const COMMAND_SYNTAX = [
  'task "Nom" [--context pro|perso] [--time 30] [--category obligation|quotidien|envie|autres] [--priority critical|important|later|optional]',
  'project "Nom" [--context pro|perso] [--description "..."] [--color #hex] [--icon 🚀]',
  'habit "Nom" [--context pro|perso] [--time 15] [--frequency daily|weekly|monthly|custom|x-week|x-month] [--days 0,2,4] [--count 3] [--deck default]',
  'update task|project|habit "Nom existant" [options de création ou --name "Nouveau nom"]',
  'complete task|project|habit "Nom existant"',
  'plan task "Nom existant" --date YYYY-MM-DD --time HH:MM',
  'assign task "Nom existant" --project "Nom du projet"',
  'delete task|project|habit "Nom existant"',
  'find task|project|habit [--text "mot"] [--context pro|perso] [--status active|completed|all] [--project "Nom"] [--limit 20]',
  'list task|project|habit [--status active|completed|all] [--limit 20]',
  'complete-many task|project|habit [--text "mot"] [--context pro|perso] [--status active|completed|all] [--project "Nom"] [--limit 20]',
  'delete-many task|project|habit [--text "mot"] [--context pro|perso] [--status active|completed|all] [--project "Nom"] [--limit 20]',
  'update-many task|project|habit [filtres] [champs à modifier]',
];

const ENTITY_ALIASES: Record<string, CommandEntity> = {
  task: 'task',
  tasks: 'task',
  t: 'task',
  project: 'project',
  projects: 'project',
  p: 'project',
  habit: 'habit',
  habits: 'habit',
  h: 'habit',
};

const ACTION_ALIASES: Record<string, CommandAction> = {
  update: 'update',
  complete: 'complete',
  plan: 'plan',
  assign: 'assign',
  delete: 'delete',
  find: 'find',
  list: 'list',
  'complete-many': 'complete-many',
  'delete-many': 'delete-many',
  'update-many': 'update-many',
  help: 'help',
};

export function getHelpScript(): string {
  return [
    '# Syntaxe',
    ...COMMAND_SYNTAX,
    '',
    '# Exemples',
    ...COMMAND_EXAMPLES,
  ].join('\n');
}

export function parseCommandScript(script: string): ParseResult {
  const commands: ParsedCommand[] = [];
  const errors: ParseError[] = [];

  script.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    try {
      const parsed = parseCommandLine(trimmed, lineNumber);
      commands.push(parsed);
    } catch (error) {
      errors.push({
        lineNumber,
        raw: rawLine,
        message: error instanceof Error ? error.message : 'Erreur de syntaxe',
      });
    }
  });

  return { commands, errors };
}

function parseCommandLine(line: string, lineNumber: number): ParsedCommand {
  const tokens = tokenize(line);

  if (tokens.length === 0) {
    throw new Error('Commande vide');
  }

  const firstToken = tokens[0].toLowerCase();

  if (ACTION_ALIASES[firstToken] === 'help') {
    return {
      lineNumber,
      raw: line,
      action: 'help',
      flags: {},
    };
  }

  let action: CommandAction = 'create';
  let entity: CommandEntity | undefined;
  let index = 1;

  if (ACTION_ALIASES[firstToken] && firstToken !== 'help') {
    action = ACTION_ALIASES[firstToken];
    entity = ENTITY_ALIASES[tokens[1]?.toLowerCase()];
    index = 2;
  } else {
    entity = ENTITY_ALIASES[firstToken];
  }

  if (!entity) {
    throw new Error(`Commande ou cible inconnue: ${tokens[0]}`);
  }

  let label: string | undefined;
  const flags: Record<string, string> = {};

  if (tokens[index] && !tokens[index].startsWith('--')) {
    label = tokens[index];
    index += 1;
  }

  while (index < tokens.length) {
    const token = tokens[index];

    if (!token.startsWith('--')) {
      throw new Error(`Jeton inattendu: ${token}`);
    }

    const key = token.slice(2).trim().toLowerCase();
    if (!key) {
      throw new Error('Option invalide');
    }

    const value = tokens[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Valeur manquante pour --${key}`);
    }

    flags[key] = value;
    index += 2;
  }

  const requiresLabel = !['find', 'list', 'help', 'complete-many', 'delete-many', 'update-many'].includes(action);

  if (requiresLabel && !label) {
    throw new Error('Nom manquant. Utilisez par exemple: task "Nom de la tâche"');
  }

  return {
    lineNumber,
    raw: line,
    action,
    entity,
    label,
    flags,
  };
}

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      if (quote === char) {
        quote = null;
      } else {
        quote = char;
      }
      continue;
    }

    if (!quote && /\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (quote) {
    throw new Error('Guillemets non fermés');
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}
