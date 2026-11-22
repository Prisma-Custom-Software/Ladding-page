import { describe, it, expect } from 'vitest';
import { createNetwork } from './network.js';

function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fakeCanvas(w, h) {
  const calls = [];
  const ctx = new Proxy(
    {},
    {
      get: (_, k) => {
        if (k === 'createRadialGradient') return () => ({ addColorStop() {} });
        return (...args) => calls.push([k, ...args]);
      },
      set: () => true,
    },
  );
  return {
    clientWidth: w,
    clientHeight: h,
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ bottom: h }),
    getContext: () => ctx,
    calls,
  };
}

describe('network', () => {
  it('cria no maximo 90 nos e usa w*h/16000', () => {
    const c = fakeCanvas(800, 900);
    const net = createNetwork(c, seeded(1));
    net.init();
    expect(net.state.nodes.length).toBe(Math.round((800 * 900) / 16000));
    const big = fakeCanvas(3000, 2000);
    const n2 = createNetwork(big, seeded(1));
    n2.init();
    expect(n2.state.nodes.length).toBe(90);
  });

  it('e deterministico com o mesmo PRNG', () => {
    const a = createNetwork(fakeCanvas(1440, 900), seeded(7));
    const b = createNetwork(fakeCanvas(1440, 900), seeded(7));
    a.init();
    b.init();
    expect(a.state.nodes).toEqual(b.state.nodes);
  });

  it('nos envolvem nas bordas e ligacoes sao desenhadas', () => {
    const c = fakeCanvas(300, 300);
    const net = createNetwork(c, seeded(3));
    net.init();
    net.state.nodes[0].x = -25;
    net.state.nodes[0].vx = 0;
    net.draw(0.016);
    expect(net.state.nodes[0].x).toBe(320);
    expect(c.calls.some((x) => x[0] === 'stroke')).toBe(true);
  });
});
