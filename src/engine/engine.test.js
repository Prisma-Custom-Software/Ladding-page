import { describe, it, expect } from 'vitest';
import { PRISM0, PRISM1, GATHER, END, SPEED, PW, pb } from './timeline.js';
import { tracePtRect } from './trace.js';
import { buildHeroJobs } from './heroJobs.js';
import { startSection, itemDuration } from './sections.js';
import { createSparks } from './sparks.js';
import { createAgents, idleTarget, pickTop, chipMessage } from './agents.js';

describe('timeline', () => {
  it('constantes do modelo', () => {
    expect([PRISM0, PRISM1, GATHER, END, SPEED]).toEqual([2600, 6600, 6700, 7300, 2.1]);
    expect(PW.apex).toEqual([0.88, 1]);
    expect(pb(2600)).toBe(0);
    expect(pb(4600)).toBe(0.5);
    expect(pb(9000)).toBe(1);
  });
});

describe('tracePtRect', () => {
  const r = { left: 10, top: 20, right: 110, bottom: 70, width: 100, height: 50 };
  it('percorre o perimetro', () => {
    expect(tracePtRect(r, 0)).toEqual([10, 20]);
    expect(tracePtRect(r, 100 / 300)).toEqual([110, 20]);
    expect(tracePtRect(r, 150 / 300)).toEqual([110, 70]);
    expect(tracePtRect(r, 250 / 300)).toEqual([10, 70]);
  });
});

describe('sparks', () => {
  it('burst cria n faiscas e step as consome', () => {
    let n = 0;
    const s = createSparks(() => ((n += 0.37) % 1));
    s.burst(0, 0, 8, [1, 2, 3]);
    expect(s.list.length).toBe(8);
    s.step(null, 0.1);
    expect(s.list[0].life).toBeCloseTo(0.83);
    s.step(null, 1);
    expect(s.list.length).toBe(0);
  });
});

const fakeEl = (text, tag = 'P') => ({ textContent: text, tagName: tag });
describe('sections', () => {
  it('duracoes', () => {
    expect(itemDuration('type', 10)).toBe(360);
    expect(itemDuration('type', 200)).toBe(900);
    expect(itemDuration('block', 5)).toBe(600);
    expect(itemDuration('icon', 5)).toBe(420);
  });
  it('agenda com rodizio de agentes e +70 ms', () => {
    const S = {
      name: '#sobre',
      pair: [2, 3],
      items: [
        { el: fakeEl('x'.repeat(20)), kind: 'type' },
        { el: fakeEl(''), kind: 'block' },
        { el: fakeEl('y'.repeat(10), 'H2'), kind: 'type' },
        { el: fakeEl(''), kind: 'icon' },
      ],
    };
    startSection(S, 1000);
    const [a, b, c, d] = S.items;
    expect(a.ag).toBe(2);
    expect(a.s).toBe(1120);
    expect(a.e).toBe(1120 + 460);
    expect(b.ag).toBe(3);
    expect(b.s).toBe(1210);
    expect(b.e).toBe(1810);
    expect(c.ag).toBe(2);
    expect(c.s).toBe(a.e + 70);
    expect(c.label).toBe('type(#sobre.h2)');
    expect(d.ag).toBe(3);
    expect(d.s).toBe(b.e + 70);
    expect(d.e).toBe(d.s + 420);
    expect(a.label).toBe('type(#sobre.p)');
    expect(b.label).toBe('draw(#sobre.block)');
    expect(d.label).toBe('ignite(#sobre.icon)');
    expect(S.started).toBe(true);
  });
});

describe('heroJobs', () => {
  const calls = [];
  const jobs = buildHeroJobs({
    logoCenter: () => [1, 2],
    caret: (k) => ['caret', k],
    trace: (n, u) => ['trace', n, u],
    prismPoint: (key, b, i) => {
      calls.push([key, b, i]);
      return [0, 0];
    },
  });
  it('tem 18 tarefas na ordem do modelo', () => {
    expect(jobs.length).toBe(18);
    expect(jobs[0]).toMatchObject({ ag: 0, s: 400, e: 1400, label: 'mount(nav.logo)', ox: 22, oy: 26 });
    expect(jobs[8].label).toBe('trace(prism.edges)');
    expect(jobs[17]).toMatchObject({ ag: 2, label: 'ignite(apex)', ox: 0, oy: -34 });
  });
  it('janelas do prisma', () => {
    const j = jobs[8];
    expect(j.s).toBe(2600);
    expect(j.e).toBeCloseTo(2600 + 0.3 * 4000);
    expect(jobs[17].s).toBeCloseTo(2600 + 0.9 * 4000);
    expect(jobs[17].e).toBe(6600);
  });
  it('getters sao repassados', () => {
    expect(jobs[0].fn()).toEqual([1, 2]);
    expect(jobs[1].fn()).toEqual(['caret', 'links']);
    expect(jobs[2].fn(0.5)).toEqual(['trace', 'cta', 0.5]);
    jobs[8].fn(0, 0, 4600);
    expect(calls[0]).toEqual(['edges', 0.5, 3]);
  });
});

describe('agents', () => {
  it('cria 5 agentes', () => {
    const a = createAgents(1000);
    expect(a.map((x) => x.id)).toEqual(['ag.01', 'ag.02', 'ag.03', 'ag.04', 'ag.05']);
    expect(a[1].x).toBeCloseTo(325);
    expect(a[2].y).toBe(-88);
  });
  it('alvo de reuniao e ocioso', () => {
    const [x, y] = idleTarget(0, { w: 1000, h: 800, T: 0, complete: false, gather: true, pcx: 500, pcy: 400 });
    expect(x).toBeCloseTo(546);
    expect(y).toBeCloseTo(400);
    const [cx] = idleTarget(1, { w: 1000, h: 800, T: 0, complete: true, gather: false });
    expect(cx).toBeCloseTo(1000 - 40 - 34 + Math.sin(2) * 10);
  });
  it('pickTop e chip', () => {
    expect(pickTop(null, { s: 5 })).toEqual({ s: 5 });
    expect(pickTop({ s: 9 }, { s: 5 })).toEqual({ s: 9 });
    expect(chipMessage({ t: 0, top: null }).msg).toBe('iniciando agentes');
    expect(chipMessage({ t: 3650, top: { id: 'ag.01', lbl: 'x' } })).toEqual({ msg: 'ag.01 › x', pct: 50 });
    expect(chipMessage({ t: 7300, complete: true }).msg).toBe('Complete');
    expect(chipMessage({ t: 7000, gather: true }).msg).toBe('commit(hero)');
  });
});
