export type LayoutMode = 'phone' | 'tablet-compact' | 'desktop';

export const PHONE_MAX_WIDTH = 767;
export const TABLET_MAX_WIDTH = 1023;

export const getLayoutMode = (width: number): LayoutMode => {
  if (width <= PHONE_MAX_WIDTH) return 'phone';
  if (width <= TABLET_MAX_WIDTH) return 'tablet-compact';
  return 'desktop';
};

export const isCompactLayout = (width: number): boolean => getLayoutMode(width) !== 'desktop';
