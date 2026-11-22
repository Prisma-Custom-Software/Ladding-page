import { describe, it, expect } from 'vitest';
import { startSection, sectionTask, itemDuration, allSectionsDone } from './sections.js';

const fakeEl = (text, tag = 'p') => ({ textContent: text, tagName: tag.toUpperCase(), style: {} });

describe('startSection', () => {
  it('agenda itens alternando os agentes do par, em fila por agente', () => {
    const S = {
      name: '#x',
      pair: [2, 3],
      started: false,
      items: [
        { kind: 'type', el: fakeEl('abc', 'h2') },
        { kind: 'block', el: fakeEl('') },
        { kind: 'icon', el: fakeEl('') },
        { kind: 'type', el: fakeEl('x'.repeat(200)) },
      ],
    };
    startSection(S, 1000);
    const [a, b, c, d] = S.items;
    expect(S.started).toBe(true);
    expect([a.ag, b.ag, c.ag, d.ag]).toEqual([2, 3, 2, 3]);
    expect(a.s).toBe(1120);
    expect(b.s).toBe(1210);
    expect(a.e).toBe(1120 + itemDuration('type', 3));
    expect(c.s).toBe(a.e + 70);
    expect(d.e - d.s).toBe(900);
    expect(a.label).toBe('type(#x.h2)');
    expect(b.label).toBe('draw(#x.block)');
    expect(c.label).toBe('ignite(#x.icon)');
  });
});

describe('sectionTask', () => {
  it('devolve null sem secao iniciada ou fora da janela do item', () => {
    const S = { started: false, items: [] };
    expect(sectionTask([S], 0, 0)).toBeNull();
    const it = { ag: 0, s: 100, e: 200, kind: 'type', caret: [5, 6, 20], label: 'l' };
    expect(sectionTask([{ started: true, items: [it] }], 0, 50)).toBeNull();
    expect(sectionTask([{ started: true, items: [it] }], 0, 150)).toMatchObject({ x: 5, y: 6, lbl: 'l' });
    expect(sectionTask([{ started: true, items: [it] }], 1, 150)).toBeNull();
  });
  it('allSectionsDone exige todas iniciadas e concluidas', () => {
    expect(allSectionsDone([])).toBe(false);
    expect(allSectionsDone([{ started: true, items: [{ done: true }] }])).toBe(true);
    expect(allSectionsDone([{ started: true, items: [{ done: false }] }])).toBe(false);
  });
});
