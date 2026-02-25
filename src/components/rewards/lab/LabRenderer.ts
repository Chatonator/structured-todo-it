import type Matter from 'matter-js';
import type { CuveLayout, PipeLayout } from './types';
import * as C from './LabConfig';

// ---------- BACKGROUND ----------

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, C.BG_COLOR_TOP);
  grad.addColorStop(1, C.BG_COLOR_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ---------- CUVE ----------

export function drawCuve(
  ctx: CanvasRenderingContext2D,
  layout: CuveLayout,
  color: string,
  label: string,
  isEmpty: boolean
) {
  const { x, y, width, height } = layout;
  const lx = x - width / 2;
  const ly = y;

  // Glass fill
  ctx.fillStyle = hexToRgba(color, C.GLASS_FILL_ALPHA);
  ctx.fillRect(lx, ly, width, height);

  // Glass border
  ctx.strokeStyle = `rgba(255,255,255,${C.GLASS_STROKE_ALPHA})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(lx, ly, width, height);

  // Highlight line (left edge glass reflection)
  ctx.beginPath();
  ctx.moveTo(lx + 2, ly + 4);
  ctx.lineTo(lx + 2, ly + height - 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, ly - 6);

  // Floor line if not empty (visual indicator of closed valve)
  if (!isEmpty) {
    ctx.beginPath();
    ctx.moveTo(lx, ly + height);
    ctx.lineTo(lx + width, ly + height);
    ctx.strokeStyle = `rgba(255,255,255,${C.GLASS_STROKE_ALPHA})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ---------- REWARD CUVE ----------

export function drawRewardCuve(ctx: CanvasRenderingContext2D, layout: CuveLayout) {
  const { x, y, width, height } = layout;
  const lx = x - width / 2;

  // Glass fill – slightly brighter
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(lx, y, width, height);

  // Glass border
  ctx.strokeStyle = `rgba(255,255,255,${C.GLASS_STROKE_ALPHA + 0.05})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(lx, y, width, height);

  // Floor
  ctx.beginPath();
  ctx.moveTo(lx, y + height);
  ctx.lineTo(lx + width, y + height);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Récompense', x, y - 8);
}

// ---------- PIPES ----------

export function drawPipes(ctx: CanvasRenderingContext2D, pipes: PipeLayout[]) {
  for (const pipe of pipes) {
    ctx.beginPath();
    ctx.moveTo(pipe.fromX - C.PIPE_WIDTH / 2, pipe.fromY);
    ctx.lineTo(pipe.toX - C.PIPE_WIDTH / 2, pipe.toY);
    ctx.lineTo(pipe.toX + C.PIPE_WIDTH / 2, pipe.toY);
    ctx.lineTo(pipe.fromX + C.PIPE_WIDTH / 2, pipe.fromY);
    ctx.closePath();

    ctx.fillStyle = `rgba(255,255,255,${C.PIPE_FILL_ALPHA})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${C.PIPE_STROKE_ALPHA})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ---------- BALLS ----------

export function drawBalls(ctx: CanvasRenderingContext2D, bodies: Matter.Body[]) {
  for (const body of bodies) {
    const { x, y } = body.position;
    const r = C.BALL_RADIUS;
    const color = (body as any).__color as string;
    const colorLight = (body as any).__colorLight as string;

    // Radial gradient for 3D sphere look
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r);
    grad.addColorStop(0, colorLight);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, darken(color, 30));

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Tiny specular highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
  }
}

// ---------- HELPERS ----------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}
