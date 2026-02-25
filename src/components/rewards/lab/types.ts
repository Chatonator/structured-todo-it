import type Matter from 'matter-js';

export type ScenePhase = 'initializing' | 'idle' | 'refining' | 'done';

export interface CuveConfig {
  id: string;
  label: string;
  color: string;
  colorLight: string;
  ballCount: number;
}

export interface CuveLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CuveState {
  config: CuveConfig;
  layout: CuveLayout;
  walls: Matter.Body[];
  floor: Matter.Body | null;
  balls: Matter.Body[];
}

export interface PipeLayout {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface SceneState {
  phase: ScenePhase;
  cuves: CuveState[];
  rewardCuve: {
    layout: CuveLayout;
    walls: Matter.Body[];
    floor: Matter.Body;
  } | null;
  pipes: PipeLayout[];
  pipeWalls: Matter.Body[];
}
