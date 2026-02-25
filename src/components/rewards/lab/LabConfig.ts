import type { CuveConfig } from './types';

// Category colors from tailwind.config.ts
export const CUVES: CuveConfig[] = [
  { id: 'obligation', label: 'Obligation', color: '#dc2626', colorLight: '#fca5a5', ballCount: 20 },
  { id: 'quotidien',  label: 'Quotidien',  color: '#f59e0b', colorLight: '#fcd34d', ballCount: 15 },
  { id: 'envie',      label: 'Envie',      color: '#16a34a', colorLight: '#86efac', ballCount: 18 },
  { id: 'autres',     label: 'Autres',     color: '#8b5cf6', colorLight: '#c4b5fd', ballCount: 10 },
];

// Physics
export const BALL_RADIUS = 6;
export const BALL_RESTITUTION = 0.35;
export const BALL_FRICTION = 0.1;
export const BALL_DENSITY = 0.002;
export const GRAVITY = 1.2;

// Layout ratios (relative to canvas)
export const CUVE_TOP_Y_RATIO = 0.08;
export const CUVE_WIDTH_RATIO = 0.16;
export const CUVE_HEIGHT_RATIO = 0.30;
export const CUVE_GAP_RATIO = 0.04;

export const REWARD_CUVE_WIDTH_RATIO = 0.22;
export const REWARD_CUVE_HEIGHT_RATIO = 0.28;
export const REWARD_CUVE_Y_RATIO = 0.62;

export const WALL_THICKNESS = 4;

export const PIPE_WIDTH = 18;

// Timing
export const VALVE_STAGGER_MS = 250;
export const SETTLE_VELOCITY_THRESHOLD = 0.15;
export const SETTLE_CHECK_INTERVAL_MS = 500;

// Visual
export const BG_COLOR_TOP = '#1a1a2e';
export const BG_COLOR_BOTTOM = '#0f0f23';
export const GLASS_STROKE_ALPHA = 0.2;
export const GLASS_FILL_ALPHA = 0.06;
export const PIPE_FILL_ALPHA = 0.12;
export const PIPE_STROKE_ALPHA = 0.15;
