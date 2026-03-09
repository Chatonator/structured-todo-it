export type CommandKind = 'task' | 'project' | 'habit' | 'help';

export interface ParsedCommand {
  lineNumber: number;
  raw: string;
  kind: CommandKind;
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
];

export const COMMAND_RULES = [
  'Une commande par ligne.',
  'Les commentaires commencent par #.',
  'Les noms avec espaces doivent être entre guillemets.',
  'Les options utilisent le format --cle valeur.',
  'Les alias t, p et h sont acceptés.',
];

const COMMAND_ALIASES: Record<string, CommandKind> = {
  task: 'task',
  t: 'task',
  project: 'project',
  p: 'project',
  habit: 'habit',
  h: 'habit',
  help: 'help',
};

export function getHelpScript(): string {
  return [
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

  const commandToken = tokens[0].toLowerCase();
  const kind = COMMAND_ALIASES[commandToken];

  if (!kind) {
    throw new Error(`Commande inconnue: ${tokens[0]}`);
  }

  if (kind === 'help') {
    return {
      lineNumber,
      raw: line,
      kind,
      flags: {},
    };
  }

  let label: string | undefined;
  const flags: Record<string, string> = {};
  let index = 1;

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

  if (!label) {
    throw new Error('Nom manquant. Utilisez par exemple: task "Nom de la tâche"');
  }

  return {
    lineNumber,
    raw: line,
    kind,
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
