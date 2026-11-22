// Desenho do agente: triangulo com brilho e miolo escuro (porte 1:1 de drawAgentBot do modelo).
import { rgba } from './math.js';

export function drawAgentBot(ctx, i, x, y, alpha, working, T, col) {
  const s = 6.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(T * (working ? 4 : 1.2) + i * 1.7) * 0.5);
  ctx.shadowColor = rgba(col, 1);
  ctx.shadowBlur = 14;
  ctx.fillStyle = rgba(col, alpha);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.9, s * 0.6);
  ctx.lineTo(-s * 0.9, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(11,18,32,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.35);
  ctx.lineTo(s * 0.35, s * 0.3);
  ctx.lineTo(-s * 0.35, s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
