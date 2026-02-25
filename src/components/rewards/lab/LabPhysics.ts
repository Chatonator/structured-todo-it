import Matter from 'matter-js';
import type { CuveConfig, CuveLayout, CuveState, PipeLayout } from './types';
import * as C from './LabConfig';

const { Engine, World, Bodies, Body, Composite } = Matter;

export function createEngine() {
  const engine = Engine.create({
    gravity: { x: 0, y: C.GRAVITY, scale: 0.001 },
  });
  return engine;
}

// ---------- CUVE WALLS ----------

function createCuveWalls(layout: CuveLayout, world: Matter.World) {
  const { x, y, width, height } = layout;
  const t = C.WALL_THICKNESS;
  const opts: Matter.IBodyDefinition = { isStatic: true, friction: 0.3, render: { visible: false } };

  const left  = Bodies.rectangle(x - width / 2 - t / 2, y + height / 2, t, height + t, opts);
  const right = Bodies.rectangle(x + width / 2 + t / 2, y + height / 2, t, height + t, opts);
  const floor = Bodies.rectangle(x, y + height + t / 2, width + t * 2, t, opts);

  const walls = [left, right];
  Composite.add(world, [...walls, floor]);
  return { walls, floor };
}

// ---------- CUVES ----------

export function computeCuveLayouts(canvasW: number, canvasH: number): CuveLayout[] {
  const cuveW = canvasW * C.CUVE_WIDTH_RATIO;
  const cuveH = canvasH * C.CUVE_HEIGHT_RATIO;
  const gap = canvasW * C.CUVE_GAP_RATIO;
  const totalW = 4 * cuveW + 3 * gap;
  const startX = (canvasW - totalW) / 2 + cuveW / 2;
  const topY = canvasH * C.CUVE_TOP_Y_RATIO;

  return C.CUVES.map((_, i) => ({
    x: startX + i * (cuveW + gap),
    y: topY,
    width: cuveW,
    height: cuveH,
  }));
}

export function computeRewardLayout(canvasW: number, canvasH: number): CuveLayout {
  return {
    x: canvasW / 2,
    y: canvasH * C.REWARD_CUVE_Y_RATIO,
    width: canvasW * C.REWARD_CUVE_WIDTH_RATIO,
    height: canvasH * C.REWARD_CUVE_HEIGHT_RATIO,
  };
}

export function createCuve(config: CuveConfig, layout: CuveLayout, world: Matter.World): CuveState {
  const { walls, floor } = createCuveWalls(layout, world);
  return { config, layout, walls, floor, balls: [] };
}

export function createRewardCuve(layout: CuveLayout, world: Matter.World) {
  const { walls, floor } = createCuveWalls(layout, world);
  return { layout, walls, floor };
}

// ---------- BALLS ----------

export function spawnBalls(cuve: CuveState, world: Matter.World) {
  const { layout, config } = cuve;
  const r = C.BALL_RADIUS;
  const balls: Matter.Body[] = [];

  for (let i = 0; i < config.ballCount; i++) {
    const bx = layout.x + (Math.random() - 0.5) * (layout.width - r * 4);
    const by = layout.y - r * 2 - Math.random() * layout.height * 0.6;
    const ball = Bodies.circle(bx, by, r, {
      restitution: C.BALL_RESTITUTION,
      friction: C.BALL_FRICTION,
      density: C.BALL_DENSITY,
      label: `ball_${config.id}`,
      render: { visible: false },
    });
    (ball as any).__color = config.color;
    (ball as any).__colorLight = config.colorLight;
    balls.push(ball);
  }

  Composite.add(world, balls);
  cuve.balls = balls;
}

// ---------- PIPES ----------

export function computePipeLayouts(cuveLayouts: CuveLayout[], rewardLayout: CuveLayout): PipeLayout[] {
  return cuveLayouts.map(cl => ({
    fromX: cl.x,
    fromY: cl.y + cl.height + C.WALL_THICKNESS,
    toX: rewardLayout.x,
    toY: rewardLayout.y,
  }));
}

export function createPipeGuides(pipes: PipeLayout[], world: Matter.World): Matter.Body[] {
  const bodies: Matter.Body[] = [];
  const halfW = C.PIPE_WIDTH / 2;
  const opts: Matter.IBodyDefinition = { isStatic: true, friction: 0.05, render: { visible: false } };

  for (const pipe of pipes) {
    const dx = pipe.toX - pipe.fromX;
    const dy = pipe.toY - pipe.fromY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const cx = (pipe.fromX + pipe.toX) / 2;
    const cy = (pipe.fromY + pipe.toY) / 2;

    // Two thin walls forming a channel
    const perpX = Math.cos(angle + Math.PI / 2) * halfW;
    const perpY = Math.sin(angle + Math.PI / 2) * halfW;

    const wallL = Bodies.rectangle(cx + perpX, cy + perpY, len, 3, { ...opts, angle });
    const wallR = Bodies.rectangle(cx - perpX, cy - perpY, len, 3, { ...opts, angle });
    bodies.push(wallL, wallR);
  }

  Composite.add(world, bodies);
  return bodies;
}

// ---------- VALVE ----------

export function openValve(cuve: CuveState, world: Matter.World) {
  if (cuve.floor) {
    Composite.remove(world, cuve.floor);
    cuve.floor = null;
  }
}

// ---------- SETTLE CHECK ----------

export function areBallsSettled(bodies: Matter.Body[]): boolean {
  if (bodies.length === 0) return true;
  let totalV = 0;
  for (const b of bodies) {
    totalV += Math.abs(b.velocity.x) + Math.abs(b.velocity.y);
  }
  return (totalV / bodies.length) < C.SETTLE_VELOCITY_THRESHOLD;
}

export function getAllBalls(cuves: CuveState[]): Matter.Body[] {
  return cuves.flatMap(c => c.balls);
}
