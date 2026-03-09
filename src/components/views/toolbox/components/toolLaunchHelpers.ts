import { loadStorage, saveStorage } from '@/lib/storage';

const LAUNCHED_TOOLS_KEY = 'toolbox_launched_tools';

export function getLaunchedTools(): string[] {
  return loadStorage<string[]>(LAUNCHED_TOOLS_KEY, []);
}

export function markToolLaunched(toolId: string): void {
  const current = getLaunchedTools();
  if (!current.includes(toolId)) {
    saveStorage(LAUNCHED_TOOLS_KEY, [...current, toolId]);
  }
}
