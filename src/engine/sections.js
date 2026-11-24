// Agendamento da animacao das secoes ao rolar (porte 1:1 de initSections/startSection/setItem/
// updateSections/sectionTask do modelo). Sem React: recebe o elemento raiz e o objeto de faiscas.
import { seg, easeOut, mix } from './math.js';
import { reveal } from './reveal.js';
import { tracePt, drawTrace } from './trace.js';

export function setItem(it, now) {
  const el = it.el;
  if (it.kind === 'type') {
    it.caret = reveal(el, now < 0 ? 0 : seg(now, it.s, it.e));
  } else if (it.kind === 'block') {
    el.style.opacity = now < 0 ? 0 : easeOut(seg(now, it.s + (it.e - it.s) * 0.72, it.e));
  } else if (it.kind === 'icon') {
    const p = el.querySelector('path');
    const u = now < 0 ? 0 : easeOut(seg(now, it.s, it.e));
    if (p) p.style.strokeDashoffset = 1 - u;
    const f = now < 0 ? 0 : Math.max(0, 1 - Math.abs(now - it.e) / 400);
    el.style.filter = f > 0.01 ? `drop-shadow(0 0 ${10 * f}px #B8FF3A) brightness(${1 + f})` : 'none';
  }
}

export function initSections(root) {
  if (!root) return [];
  return [...root.querySelectorAll('[data-sec]')].map((el) => {
    let pair = [0, 1];
    try {
      pair = JSON.parse(el.getAttribute('data-ags'));
    } catch {
      /* mantem [0,1] */
    }
    const items = [...el.querySelectorAll('[data-b]')].map((x) => ({
      el: x,
      kind: x.getAttribute('data-b'),
      done: false,
    }));
    items.forEach((it) => setItem(it, -1));
    return { el, name: el.id ? '#' + el.id : 'section', pair, items, started: false, light: el.hasAttribute('data-light') };
  });
}

// Duracao de cada item por tipo.
export const itemDuration = (kind, len) => (kind === 'type' ? Math.min(900, 260 + len * 10) : kind === 'block' ? 600 : 420);

export function startSection(S, now) {
  S.started = true;
  const tA = {};
  S.pair.forEach((a, k) => {
    tA[a] = now + 120 + k * 90;
  });
  S.items.forEach((it, i) => {
    const a = S.pair[i % S.pair.length];
    const len = (it.el.textContent || '').trim().length;
    const dur = itemDuration(it.kind, len);
    it.ag = a;
    it.s = tA[a];
    it.e = it.s + dur;
    tA[a] = it.e + 70;
    it.label =
      it.kind === 'type'
        ? `type(${S.name}.${it.el.tagName.toLowerCase()})`
        : it.kind === 'block'
          ? `draw(${S.name}.block)`
          : `ignite(${S.name}.icon)`;
  });
}

// sparks: objeto de createSparks(). ctx: canvas 2D dos agentes.
export function updateSections(sections, now, ctx, sparks) {
  for (const S of sections) {
    if (!S.started) {
      const r = S.el.getBoundingClientRect();
      if (r.top < innerHeight * 0.8 && r.bottom > 0) startSection(S, now);
      else continue;
    }
    for (const it of S.items) {
      if (it.done) continue;
      setItem(it, now);
      if (it.kind === 'block')
        drawTrace(ctx, it.el, seg(now, it.s, it.s + (it.e - it.s) * 0.75), 1 - seg(now, it.e, it.e + 450), S.light);
      if (it.kind === 'type' && it.caret && now >= it.s && now < it.e) {
        ctx.fillStyle = S.light
          ? `rgba(11,18,32,${Math.floor(now / 110) % 2 ? 0.95 : 0.35})`
          : `rgba(244,245,248,${Math.floor(now / 110) % 2 ? 0.95 : 0.4})`;
        ctx.fillRect(it.caret[0], it.caret[1] - it.caret[2] * 0.42, 2, it.caret[2] * 0.84);
      }
      if (now >= it.e && !it.burst) {
        it.burst = true;
        const r = it.el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight)
          sparks.burst(
            it.kind === 'type' ? r.left + Math.min(r.width, 40) : r.right,
            r.top + Math.min(r.height, 40) / 2,
            it.kind === 'icon' ? 14 : 8,
            mix(it.ag / 4)
          );
      }
      if (now > it.e + 500) {
        it.done = true;
        it.caret = null;
        if (it.kind === 'block') it.el.style.opacity = '';
        if (it.kind === 'icon') it.el.style.filter = '';
      }
    }
  }
}

// Tarefa atual do agente `a` nas secoes: {x,y,ox,oy,lbl} ou null.
export function sectionTask(sections, a, now) {
  for (const S of sections) {
    if (!S.started) continue;
    for (const it of S.items) {
      if (it.ag !== a || now < it.s || now >= it.e) continue;
      let pt = null;
      let ox = 0;
      let oy = -30;
      if (it.kind === 'type') {
        pt = it.caret;
        oy = -32;
      } else if (it.kind === 'block') {
        pt = tracePt(it.el, seg(now, it.s, it.s + (it.e - it.s) * 0.75));
        oy = -26;
        ox = 10;
      } else {
        const r = it.el.getBoundingClientRect();
        pt = [r.left + r.width / 2, r.top + r.height / 2];
        ox = 30;
        oy = -24;
      }
      if (pt) return { x: pt[0], y: pt[1], ox, oy, lbl: it.label };
    }
  }
  return null;
}

export const allSectionsDone = (sections) =>
  sections.length > 0 && sections.every((S) => S.started && S.items.every((it) => it.done));

// Comprime o agendamento de uma secao ja iniciada para caber em `budget` ms a partir de `now`
// (pagina de projetos: cada secao inteira construida em ate 1,5 s). Mantem ordem e proporcoes.
export function compressSection(S, now, budget) {
  const end = Math.max(...S.items.map((it) => it.e), now);
  const span = end - now;
  if (span <= budget) return S;
  const k = budget / span;
  for (const it of S.items) {
    it.s = now + (it.s - now) * k;
    it.e = now + (it.e - now) * k;
  }
  return S;
}
