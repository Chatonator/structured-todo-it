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

  // Subtle grid pattern for depth
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 0.5;
  const step = 30;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
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
  const r = 4; // corner radius

  // Glass fill with category-tinted gradient
  const fillGrad = ctx.createLinearGradient(lx, ly, lx + width, ly + height);
  fillGrad.addColorStop(0, hexToRgba(color, 0.08));
  fillGrad.addColorStop(0.5, hexToRgba(color, 0.03));
  fillGrad.addColorStop(1, hexToRgba(color, 0.06));
  ctx.fillStyle = fillGrad;
  roundRect(ctx, lx, ly, width, height, r);
  ctx.fill();

  // Glass border with glow
  ctx.strokeStyle = hexToRgba(color, 0.25);
  ctx.lineWidth = 1.5;
  roundRect(ctx, lx, ly, width, height, r);
  ctx.stroke();

  // Inner highlight (left edge glass reflection)
  const hlGrad = ctx.createLinearGradient(lx, ly, lx + 8, ly);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hlGrad;
  ctx.fillRect(lx + 1, ly + 1, 8, height - 2);

  // Label
  ctx.fillStyle = hexToRgba(color, 0.8);
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label.toUpperCase(), x, ly - 8);

  // Floor line if closed
  if (!isEmpty) {
    ctx.beginPath();
    ctx.moveTo(lx, ly + height);
    ctx.lineTo(lx + width, ly + height);
    ctx.strokeStyle = hexToRgba(color, 0.3);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ---------- REWARD CUVE ----------

export function drawRewardCuve(ctx: CanvasRenderingContext2D, layout: CuveLayout) {
  const { x, y, width, height } = layout;
  const lx = x - width / 2;
  const r = 6;

  // Glass fill – golden tint
  const fillGrad = ctx.createLinearGradient(lx, y, lx + width, y + height);
  fillGrad.addColorStop(0, 'rgba(251, 191, 36, 0.04)');
  fillGrad.addColorStop(1, 'rgba(251, 191, 36, 0.02)');
  ctx.fillStyle = fillGrad;
  roundRect(ctx, lx, y, width, height, r);
  ctx.fill();

  // Glass border – gold accent
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, lx, y, width, height, r);
  ctx.stroke();

  // Floor
  ctx.beginPath();
  ctx.moveTo(lx, y + height);
  ctx.lineTo(lx + width, y + height);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Label
  ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RÉCOMPENSE', x, y - 10);
}

// ---------- PIPES ----------

export function drawPipes(ctx: CanvasRenderingContext2D, pipes: PipeLayout[]) {
  for (const pipe of pipes) {
    // Draw pipe as a tapered path
    const hw = C.PIPE_WIDTH / 2;
    ctx.beginPath();
    ctx.moveTo(pipe.fromX - hw, pipe.fromY);
    ctx.lineTo(pipe.toX - hw * 0.6, pipe.toY);
    ctx.lineTo(pipe.toX + hw * 0.6, pipe.toY);
    ctx.lineTo(pipe.fromX + hw, pipe.fromY);
    ctx.closePath();

    // Gradient fill
    const grad = ctx.createLinearGradient(pipe.fromX, pipe.fromY, pipe.toX, pipe.toY);
    grad.addColorStop(0, 'rgba(148, 163, 184, 0.08)');
    grad.addColorStop(1, 'rgba(148, 163, 184, 0.04)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
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

    // Shadow
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // Radial gradient for 3D sphere look
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, colorLight);
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, darken(color, 40));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
