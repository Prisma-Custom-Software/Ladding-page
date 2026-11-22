// Preview do motor: H1 sendo revelado com cursor + 5 agentes em posicoes fixas (comparacao visual).
import { useEffect, useRef } from 'react';
import { subscribe } from '../../engine/loop.js';
import { reveal } from '../../engine/reveal.js';
import { createAgents, drawAgentLabel } from '../../engine/agents.js';
import { drawAgentBot } from '../../engine/drawAgentBot.js';
import { seg } from '../../engine/math.js';

const LABELS = ['mount(nav.logo)', 'render(nav.links)', 'draw(nav.cta)', 'type(hero.kicker)', 'type(hero.title)'];

export default function EngineDemo() {
  const h1 = useRef(null);
  const cv = useRef(null);

  useEffect(() => {
    const c = cv.current;
    const agents = createAgents(innerWidth);
    const start = performance.now();
    return subscribe((now) => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const T = now / 1000;
      const u = seg((now - start) % 4000, 300, 3000);
      const cr = reveal(h1.current, u);
      if (cr) {
        ctx.fillStyle = `rgba(244,245,248,${Math.floor(now / 110) % 2 ? 0.95 : 0.4})`;
        ctx.fillRect(cr[0], cr[1] - cr[2] * 0.42, 2, cr[2] * 0.84);
      }
      ctx.font = "10px 'Roboto Mono', monospace";
      agents.forEach((a, i) => {
        a.x = 120 + i * 220;
        a.y = 360 + (i % 2) * 40;
        a.alpha = 1;
        drawAgentBot(ctx, i, a.x, a.y, a.alpha, true, T, a.col);
        drawAgentLabel(ctx, a, LABELS[i], true, w);
      });
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0B1220', color: '#F4F5F8', padding: 48 }}>
      <h1 ref={h1} style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 500, fontSize: 72, margin: 0, maxWidth: 900 }}>
        Código que vira resultados.
      </h1>
      <canvas ref={cv} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
    </div>
  );
}
