import type { CuveConfig } from './types';

// Category colors
export const CUVES: CuveConfig[] = [
  { id: 'obligation', label: 'Obligation', color: '#dc2626', colorLight: '#fca5a5', ballCount: 12 },
  { id: 'quotidien',  label: 'Quotidien',  color: '#f59e0b', colorLight: '#fcd34d', ballCount: 10 },
  { id: 'envie',      label: 'Envie',      color: '#16a34a', colorLight: '#86efac', ballCount: 14 },
  { id: 'autres',     label: 'Autres',     color: '#8b5cf6', colorLight: '#c4b5fd', ballCount: 8 },
];

// Physics
export const BALL_RADIUS = 8;
export const BALL_RESTITUTION = 0.2;
export const BALL_FRICTION = 0.6;
export const BALL_DENSITY = 0.004;
export const GRAVITY = 1.0;
export const VELOCITY_DAMPING = 0.05; // slows balls down

// Layout ratios (relative to canvas)
export const CUVE_TOP_Y_RATIO = 0.08;
export const CUVE_WIDTH_RATIO = 0.17;
export const CUVE_HEIGHT_RATIO = 0.32;
export const CUVE_GAP_RATIO = 0.03;

export const REWARD_CUVE_WIDTH_RATIO = 0.24;
export const REWARD_CUVE_HEIGHT_RATIO = 0.26;
export const REWARD_CUVE_Y_RATIO = 0.62;

export const WALL_THICKNESS = 8;

export const PIPE_WIDTH = 22;

// Timing
export const VALVE_STAGGER_MS = 300;
export const SETTLE_VELOCITY_THRESHOLD = 0.3;
export const SETTLE_CHECK_INTERVAL_MS = 400;

// Visual
export const BG_COLOR_TOP = '#121225';
export const BG_COLOR_BOTTOM = '#0a0a18';
export const GLASS_STROKE_ALPHA = 0.15;
export const GLASS_FILL_ALPHA = 0.05;
export const PIPE_FILL_ALPHA = 0.08;
export const PIPE_STROKE_ALPHA = 0.12;
