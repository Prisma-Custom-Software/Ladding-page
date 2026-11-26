// Constantes de tempo da intro e janelas de progresso do prisma (porte 1:1 do modelo).
import { seg } from './math.js';

export const PRISM0 = 2600;
export const PRISM1 = 6600;
export const GATHER = 6700;
export const END = 7300;
export const SPEED = 4.5;

// Janelas [inicio, fim] (em progresso b do prisma, 0..1) de cada parte do desenho.
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

// Progresso b (0..1) do prisma para o tempo t (ms de intro).
export const pb = (t) => seg(t, PRISM0, PRISM1);
