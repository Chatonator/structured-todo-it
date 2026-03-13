export type CommandEntity = 'task' | 'project' | 'habit';
export type CommandAction = 'create' | 'update' | 'complete' | 'plan' | 'assign' | 'delete' | 'find' | 'list' | 'complete-many' | 'delete-many' | 'update-many' | 'schema' | 'inspect' | 'stats' | 'help';

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
  variables: Record<string, string>;
}

export const COMMAND_EXAMPLES = [
  'task "Faire la vaisselle" --context perso --time 15',
  'project "Maison" --context perso',
  'habit "Boire un verre d eau" --context perso --time 5 --frequency daily',
  'habit "Faire du sport" --context perso --time 40 --frequency weekly --days 1,3,5',
  'update task "Faire la vaisselle" --time 20',
  'complete project "Maison"',
  'plan task "Faire la vaisselle" --date 2026-03-10 --time 19:00',
  'assign task "Faire la vaisselle" --project "Maison"',
  'delete habit "Boire un verre d eau" --confirm CONFIRM',
  'find task --text vaisselle --context perso --status active',
  'list project --status active --limit 10',
  'complete-many task --context perso --status active --limit 5',
  'update-many task --context perso --priority important',
  'delete-many habit --text test --limit 3 --confirm CONFIRM',
  'schema habit',
  'inspect task "Faire la vaisselle"',
  'stats project',
  'let maison = "Maison"',
  'find task where context=perso and status=active and project=$maison',
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
  'Les suppressions exigent --confirm CONFIRM.',
  'Utilisez --dry-run true pour simuler une action avant exécution.',
  'Les variables se définissent avec let nom = "valeur" puis se réutilisent avec $nom.',
  'La clause where accepte des conditions de type cle=valeur ou text~mot séparées par and.',
];

export const COMMAND_SYNTAX = [
  'task "Nom" [--context pro|perso] [--time 30] [--category critical|urgent|important|low_priority] [--priority critical|important|later|optional]',
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
  'schema task|project|habit',
  'inspect task|project|habit "Nom existant"',
  'stats task|project|habit',
  'let variable = "valeur"',
  'find task|project|habit where context=perso and status=active and text~vaisselle',
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
  schema: 'schema',
  inspect: 'inspect',
  stats: 'stats',
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
  const variables: Record<string, string> = {};

  script.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    try {
      if (trimmed.toLowerCase().startsWith('let ')) {
        const declaration = parseVariableDeclaration(trimmed);
        variables[declaration.name] = declaration.value;
        return;
      }

      const resolvedLine = applyVariables(trimmed, variables);
      const parsed = parseCommandLine(resolvedLine, lineNumber);
      commands.push(parsed);
    } catch (error) {
      errors.push({
        lineNumber,
        raw: rawLine,
        message: error instanceof Error ? error.message : 'Erreur de syntaxe',
      });
    }
  });

  return { commands, errors, variables };
}

function parseCommandLine(line: string, lineNumber: number): ParsedCommand {
  const enrichedLine = injectWhereFlags(line);
  const tokens = tokenize(enrichedLine);

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

  const requiresLabel = !['find', 'list', 'help', 'complete-many', 'delete-many', 'update-many', 'schema', 'stats'].includes(action);

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

function parseVariableDeclaration(line: string): { name: string; value: string } {
  const match = line.match(/^let\s+([a-zA-Z_][\w-]*)\s*=\s*(.+)$/);
  if (!match) {
    throw new Error('Déclaration de variable invalide. Utilisez: let nom = "valeur"');
  }

  const [, name, rawValue] = match;
  const value = stripWrappingQuotes(rawValue.trim());
  if (!value) {
    throw new Error(`Variable vide: ${name}`);
  }

  return { name, value };
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function quoteIfNeeded(value: string): string {
  if (!/\s/.test(value) && !value.includes('"')) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

function applyVariables(line: string, variables: Record<string, string>): string {
  return line.replace(/\$([a-zA-Z_][\w-]*)/g, (_, name: string) => {
    if (!(name in variables)) {
      throw new Error(`Variable inconnue: $${name}`);
    }

    return quoteIfNeeded(variables[name]);
  });
}

function injectWhereFlags(line: string): string {
  const whereIndex = line.toLowerCase().indexOf(' where ');
  if (whereIndex === -1) {
    return line;
  }

  const head = line.slice(0, whereIndex).trim();
  const tail = line.slice(whereIndex + 7).trim();
  const segments = tail.split(/\s+and\s+/i).map(segment => segment.trim()).filter(Boolean);
  const flags = segments.map(segment => {
    if (segment.includes('~')) {
      const [key, value] = segment.split('~');
      return `--${key.trim()} ${quoteIfNeeded(stripWrappingQuotes(value.trim()))}`;
    }

    if (segment.includes('=')) {
      const [key, value] = segment.split('=');
      return `--${key.trim()} ${quoteIfNeeded(stripWrappingQuotes(value.trim()))}`;
    }

    throw new Error(`Condition where invalide: ${segment}`);
  });

  return `${head} ${flags.join(' ')}`.trim();
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
