// Loop unico da intro (porte de loop/applyHero/drawAgents do modelo). Sem setState por frame.
import { useEffect } from 'react';
import { subscribe } from '../engine/loop.js';
import { easeOut, seg, LIME } from '../engine/math.js';
import { END, GATHER, SPEED } from '../engine/timeline.js';
import { reveal } from '../engine/reveal.js';
import { tracePt, drawTrace } from '../engine/trace.js';
import { createSparks } from '../engine/sparks.js';
import { createAgents, stepAgent, chipMessage, pickTop } from '../engine/agents.js';
import { buildHeroJobs } from '../engine/heroJobs.js';
import { initSections, updateSections, allSectionsDone, startSection, setItem } from '../engine/sections.js';
import { markIntroSeen, shouldSkipIntro } from './useIntroSeen.js';
import { useScrollLock } from './useScrollLock.js';

export function useBuildLoop(build) {
  const lock = useScrollLock(() => {
    const s = build.refs.current.root;
    return s && s.parentElement;
  });

  useEffect(() => {
    const R = build.refs.current;
    const st = build.state.current;
    const root = R.root ? R.root.parentElement : null;
    const caret = {};
    const sparks = createSparks();
    const skip = shouldSkipIntro();
    st.skip = skip;
    st.complete = false;
    st.flashAt = 0;
    st.t = 0;
    const w0 = window.innerWidth;
    const agents = createAgents(w0);
    const center = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    };
    const jobs = buildHeroJobs({
      logoCenter: () => center(R.logo),
      caret: (k) => caret[k] || null,
      trace: (name, u) => tracePt(R[name], u),
      prismPoint: (key, b, i, T) => {
        const api = build.prismApi;
        return api && api.getPoint ? api.getPoint(key, b, i, T) : null;
      },
    });
    let sections = [];
    let chipHidden = false;
    let fabOn = null;
    let heroDone = false;

    const S = (el, o, tr) => {
      if (!el) return;
      el.style.opacity = o;
      if (tr !== undefined) el.style.transform = tr;
    };
    const applyHero = (t) => {
      if (R.heroBg) R.heroBg.style.opacity = easeOut(seg(t, 0, 2000));
      const lg = easeOut(seg(t, 400, 1400));
      S(R.logo, lg, `scale(${0.7 + 0.3 * lg})`);
      // nav.links / nav.cta nao existem nesta pagina (menu e overlay): refs ausentes viram null.
      caret.links = reveal(R.links, seg(t, 700, 1800));
      S(R.cta, easeOut(seg(t, 1900, 2200)));
      S(R.kLine, 1, `scaleX(${easeOut(seg(t, 1600, 2000))})`);
      caret.kicker = reveal(R.kText, seg(t, 1800, 2500));
      caret.h1 = reveal(R.h1, seg(t, 2100, 4600));
      caret.p = reveal(R.p, seg(t, 4000, 5400));
      S(R.btn1, easeOut(seg(t, 5650, 5950)));
      S(R.btn2, easeOut(seg(t, 5950, 6250)));
      if (R.role) R.role.style.opacity = st.complete ? 1 : 0;
    };
    const setFab = (on) => {
      const f = R.fab;
      if (!f || fabOn === on) return;
      fabOn = on;
      f.style.opacity = on ? 1 : 0;
      f.style.pointerEvents = on ? 'auto' : 'none';
      f.tabIndex = on ? 0 : -1;
      if (on) f.removeAttribute('aria-hidden');
      else f.setAttribute('aria-hidden', 'true');
    };

    lock(true);
    window.scrollTo(0, 0);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    applyHero(skip ? END + 2000 : 0);
    sections = initSections(root);

    // Relogio como o modelo: t0 = instante do mount (effect) + 250; t = (now - t0) * SPEED. Sem esperar nada.
    const t0 = skip ? performance.now() - (END + 2000) / SPEED : performance.now() + 250;

    let sectionsRevealed = false;
    const frame = (now, dt) => {
      const t = Math.max(0, now - t0) * SPEED;
      st.t = t;
      // Depois de complete a hero esta no estado final: aplica mais um frame (role) e para.
      if (!heroDone) {
        applyHero(t);
        if (st.complete) heroDone = true;
      }
      setFab(st.complete && t > END + 900);

      const c = R.agents;
      if (!c) {
        // Sem canvas dos agentes: ainda assim conclui a intro (destrava scroll) e atualiza o chip.
        if (t >= END && !st.complete) {
          st.complete = true;
          st.flashAt = skip ? 0 : performance.now();
          markIntroSeen();
          lock(false);
        }
        // Sem canvas nao ha como desenhar a construcao: revela as secoes de uma vez.
        if (st.complete && !sectionsRevealed) {
          sectionsRevealed = true;
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
        const m = chipMessage({ t, complete: st.complete, gather: t >= GATHER && t < END, top: null });
        if (R.chip) {
          R.chip.set(m.msg, m.pct);
          R.chip.setVisible(!(st.complete && t > END + 1100));
        }
        return;
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const T = now / 1000;
      if (!st.complete || t < END + 600) {
        drawTrace(ctx, R.cta, seg(t, 1300, 2000), 1 - seg(t, 2000, 2400));
        drawTrace(ctx, R.btn1, seg(t, 5100, 5700), 1 - seg(t, 5750, 6150));
        drawTrace(ctx, R.btn2, seg(t, 5400, 6000), 1 - seg(t, 6050, 6450));
        for (const k of ['links', 'kicker', 'h1', 'p']) {
          const cr = caret[k];
          if (!cr) continue;
          ctx.fillStyle = `rgba(244,245,248,${Math.floor(now / 110) % 2 ? 0.95 : 0.4})`;
          ctx.fillRect(cr[0], cr[1] - cr[2] * 0.42, 2, cr[2] * 0.84);
        }
      }
      if (st.complete) updateSections(sections, now, ctx, sparks);
      const api = build.prismApi;
      let pc = api && api.getCenter ? api.getCenter() : null;
      if (!pc) pc = center(R.prism);
      const pcx = pc ? pc[0] : w / 2;
      const pcy = pc ? pc[1] : h / 2;
      const gather = t >= GATHER && t < END;
      if (t >= END && !st.complete) {
        st.complete = true;
        st.flashAt = skip ? 0 : now;
        markIntroSeen();
        if (!skip) {
          agents.forEach((a) => sparks.burst(a.x, a.y, 16, a.col));
          sparks.burst(pcx, pcy, 30, LIME);
        }
        lock(false);
      }
      const allDone = st.complete && allSectionsDone(sections);
      let top = null;
      ctx.font = "10px 'Roboto Mono', monospace";
      agents.forEach((a, i) => {
        const r = stepAgent(ctx, a, i, {
          dt,
          t,
          T,
          now,
          w,
          h,
          complete: st.complete,
          gather,
          pcx,
          pcy,
          allDone,
          jobs,
          sections,
          sparks,
        });
        top = pickTop(top, r.top);
      });
      sparks.step(ctx, dt);
      const { msg, pct } = chipMessage({ t, complete: st.complete, gather, top });
      const chip = R.chip;
      if (chip) {
        chip.set(msg, pct);
        const hide = st.complete && t > END + 1100;
        if (hide !== chipHidden) {
          chipHidden = hide;
          chip.setVisible(!hide);
        }
      }
    };
    const unsub = subscribe((now, dt) => {
      try {
        frame(now, dt);
      } catch (e) {
        console.error('landing frame', e);
      }
    });
    return () => {
      unsub();
      lock(false);
    };
  }, [build, lock]);
}
