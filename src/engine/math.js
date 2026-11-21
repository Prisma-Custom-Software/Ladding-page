// Funcoes matematicas e cores do modelo (identicas ao script original).
export const clamp = (v) => Math.min(1, Math.max(0, v));
export const seg = (t, s, e) => clamp((t - s) / (e - s));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const LIME = [184, 255, 58];
export const LILAC = [123, 108, 255];
export const mix = (k) => LIME.map((v, j) => Math.round(v + (LILAC[j] - v) * k));
export const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
