// Porte 1:1 de initNet/drawNet do modelo (Landing Page v6). Mesma ordem de chamadas a rng().
import { clamp, mix, rgba } from './math.js';

export function createNetwork(canvas, rngIn) {
  const rng = () => (rngIn || Math.random)();
  const s = { nodes: [], packets: [], dpr: 1, w: 0, h: 0 };

  function init() {
    const c = canvas;
    if (!c) return;
    const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1);
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    s.dpr = dpr;
    s.w = w;
    s.h = h;
    const n = Math.round(Math.min(90, (w * h) / 16000));
    s.nodes = Array.from({ length: n }, () => ({
      x: rng() * w,
      y: rng() * h,
      vx: (rng() - 0.5) * 12,
      vy: (rng() - 0.5) * 12,
      r: 0.8 + rng() * 1.3,
    }));
  }

  function draw(dt) {
    const c = canvas;
    if (!c || !s.nodes.length) return;
    const r = c.getBoundingClientRect();
    if (r.bottom < 0) return;
    const ctx = c.getContext('2d');
    const { w, h } = s;
    const N = s.nodes;
    const maxD = 140;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const a of N) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < -20) a.x = w + 20;
      if (a.x > w + 20) a.x = -20;
      if (a.y < -20) a.y = h + 20;
      if (a.y > h + 20) a.y = -20;
    }
    const links = [];
    ctx.lineWidth = 1;
    for (let i = 0; i < N.length; i++) {
      for (let j = i + 1; j < N.length; j++) {
        const a = N[i];
        const b = N[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > maxD) continue;
        ctx.strokeStyle = rgba(mix(clamp((a.x + b.x) / 2 / w)), (1 - d / maxD) * 0.22);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        links.push([a, b]);
      }
    }
    for (const a of N) {
      ctx.fillStyle = rgba(mix(clamp(a.x / w)), 0.5);
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, 6.283);
      ctx.fill();
    }
    if (s.packets.length < 6 && links.length && rng() < 0.08) {
      const [a, b] = links[(rng() * links.length) | 0];
      s.packets.push({ a, b, t: 0 });
    }
    s.packets = s.packets.filter((pk) => {
      pk.t += dt * 1.2;
      if (pk.t >= 1) return false;
      const x = pk.a.x + (pk.b.x - pk.a.x) * pk.t;
      const y = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
      const col = mix(clamp(x / w));
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
      g.addColorStop(0, rgba(col, 0.7));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 6.283);
      ctx.fill();
      return true;
    });
  }

  return { init, draw, state: s };
}
