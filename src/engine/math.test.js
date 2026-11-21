import { describe, it, expect } from 'vitest';
import { clamp, seg, easeOut, mix, rgba, LIME, LILAC } from './math.js';

describe('math', () => {
  it('clamp limita a 0..1', () => {
    expect(clamp(-3)).toBe(0);
    expect(clamp(0.4)).toBe(0.4);
    expect(clamp(9)).toBe(1);
  });
  it('seg normaliza o intervalo', () => {
    expect(seg(0, 100, 200)).toBe(0);
    expect(seg(150, 100, 200)).toBe(0.5);
    expect(seg(300, 100, 200)).toBe(1);
  });
  it('easeOut', () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeCloseTo(0.875, 10);
  });
  it('mix interpola lima -> lilas', () => {
    expect(mix(0)).toEqual(LIME);
    expect(mix(1)).toEqual(LILAC);
    expect(mix(0.5)).toEqual([154, 182, 157]);
  });
  it('rgba formata a cor', () => {
    expect(rgba([1, 2, 3], 0.5)).toBe('rgba(1,2,3,0.5)');
  });
});
