export type MobileSupportLevel = 'optimized' | 'simplified' | 'legacy';
export type MobilePlacement = 'primary' | 'more' | 'hidden';

export interface MobileViewConfig {
  placement: MobilePlacement;
  priority: number;
  support: MobileSupportLevel;
}

export const mobileViewConfig: Record<string, MobileViewConfig> = {
  home: { placement: 'primary', priority: 1, support: 'optimized' },
  tasks: { placement: 'primary', priority: 2, support: 'optimized' },
  timeline: { placement: 'primary', priority: 3, support: 'optimized' },
  habits: { placement: 'primary', priority: 4, support: 'optimized' },
  projects: { placement: 'more', priority: 1, support: 'simplified' },
  observatory: { placement: 'more', priority: 2, support: 'simplified' },
  rewards: { placement: 'more', priority: 3, support: 'simplified' },
  toolbox: { placement: 'more', priority: 4, support: 'simplified' },
  team: { placement: 'more', priority: 5, support: 'simplified' },
};

export const getMobileViewIdsByPlacement = (placement: MobilePlacement): string[] => {
  return Object.entries(mobileViewConfig)
    .filter(([, config]) => config.placement === placement)
    .sort(([, left], [, right]) => left.priority - right.priority)
    .map(([viewId]) => viewId);
};

export const isPrimaryMobileViewId = (viewId: string): boolean => {
  return mobileViewConfig[viewId]?.placement === 'primary';
};
