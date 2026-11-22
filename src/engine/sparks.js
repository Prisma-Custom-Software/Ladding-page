// Faiscas (burst + atualizacao/desenho), porte 1:1 do modelo. rng injetavel para testes.
import { rgba } from './math.js';

export function createSparks(rng = Math.random) {
  const s = { list: [], rng };

  s.burst = (x, y, n, col) => {
    for (let i = 0; i < n; i++) {
      const a = rng() * 6.283;
      const sp = 30 + rng() * 130;
      s.list.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        col: rng() < 0.3 ? [244, 245, 248] : col,
      });
    }
  };

  // Faisca solta emitida pelo feixe de um agente.
  s.beam = (x, y, col) => {
    s.list.push({ x, y, vx: (rng() - 0.5) * 80, vy: (rng() - 0.5) * 80, life: 0.7, col });
  };

  s.step = (ctx, dt) => {
    s.list = s.list.filter((p) => {
      p.life -= dt * 1.7;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.93;
      p.vy *= 0.93;
      if (ctx) {
        ctx.fillStyle = rgba(p.col, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 * p.life + 0.4, 0, 6.283);
        ctx.fill();
      }
      return true;
    });
  };

  return s;
}
