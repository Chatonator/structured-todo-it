const LAUNCHED_TOOLS_KEY = 'toolbox_launched_tools';

export function getLaunchedTools(): string[] {
  try {
    const stored = localStorage.getItem(LAUNCHED_TOOLS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function markToolLaunched(toolId: string): void {
  const current = getLaunchedTools();
  if (!current.includes(toolId)) {
    localStorage.setItem(LAUNCHED_TOOLS_KEY, JSON.stringify([...current, toolId]));
  }
}
