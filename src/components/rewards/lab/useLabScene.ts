import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import type { ScenePhase, CuveState, PipeLayout } from './types';
import * as C from './LabConfig';
import {
  createEngine,
  computeCuveLayouts,
  computeRewardLayout,
  createCuve,
  createRewardCuve,
  spawnBalls,
  computePipeLayouts,
  createPipeGuides,
  openValve,
  areBallsSettled,
  getAllBalls,
} from './LabPhysics';
import {
  drawBackground,
  drawCuve,
  drawRewardCuve,
  drawPipes,
  drawBalls,
} from './LabRenderer';

export function useLabScene(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [phase, setPhase] = useState<ScenePhase>('initializing');
  const engineRef = useRef<Matter.Engine | null>(null);
  const cuvesRef = useRef<CuveState[]>([]);
  const rewardRef = useRef<ReturnType<typeof createRewardCuve> | null>(null);
  const pipesRef = useRef<PipeLayout[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const phaseRef = useRef<ScenePhase>('initializing');
  const settleCountRef = useRef(0); // require multiple consecutive settled checks

  const buildScene = useCallback((w: number, h: number) => {
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      Matter.World.clear(engineRef.current.world, false);
    }

    const engine = createEngine();
    engineRef.current = engine;

    const cuveLayouts = computeCuveLayouts(w, h);
    const rewardLayout = computeRewardLayout(w, h);

    const cuves = C.CUVES.map((cfg, i) => createCuve(cfg, cuveLayouts[i], engine.world));
    cuvesRef.current = cuves;

    const reward = createRewardCuve(rewardLayout, engine.world);
    rewardRef.current = reward;

    const pipes = computePipeLayouts(cuveLayouts, rewardLayout);
    pipesRef.current = pipes;

    createPipeGuides(pipes, engine.world);

    cuves.forEach(c => spawnBalls(c, engine.world));

    sizeRef.current = { w, h };
    settleCountRef.current = 0;
    phaseRef.current = 'initializing';
    setPhase('initializing');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect?.width || 800;
    const h = rect?.height || 600;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    buildScene(w, h);

    // Settle timer — require 3 consecutive settled checks
    const settleTimer = setInterval(() => {
      const allBalls = getAllBalls(cuvesRef.current);
      const settled = areBallsSettled(allBalls);

      if (settled) {
        settleCountRef.current++;
      } else {
        settleCountRef.current = 0;
      }

      const confirmed = settleCountRef.current >= 3;

      if (phaseRef.current === 'initializing' && confirmed) {
        phaseRef.current = 'idle';
        setPhase('idle');
      }
      if (phaseRef.current === 'refining' && confirmed) {
        phaseRef.current = 'done';
        setPhase('done');
      }
    }, C.SETTLE_CHECK_INTERVAL_MS);

    const tick = () => {
      if (!engineRef.current) return;
      Matter.Engine.update(engineRef.current, 1000 / 60);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { w: sw, h: sh } = sizeRef.current;
      drawBackground(ctx, sw, sh);

      drawPipes(ctx, pipesRef.current);

      for (const cuve of cuvesRef.current) {
        drawCuve(ctx, cuve.layout, cuve.config.color, cuve.config.label, cuve.floor === null);
      }

      if (rewardRef.current) {
        drawRewardCuve(ctx, rewardRef.current.layout);
      }

      const allBalls = getAllBalls(cuvesRef.current);
      drawBalls(ctx, allBalls);

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: nw, height: nh } = entry.contentRect;
        if (Math.abs(nw - sizeRef.current.w) > 10 || Math.abs(nh - sizeRef.current.h) > 10) {
          canvas.width = nw * dpr;
          canvas.height = nh * dpr;
          canvas.style.width = `${nw}px`;
          canvas.style.height = `${nh}px`;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);
          buildScene(nw, nh);
        }
      }
    });

    if (canvas.parentElement) observer.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(settleTimer);
      observer.disconnect();
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
        Matter.World.clear(engineRef.current.world, false);
        engineRef.current = null;
      }
    };
  }, [canvasRef, buildScene]);

  const refine = useCallback(() => {
    if (!engineRef.current) return;
    phaseRef.current = 'refining';
    settleCountRef.current = 0;
    setPhase('refining');

    cuvesRef.current.forEach((cuve, i) => {
      setTimeout(() => {
        if (engineRef.current) {
          openValve(cuve, engineRef.current.world);
        }
      }, i * C.VALVE_STAGGER_MS);
    });
  }, []);

  return { phase, refine };
}
