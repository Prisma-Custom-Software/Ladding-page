// Material de gradiente fiel ao SVG (gradientUnits="objectBoundingBox"), sem luz.
import { ShaderMaterial, NormalBlending, DoubleSide, Vector2, Vector3, Vector4 } from 'three';

const VERT = /* glsl */ `
attribute vec2 aSvg;
attribute float aLen;
varying vec2 vSvg;
varying float vLen;
void main() {
  vSvg = aSvg;
  vLen = aLen;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vSvg;
varying float vLen;
uniform vec2 uBMin;
uniform vec2 uBMax;
uniform vec2 uG0;
uniform vec2 uG1;
uniform float uRadial;
uniform vec4 uC0;
uniform vec4 uC1;
uniform vec4 uC2;
uniform vec3 uOff;
uniform float uOpacity;
uniform float uProgress;
void main() {
  if (vLen > uProgress) discard;
  vec2 uv = (vSvg - uBMin) / (uBMax - uBMin);
  float t;
  if (uRadial > 0.5) {
    t = length(uv - vec2(0.5)) / 0.5;
  } else {
    vec2 d = uG1 - uG0;
    t = dot(uv - uG0, d) / dot(d, d);
  }
  t = clamp(t, 0.0, 1.0);
  vec4 c;
  if (t <= uOff.x) c = uC0;
  else if (t <= uOff.y) c = mix(uC0, uC1, (t - uOff.x) / max(uOff.y - uOff.x, 1e-5));
  else c = mix(uC1, uC2, (t - uOff.y) / max(uOff.z - uOff.y, 1e-5));
  float a = c.a * uOpacity;
  if (a <= 0.0) discard;
  gl_FragColor = vec4(c.rgb, a);
}
`;

// '#RRGGBB' -> [r,g,b] 0..1 em sRGB (sem conversao para linear: o SVG interpola em sRGB).
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * @param {object} o
 * @param {Array<[number,string,number?]>} o.stops [offset, '#hex', opacidade=1] (2 ou 3 stops)
 * @param {{min:number[],max:number[]}} o.bbox caixa do objeto em coordenadas SVG
 * @param {number[]} [o.vector] [x1,y1,x2,y2] em bbox (linear)
 * @param {boolean} [o.radial] gradiente radial cx=cy=r=0.5
 * @param {boolean} [o.depth] usa o z-buffer para evitar dupla mistura de alpha em sobreposicoes
 * @param {number} [o.opacity] opacidade base multiplicativa (ex.: stroke-opacity)
 */
export function createGradientMaterial({ stops, bbox, vector = [0, 0, 1, 1], radial = false, opacity = 1, depth = false }) {
  const s = stops.length === 2 ? [stops[0], stops[1], stops[1]] : stops;
  const col = (st) => {
    const [r, g, b] = hexToRgb(st[1]);
    return new Vector4(r, g, b, st.length > 2 ? st[2] : 1);
  };
  const off = stops.length === 2 ? [stops[0][0], stops[1][0], 1] : s.map((x) => x[0]);
  const m = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    blending: NormalBlending,
    side: DoubleSide,
    // depth = true: tracos nao se sobrepoem a si mesmos (um traco SVG e uma unica forma com alpha unico).
    depthTest: depth,
    depthWrite: depth,
    uniforms: {
      uBMin: { value: new Vector2(bbox.min[0], bbox.min[1]) },
      uBMax: { value: new Vector2(bbox.max[0], bbox.max[1]) },
      uG0: { value: new Vector2(vector[0], vector[1]) },
      uG1: { value: new Vector2(vector[2], vector[3]) },
      uRadial: { value: radial ? 1 : 0 },
      uC0: { value: col(s[0]) },
      uC1: { value: col(s[1]) },
      uC2: { value: col(s[2]) },
      uOff: { value: new Vector3(off[0], off[1], off[2]) },
      uOpacity: { value: 0 },
      uProgress: { value: 2 },
    },
  });
  m.userData.baseOpacity = opacity;
  return m;
}

// Define a opacidade do elemento (multiplicada pela opacidade base do traco/preenchimento).
export function setOpacity(material, v) {
  material.uniforms.uOpacity.value = v * material.userData.baseOpacity;
}
