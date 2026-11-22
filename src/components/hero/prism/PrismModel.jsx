// Malha 3D do prisma (Three.js puro, sem JSX apesar da extensao): constroi as pecas do modelo SVG e as anima
// com os mesmos valores de `computePrismValues`. Sem luz: ShaderMaterial com gradientes do SVG.
import { BufferAttribute, BufferGeometry, Group, Mesh } from 'three';
import { createGradientMaterial, setOpacity } from './gradientMaterial.js';
import {
  APEX, GLOW, LINES, TRI, UNIT, bbox, buildFan, buildRibbon, buildTriangle, holeZ, svgToWorld,
} from './prismGeometry.js';

function toGeometry({ positions, aSvg, aLen, index }) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  g.setAttribute('aSvg', new BufferAttribute(new Float32Array(aSvg), 2));
  g.setAttribute('aLen', new BufferAttribute(new Float32Array(aLen), 1));
  g.setIndex(index);
  return g;
}

const WHITE = '#FFFFFF';
const FACES = {
  faceL: { vector: [0.05, 1, 0.75, 0], stops: [[0, '#C6FF4D'], [0.5, '#8CF25C'], [1, '#46D9B8']] },
  faceR: { vector: [0.1, 0, 0.9, 1], stops: [[0, '#78C4FF'], [0.45, '#7B6CFF'], [1, '#5A43F0']] },
  botL: { vector: [0, 0, 1, 1], stops: [[0, '#A8F53C'], [1, '#3CC79A']] },
  botR: { vector: [0, 0, 1, 1], stops: [[0, '#9488FF'], [1, '#3F2DC4']] },
};
const SHEEN = [[0, WHITE, 0.75], [1, WHITE, 0]];

export function createPrismModel() {
  const root = new Group();
  const body = new Group();
  const geometries = [];
  const materials = [];
  const parts = {};
  let order = 0;

  const add = (parent, key, geo, mat, { z = 0, pos = null } = {}) => {
    const mesh = new Mesh(toGeometry(geo), mat);
    geometries.push(mesh.geometry);
    materials.push(mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = order++;
    mesh.position.set(pos ? pos[0] : 0, pos ? pos[1] : 0, z);
    parent.add(mesh);
    parts[key] = mesh;
    return mesh;
  };
  const tri = (key, P, opts) => add(body, key, buildTriangle(P), createGradientMaterial({ bbox: bbox(P), ...opts }));

  // 1) brilho do chao (fora do corpo: nao flutua)
  add(
    root,
    'glow',
    buildFan(GLOW.cx, GLOW.cy, GLOW.rx, GLOW.ry),
    createGradientMaterial({
      radial: true,
      bbox: { min: [GLOW.cx - GLOW.rx, GLOW.cy - GLOW.ry], max: [GLOW.cx + GLOW.rx, GLOW.cy + GLOW.ry] },
      stops: [[0, '#9F94FF', 0.55], [0.5, '#B8FF3A', 0.18], [1, '#B8FF3A', 0]],
    }),
  );
  root.add(body);

  // 2) faces
  for (const k of ['faceL', 'faceR', 'botL', 'botR']) tri(k, TRI[k], FACES[k]);

  // 3) furo: grupo no centro da caixa (escala a partir do centro, como transform-box:fill-box)
  const hb = bbox(TRI.hole);
  const hc = [(hb.min[0] + hb.max[0]) / 2, (hb.min[1] + hb.max[1]) / 2];
  const hole = new Group();
  const hw = svgToWorld(hc[0], hc[1]);
  hole.position.set(hw[0], hw[1], 0);
  body.add(hole);
  parts.hole = hole;
  add(
    hole,
    'holeFill',
    buildTriangle(TRI.hole, { origin: hc, zOf: holeZ }),
    createGradientMaterial({ bbox: hb, vector: [0, 0, 0.6, 1], stops: [[0, '#16203A'], [1, '#0B1220']] }),
  );
  const holeLine = { subpaths: [TRI.hole], closed: true };
  add(
    hole,
    'holeStroke',
    buildRibbon(holeLine, 0.8, { origin: hc }),
    createGradientMaterial({ bbox: hb, stops: [[0, '#B8FF3A'], [1, '#B8FF3A']], opacity: 0.35, depth: true }),
    { z: 0.05 },
  );

  // 4) arestas internas
  const ribbon = (key, width, mat, z) => add(body, key, buildRibbon(LINES[key], width), mat, { z });
  const linePts = (k) => LINES[k].subpaths.flat();
  ribbon(
    'inner',
    0.9,
    createGradientMaterial({ bbox: bbox(linePts('inner')), stops: [[0, WHITE], [1, WHITE]], opacity: 0.55, depth: true }),
    0.1,
  );

  // 5) brilhos
  tri('sheen', TRI.sheen, { vector: [0, 0, 0, 1], stops: SHEEN });
  tri('sheen2', TRI.sheen2, { vector: [0, 0, 0, 1], stops: SHEEN });

  // 6) contorno e rim
  ribbon(
    'edges',
    1.6,
    createGradientMaterial({
      bbox: bbox(linePts('edges')),
      vector: [0, 0, 1, 1],
      stops: [[0, '#EFFFD0'], [0.5, '#B8FF3A'], [1, '#A79DFF']],
      depth: true,
    }),
    0.2,
  );
  ribbon(
    'rim',
    1.3,
    createGradientMaterial({
      bbox: bbox(linePts('rim')),
      vector: [0, 0, 0, 1],
      stops: [[0, WHITE, 0.95], [1, WHITE, 0.1]],
      depth: true,
    }),
    0.3,
  );

  // 7) apice
  add(
    body,
    'apex',
    buildFan(APEX.cx, APEX.cy, APEX.r, APEX.r),
    createGradientMaterial({
      radial: true,
      bbox: { min: [APEX.cx - APEX.r, APEX.cy - APEX.r], max: [APEX.cx + APEX.r, APEX.cy + APEX.r] },
      stops: [[0, WHITE], [0.3, '#EFFFD0', 0.85], [1, '#B8FF3A', 0]],
    }),
  );

  const op = (k, v) => setOpacity(parts[k].material, v);
  const line = (k, { progress, opacity }) => {
    parts[k].visible = progress > 0;
    parts[k].material.uniforms.uProgress.value = progress;
    op(k, opacity);
  };

  // Aplica os valores de computePrismValues.
  function update(v) {
    line('edges', v.edges);
    line('inner', v.inner);
    for (const k in v.slides) {
      const s = v.slides[k];
      op(k, s.opacity);
      parts[k].visible = s.opacity > 0;
      parts[k].position.set(s.dx * UNIT, -s.dy * UNIT, 0);
    }
    hole.scale.set(v.hole.scale, v.hole.scale, 1);
    op('holeFill', v.hole.opacity);
    op('holeStroke', v.hole.opacity);
    op('sheen', v.sheen);
    op('sheen2', v.sheen2);
    op('rim', v.rim);
    op('glow', v.glow);
    op('apex', v.apex);
    body.position.y = -v.bodyDy * UNIT;
  }

  function dispose() {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  }

  return { root, body, parts, update, dispose };
}
