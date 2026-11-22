// Geometria e matematica pura do prisma (sem three / sem DOM). Coordenadas SVG do modelo:
// viewBox "0 -6 200 206", y para baixo. Mundo 3D: x=(sx-100)/100, y=-(sy-97)/100 (1 unidade SVG = 0.01).
import { clamp, easeOut } from '../../../engine/math.js';

export const VIEWBOX = [0, -6, 200, 206];
export const UNIT = 0.01;
// Margem (em unidades SVG) que o canvas ocupa alem do viewBox: o SVG original tem overflow:visible
// (brilho do chao em y ate 202, pecas deslizando antes de assentar).
export const CANVAS_MARGIN = 36;

export const PW = {
  edges: [0, 0.3],
  inner: [0.1, 0.38],
  faceL: [0.3, 0.52],
  faceR: [0.38, 0.6],
  botL: [0.48, 0.68],
  botR: [0.55, 0.75],
  hole: [0.66, 0.82],
  sheen: [0.8, 0.98],
  rim: [0.8, 0.98],
  apex: [0.88, 1],
};

export const SLIDE = { faceL: [-10, -4], faceR: [10, -4], botL: [-8, 10], botR: [8, 10] };

export const V = { A: [118, 6], L: [6, 138], R: [194, 150], B: [122, 184], C: [124, 118] };
export const C_Z = 0.35;
export const HOLE_Z_BIAS = 0.002;

export const TRI = {
  faceL: [V.A, V.L, V.C],
  faceR: [V.A, V.C, V.R],
  botL: [V.L, V.C, V.B],
  botR: [V.C, V.R, V.B],
  hole: [[110, 42], [46, 120], [114, 104]],
  sheen: [V.A, V.C, [140, 92]],
  sheen2: [V.A, [90, 40], [106, 46]],
};

// Polilinhas (sub-caminhos) das linhas; closed = ultimo segmento volta ao primeiro ponto.
export const LINES = {
  inner: { subpaths: [[V.A, V.C], [V.L, V.C, V.R], [V.C, V.B]], closed: false },
  edges: { subpaths: [[V.A, V.L, V.B, V.R]], closed: true },
  rim: { subpaths: [[V.A, V.L], [V.A, V.C]], closed: false },
};

export const APEX = { cx: 118, cy: 6, r: 15 };
export const GLOW = { cx: 112, cy: 192, rx: 96, ry: 10 };

export const svgToWorld = (sx, sy) => [(sx - 100) * UNIT, -(sy - 97) * UNIT];

// z 3D por vertice SVG: so a ponta C sai do plano.
export function vertexZ(p) {
  return p[0] === V.C[0] && p[1] === V.C[1] ? C_Z : 0;
}

// z do furo: coordenadas baricentricas sobre o plano de faceL (+ bias para nao cruzar).
export function holeZ(p) {
  const [a, b, c] = TRI.faceL;
  const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  const w0 = ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) / d;
  const w1 = ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) / d;
  const w2 = 1 - w0 - w1;
  return w0 * vertexZ(a) + w1 * vertexZ(b) + w2 * vertexZ(c) + HOLE_Z_BIAS;
}

export function bbox(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { min: [x0, y0], max: [x1, y1] };
}

// Estagios 0..1 de cada peca (easeOut dentro da janela PW) para o progresso b.
export const stage = (key, b) => easeOut(clamp((b - PW[key][0]) / (PW[key][1] - PW[key][0])));

// Todos os valores animados do prisma para (b, now em ms, flashAt em ms). Identico ao applyPrism do modelo.
export function computePrismValues(b, now, flashAt = 0) {
  const r = (k) => stage(k, b);
  const rim = r('rim');
  const out = {
    edges: { progress: r('edges'), opacity: 1 - 0.55 * rim },
    inner: { progress: r('inner'), opacity: 1 - 0.4 * rim },
    slides: {},
    hole: { opacity: 0, scale: 0.4 },
  };
  for (const k in SLIDE) {
    const e = r(k), u = 1 - e;
    out.slides[k] = { opacity: e, dx: SLIDE[k][0] * u, dy: SLIDE[k][1] * u };
  }
  const h = r('hole');
  out.hole = { opacity: h, scale: 0.4 + 0.6 * h };
  out.sheen = 0.55 * r('sheen');
  out.sheen2 = 0.45 * r('sheen');
  out.rim = rim;
  out.glow = r('apex');
  const T = now / 1000;
  out.apex = b >= 1 ? 0.55 + 0.45 * Math.sin(T * 2) ** 2 : r('apex');
  out.bodyDy = b >= 1 ? Math.sin(T * 0.9) * 5 : 0; // unidades SVG, y para baixo
  const f = flashAt ? Math.max(0, 1 - (now - flashAt) / 900) : 0;
  out.flash = f;
  out.filter =
    `drop-shadow(0 0 ${30 + 30 * f}px rgba(123,108,255,${0.3 + 0.4 * f}))` +
    (f > 0.01 ? ` brightness(${1 + f * 0.7})` : '');
  return out;
}

// Comprimento total (concatenando sub-caminhos, como getTotalLength do SVG) e ponto na distancia d.
export function polylineLength(line) {
  let total = 0;
  for (const sp of line.subpaths) {
    const pts = line.closed ? [...sp, sp[0]] : sp;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return total;
}

export function polylinePoint(line, frac) {
  let d = polylineLength(line) * clamp(frac);
  let last = line.subpaths[0][0];
  for (const sp of line.subpaths) {
    const pts = line.closed ? [...sp, sp[0]] : sp;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], c = pts[i], l = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (d <= l) {
        const k = l ? d / l : 0;
        return [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k];
      }
      d -= l;
      last = c;
    }
  }
  return [last[0], last[1]];
}

// Ponto baricentrico oscilante (u,v refletido se u+v>1), igual ao modelo.
export function trianglePoint(P, i, T) {
  let u = 0.5 + 0.45 * Math.sin(T * 5 + i * 1.7), v = 0.5 + 0.45 * Math.sin(T * 3.3 + i);
  if (u + v > 1) { u = 1 - u; v = 1 - v; }
  return [
    P[0][0] + u * (P[1][0] - P[0][0]) + v * (P[2][0] - P[0][0]),
    P[0][1] + u * (P[1][1] - P[0][1]) + v * (P[2][1] - P[0][1]),
  ];
}

// Ponto SVG (sx, sy) que o agente i esta "construindo" em `key`, ou null.
export function prismPointSvg(key, b, i, T) {
  if (LINES[key]) {
    const w = PW[key];
    return polylinePoint(LINES[key], easeOut(clamp((b - w[0]) / (w[1] - w[0]))));
  }
  if (key === 'apex') return [APEX.cx, APEX.cy];
  if (key === 'glow') return [GLOW.cx, GLOW.cy];
  if (TRI[key]) return trianglePoint(TRI[key], i, T);
  return null;
}

// ---- construcao de buffers (arrays puros) ----

// Triangulo: positions (mundo, relativo a `origin` SVG se dado), aSvg, aLen.
export function buildTriangle(P, { origin = null, zOf = vertexZ } = {}) {
  const positions = [], aSvg = [], aLen = [];
  const o = origin ? svgToWorld(origin[0], origin[1]) : [0, 0];
  for (const p of P) {
    const [wx, wy] = svgToWorld(p[0], p[1]);
    positions.push(wx - o[0], wy - o[1], zOf(p));
    aSvg.push(p[0], p[1]);
    aLen.push(0);
  }
  return { positions, aSvg, aLen, index: [0, 1, 2] };
}

// Leque (circulo/elipse) em unidades SVG.
export function buildFan(cx, cy, rx, ry, n = 72) {
  const positions = [], aSvg = [], aLen = [], index = [];
  const push = (sx, sy) => {
    const [wx, wy] = svgToWorld(sx, sy);
    positions.push(wx, wy, 0);
    aSvg.push(sx, sy);
    aLen.push(0);
  };
  push(cx, cy);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
    index.push(0, 1 + k, 1 + ((k + 1) % n));
  }
  return { positions, aSvg, aLen, index };
}

// Fita (stroke) com juncoes/tampas redondas. width em unidades SVG. aLen = distancia normalizada ao longo
// da concatenacao dos sub-caminhos (usado para "desenhar" o traco como stroke-dashoffset do modelo).
export function buildRibbon(line, width, { origin = null, discSegs = 20 } = {}) {
  const hw = width / 2;
  const positions = [], aSvg = [], aLen = [], index = [];
  const total = polylineLength(line) || 1;
  const o = origin ? svgToWorld(origin[0], origin[1]) : [0, 0];
  const push = (sx, sy, len) => {
    const [wx, wy] = svgToWorld(sx, sy);
    positions.push(wx - o[0], wy - o[1], 0);
    aSvg.push(sx, sy);
    aLen.push(len);
    return positions.length / 3 - 1;
  };
  const disc = (p, len) => {
    const c = push(p[0], p[1], len);
    const first = push(p[0] + hw, p[1], len);
    let prev = first;
    for (let k = 1; k <= discSegs; k++) {
      const a = (k / discSegs) * Math.PI * 2;
      const cur = k === discSegs ? first : push(p[0] + Math.cos(a) * hw, p[1] + Math.sin(a) * hw, len);
      index.push(c, prev, cur);
      prev = cur;
    }
  };
  let run = 0;
  for (const sp of line.subpaths) {
    const pts = line.closed ? [...sp, sp[0]] : sp;
    disc(pts[0], run / total);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], c = pts[i];
      const l = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const nx = (-(c[1] - a[1]) / l) * hw, ny = ((c[0] - a[0]) / l) * hw;
      const l0 = run / total, l1 = (run + l) / total;
      const i0 = push(a[0] + nx, a[1] + ny, l0), i1 = push(a[0] - nx, a[1] - ny, l0);
      const i2 = push(c[0] + nx, c[1] + ny, l1), i3 = push(c[0] - nx, c[1] - ny, l1);
      index.push(i0, i1, i2, i1, i3, i2);
      run += l;
      disc(c, run / total);
    }
  }
  return { positions, aSvg, aLen, index };
}
