// Construcao da pagina de projetos pelos robos: cada secao ([data-sec]) comeca quando entra na tela e fica
// pronta em ate BUDGET ms, com os cinco robos dividindo os itens ([data-b]). Quando tudo esta construido os
// robos saem pela borda direita e o loop para.
import { useEffect } from 'react';
import { subscribe } from '../engine/loop.js';
import { createSparks } from '../engine/sparks.js';
import { initSections, startSection, compressSection, updateSections, allSectionsDone, setItem } from '../engine/sections.js';
import { createRobots, stepRobot } from '../engine/robotAgents.js';

export const BUDGET = 1500;
const ROBOTS = [0, 1, 2, 3, 4];

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mostra tudo de uma vez (movimento reduzido ou sem canvas).
function revealAll(sections) {
  for (const S of sections) {
    startSection(S, 0);
    S.items.forEach((it) => {
      setItem(it, 1e9);
      it.done = true;
      it.caret = null;
      if (it.kind === 'block') it.el.style.opacity = '';
      if (it.kind === 'icon') it.el.style.filter = '';
    });
  }
}

export function useProjectsBuild(rootRef, canvasRef) {
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const sections = initSections(root);
    sections.forEach((S) => (S.pair = ROBOTS));
    if (!canvas || reduceMotion()) {
      revealAll(sections);
      return undefined;
    }
    const sparks = createSparks();
    const robots = createRobots(ROBOTS.length, window.innerHeight);
    let exitAt = 0;

    const frame = (now, dt) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // inicia (comprimido) as secoes que entraram na tela, antes do updateSections
      // no fim da pagina o rodape nao sobe ate 85% da tela: inicia o que estiver visivel
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      for (const S of sections) {
        if (S.started) continue;
        const r = S.el.getBoundingClientRect();
        if ((r.top < h * 0.85 || (atBottom && r.top < h)) && r.bottom > 0) {
          startSection(S, now);
          compressSection(S, now, BUDGET);
        }
      }
      updateSections(sections, now, ctx, sparks);
      const done = allSectionsDone(sections);
      if (done && !exitAt) exitAt = now;
      const T = now / 1000;
      ctx.font = "10px 'Roboto Mono', monospace";
      robots.forEach((a, i) => stepRobot(ctx, a, i, { dt, T, now, w, h, sections, sparks, exiting: done }));
      sparks.step(ctx, dt);
      if (exitAt && now - exitAt > 2500 && robots.every((a) => a.alpha < 0.02)) {
        ctx.clearRect(0, 0, w, h);
        unsub();
      }
    };
    const unsub = subscribe((now, dt) => {
      try {
        frame(now, dt);
      } catch (e) {
        console.error('projects frame', e);
      }
    });
    return () => unsub();
  }, [rootRef, canvasRef]);
}
