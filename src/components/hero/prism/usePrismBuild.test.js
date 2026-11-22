import { describe, expect, it } from 'vitest';
import { STANDALONE_DELAY, standaloneState } from './usePrismBuild.js';

describe('standaloneState', () => {
  it('fica em b=0 antes do inicio e ate t=2600', () => {
    expect(standaloneState(1000, 500).b).toBe(0);
    expect(standaloneState(0, 2600 / 2.1).b).toBe(0);
  });
  it('chega a b=1 em t=6600 (delta*2,1)', () => {
    expect(standaloneState(0, 6600 / 2.1).b).toBeCloseTo(1, 5);
    expect(standaloneState(0, 10000).b).toBe(1);
  });
  it('b e a meio caminho em t=4600', () => {
    expect(standaloneState(0, 4600 / 2.1).b).toBeCloseTo(0.5, 5);
  });
  it('atraso de 250 ms', () => {
    expect(STANDALONE_DELAY).toBe(250);
  });
});

describe('standaloneState flash', () => {
  it('flashAt so depois de t >= 7300', () => {
    expect(standaloneState(0, 7000 / 2.1).flashAt).toBe(0);
    expect(standaloneState(0, 7400 / 2.1).flashAt).toBeCloseTo(7300 / 2.1, 5);
  });
});
