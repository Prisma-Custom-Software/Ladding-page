// Mini-robo do carrossel Prisma (CARROSSEL-PRISMA/engine/draw.js, drawBot) em versao compacta para os
// agentes da pagina de projetos. Origem no centro do casco; em s = 1 o robo tem ~72 px de largura.
import { rgba } from './math.js';

const SHELL_TOP = '#2f3d6b';
const SHELL_BOTTOM = '#111a33';

/**
 * o: { x, y, s, rot, stretch, dir, col, alpha, eye, flame, T, seed, happy }
 * stretch estica o robo na direcao `dir` (radianos) e achata no eixo perpendicular (squash & stretch).
 */
export function drawMiniBot(ctx, o) {
  const { x, y, s = 0.42, rot = 0, stretch = 0, dir = 0, col, alpha = 1, eye = 1, flame = 0.6, T = 0, seed = 0, happy = false } = o;
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  // estica na direcao do movimento
  ctx.rotate(dir);
  ctx.scale(1 + stretch, 1 - stretch * 0.55);
  ctx.rotate(-dir);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // chama do propulsor
  const fl = 58 * flame * (0.85 + 0.15 * Math.sin(T * 70 + seed) + 0.08 * Math.sin(T * 131 + seed * 3));
  if (fl > 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 30, 0, 30 + fl);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.25, rgba(col, 0.9));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-13, 30);
    ctx.quadraticCurveTo(-9, 30 + fl * 0.5, 0, 30 + fl);
    ctx.quadraticCurveTo(9, 30 + fl * 0.5, 13, 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // garras
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(col, 0.9);
  ctx.beginPath();
  ctx.moveTo(-22, 18);
  ctx.lineTo(-30, 40);
  ctx.moveTo(22, 18);
  ctx.lineTo(30, 40);
  ctx.stroke();
  // aletas
  ctx.fillStyle = '#4b39d9';
  ctx.beginPath();
  ctx.moveTo(-36, -6);
  ctx.lineTo(-52, 14);
  ctx.lineTo(-32, 14);
  ctx.moveTo(36, -6);
  ctx.lineTo(52, 14);
  ctx.lineTo(32, 14);
  ctx.fill();
  // antena
  ctx.strokeStyle = '#7b6cff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(0, -46);
  ctx.stroke();
  ctx.fillStyle = rgba(col, 1);
  ctx.beginPath();
  ctx.arc(0, -49, 6, 0, 6.283);
  ctx.fill();
  // casco
  roundRect(ctx, -36, -32, 72, 62, 26);
  const sh = ctx.createLinearGradient(0, -32, 0, 30);
  sh.addColorStop(0, SHELL_TOP);
  sh.addColorStop(1, SHELL_BOTTOM);
  ctx.fillStyle = sh;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = rgba(col, 1);
  ctx.stroke();
  // visor + olhos
  roundRect(ctx, -26, -18, 52, 24, 12);
  ctx.fillStyle = '#03060c';
  ctx.fill();
  ctx.shadowColor = rgba(col, 1);
  ctx.shadowBlur = 12;
  ctx.fillStyle = rgba(col, 1);
  ctx.strokeStyle = rgba(col, 1);
  if (happy) {
    ctx.lineWidth = 4;
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sd * 10, -2, 6, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  } else {
    const eh = Math.max(2, 13 * eye);
    roundRect(ctx, -16, -6 - eh / 2, 10, eh, 4);
    ctx.fill();
    roundRect(ctx, 6, -6 - eh / 2, 10, eh, 4);
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
