// Relogio do prisma. Com `getState` externo (intro, T09) usa o estado dele; sem ele roda standalone com o
// mesmo relogio do original: inicio 250 ms apos montar, t = delta * 4.5, b = seg(t, 2600, 6600).
import { useCallback, useEffect, useRef, useState } from 'react';
import { seg } from '../../../engine/math.js';

export const PRISM0 = 2600;
export const PRISM1 = 6600;
export const SPEED = 4.5;
export const END = 7300;
export const STANDALONE_DELAY = 250;

export function standaloneState(start, now = performance.now()) {
  const t = (now - start) * SPEED;
  // o original dispara o flash (brilho) ao completar a intro (t >= END)
  const flashAt = t >= END ? start + END / SPEED : 0;
  return { b: seg(t, PRISM0, PRISM1), now, flashAt };
}

// Devolve uma funcao estavel () => ({ b, now, flashAt }).
export function usePrismBuild(getState) {
  const [start] = useState(() => performance.now() + STANDALONE_DELAY);
  const ref = useRef(getState);
  useEffect(() => {
    ref.current = getState;
  }, [getState]);
  return useCallback(() => (ref.current ? ref.current() : standaloneState(start)), [start]);
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let webglOk;
export function hasWebGL() {
  if (webglOk === undefined) {
    try {
      const c = document.createElement('canvas');
      const gl = window.WebGLRenderingContext ? c.getContext('webgl2') || c.getContext('webgl') : null;
      webglOk = !!gl;
      if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    } catch {
      webglOk = false;
    }
  }
  return webglOk;
}
