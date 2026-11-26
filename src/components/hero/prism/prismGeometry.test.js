import { describe, expect, it } from 'vitest';
import {
  LINES, PW, TRI, buildRibbon, buildTriangle, computePrismValues, holeZ, polylineLength, polylinePoint,
  prismPointSvg, svgToWorld, trianglePoint,
} from './prismGeometry.js';
import { hexToRgb } from './gradientMaterial.js';
import { PRISM0, PRISM1, standaloneState } from './usePrismBuild.js';

describe('prismGeometry', () => {
  it('converte SVG para mundo', () => {
    expect(svgToWorld(100, 97)).toEqual([0, -0]);
    const [x, y] = svgToWorld(118, 6);
    expect(x).toBeCloseTo(0.18);
    expect(y).toBeCloseTo(0.91);
  });

  it('b=0: tudo escondido', () => {
    const v = computePrismValues(0, 0, 0);
    expect(v.edges.progress).toBe(0);
    expect(v.inner.progress).toBe(0);
    expect(v.slides.faceL.opacity).toBe(0);
    expect(v.hole.scale).toBeCloseTo(0.4);
    expect(v.glow).toBe(0);
    expect(v.bodyDy).toBe(0);
    expect(v.filter).toBe('drop-shadow(0 0 30px rgba(123,108,255,0.3))');
  });

  it('b=1: pronto, flutua e pisca', () => {
    const now = 1000;
    const v = computePrismValues(1, now, 0);
    expect(v.edges.progress).toBe(1);
    expect(v.edges.opacity).toBeCloseTo(0.45);
    expect(v.inner.opacity).toBeCloseTo(0.6);
    expect(v.slides.botR).toEqual({ opacity: 1, dx: 0, dy: 0 });
    expect(v.hole.scale).toBe(1);
    expect(v.sheen).toBeCloseTo(0.55);
    expect(v.sheen2).toBeCloseTo(0.45);
    expect(v.bodyDy).toBeCloseTo(Math.sin(0.9) * 5);
    expect(v.apex).toBeCloseTo(0.55 + 0.45 * Math.sin(2) ** 2);
  });

  it('flash decai em 900 ms', () => {
    const v = computePrismValues(1, 450, 1);
    expect(v.flash).toBeGreaterThan(0.4);
    expect(v.filter).toContain('brightness(');
    expect(computePrismValues(1, 5000, 100).flash).toBe(0);
  });

  it('janelas PW respeitadas', () => {
    expect(computePrismValues(PW.faceL[0], 0).slides.faceL.opacity).toBe(0);
    expect(computePrismValues(PW.faceL[1], 0).slides.faceL.opacity).toBe(1);
  });

  it('polilinhas', () => {
    expect(polylineLength(LINES.edges)).toBeCloseTo(
      Math.hypot(112, 132) + Math.hypot(116, 46) + Math.hypot(72, 34) + Math.hypot(76, 144),
    );
    expect(polylinePoint(LINES.edges, 0)).toEqual([118, 6]);
    expect(polylinePoint(LINES.edges, 1)[0]).toBeCloseTo(118);
    expect(polylinePoint(LINES.rim, 1)).toEqual([124, 118]);
  });

  it('prismPointSvg', () => {
    expect(prismPointSvg('apex', 1, 0, 0)).toEqual([118, 6]);
    expect(prismPointSvg('edges', 0, 0, 0)).toEqual([118, 6]);
    expect(prismPointSvg('xyz', 1, 0, 0)).toBeNull();
    const p = prismPointSvg('faceL', 1, 2, 1.3);
    expect(p).toEqual(trianglePoint(TRI.faceL, 2, 1.3));
  });

  it('buffers', () => {
    const t = buildTriangle(TRI.faceL);
    expect(t.positions).toHaveLength(9);
    expect(t.positions[8]).toBeCloseTo(0.35); // ponta C
    const r = buildRibbon(LINES.edges, 1.6);
    expect(r.aLen.length * 3).toBe(r.positions.length);
    expect(Math.max(...r.aLen)).toBeCloseTo(1);
    expect(Math.max(...r.index)).toBeLessThan(r.aLen.length);
  });

  it('z do furo no plano de faceL', () => {
    expect(holeZ([118, 6])).toBeCloseTo(0.002);
    expect(holeZ([124, 118])).toBeCloseTo(0.352);
  });

  it('hexToRgb e relogio standalone', () => {
    expect(hexToRgb('#FF0000')).toEqual([1, 0, 0]);
    expect(standaloneState(1000, 1000).b).toBe(0);
    expect(standaloneState(0, (PRISM1 / 4.5) + 1).b).toBe(1);
    expect(standaloneState(0, PRISM0 / 4.5).b).toBeCloseTo(0);
  });
});
