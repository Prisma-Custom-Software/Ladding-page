import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('loop', () => {
  let rafCbs;
  let hidden;
  let now;
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    rafCbs = [];
    hidden = false;
    now = 1000;
    vi.stubGlobal('requestAnimationFrame', (cb) => rafCbs.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.stubGlobal('performance', { now: () => now });
    vi.stubGlobal('document', {
      get hidden() {
        return hidden;
      },
      addEventListener: () => {},
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const runRaf = (t) => {
    const cbs = rafCbs;
    rafCbs = [];
    cbs.forEach((cb) => cb(t));
  };

  it('chama callbacks e limita dt a 0.05', async () => {
    const { subscribe } = await import('./loop.js');
    const cb = vi.fn();
    const un = subscribe(cb);
    runRaf(5000);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][1]).toBe(0.05);
    runRaf(5016);
    expect(cb.mock.calls[1][1]).toBeCloseTo(0.016, 5);
    un();
  });

  it('unsubscribe para as chamadas', async () => {
    const { subscribe } = await import('./loop.js');
    const cb = vi.fn();
    const un = subscribe(cb);
    runRaf(1016);
    un();
    runRaf(1032);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('usa setTimeout(33) com aba oculta', async () => {
    hidden = true;
    const { subscribe } = await import('./loop.js');
    const cb = vi.fn();
    const un = subscribe(cb);
    expect(rafCbs.length).toBe(0);
    now = 1033;
    vi.advanceTimersByTime(33);
    expect(cb).toHaveBeenCalledTimes(1);
    un();
  });

  it('excecao em callback nao derruba o loop', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { subscribe } = await import('./loop.js');
    const bad = vi.fn(() => {
      throw new Error('x');
    });
    const good = vi.fn();
    const u1 = subscribe(bad);
    const u2 = subscribe(good);
    runRaf(1016);
    expect(good).toHaveBeenCalledTimes(1);
    runRaf(1032);
    expect(good).toHaveBeenCalledTimes(2);
    expect(err).toHaveBeenCalled();
    u1();
    u2();
  });
});
