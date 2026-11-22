// Prisma em Three.js: camera ortografica frontal que enquadra o viewBox (+ margem para o overflow visivel do SVG).
import { useLayoutEffect, useRef } from 'react';
import { OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { subscribe } from '../../../engine/loop.js';
import { createPrismModel } from './PrismModel.jsx';
import { CANVAS_MARGIN, UNIT, computePrismValues, prismPointSvg, svgToWorld } from './prismGeometry.js';

const M = CANVAS_MARGIN;
const hostStyle = {
  position: 'absolute',
  left: `${(-M / 200) * 100}%`,
  top: `${(-M / 206) * 100}%`,
  width: `${((200 + 2 * M) / 200) * 100}%`,
  height: `${((206 + 2 * M) / 206) * 100}%`,
  pointerEvents: 'none',
};

export default function Prism3D({ getState, onApi, onFail }) {
  const hostRef = useRef(null);
  const cb = useRef({ getState, onApi, onFail });
  useLayoutEffect(() => {
    cb.current = { getState, onApi, onFail };
  });

  useLayoutEffect(() => {
    const host = hostRef.current;
    let renderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true });
    } catch (err) {
      cb.current.onFail && cb.current.onFail(err);
      return undefined;
    }
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.cssText = 'display:block;width:100%;height:100%;will-change:transform,filter';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.set(0, 0, 5);
    camera.updateMatrixWorld();
    const scene = new Scene();
    const model = createPrismModel();
    scene.add(model.root);

    // Buffer com tamanho inteiro e camera ancorada no canto superior esquerdo: 1 unidade SVG = s px exatos,
    // sem reamostragem do canvas (evita o deslocamento de ~1 px nas arestas).
    const resize = () => {
      const slot = host.parentElement;
      const s = slot.clientWidth / 200 || 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wb = Math.ceil((200 + 2 * M) * s * dpr);
      const hb = Math.ceil((206 + 2 * M) * s * dpr);
      renderer.setPixelRatio(1);
      renderer.setSize(wb, hb, false);
      host.style.left = `${-M * s}px`;
      host.style.top = `${-M * s}px`;
      host.style.width = `${wb / dpr}px`;
      host.style.height = `${hb / dpr}px`;
      const wu = (wb / dpr / s) * UNIT, hu = (hb / dpr / s) * UNIT;
      camera.left = (-M - 100) * UNIT;
      camera.right = camera.left + wu;
      camera.top = (103 + M) * UNIT;
      camera.bottom = camera.top - hu;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host.parentElement);

    let visible = true;
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((es) => {
      visible = es[es.length - 1].isIntersecting;
    }) : null;
    if (io) io.observe(host);
    const onLost = (e) => {
      e.preventDefault();
      cb.current.onFail && cb.current.onFail(new Error('webglcontextlost'));
    };
    canvas.addEventListener('webglcontextlost', onLost);

    const frame = () => {
      if (!visible) return;
      const s = cb.current.getState ? cb.current.getState() : { b: 0, now: performance.now(), flashAt: 0 };
      const v = computePrismValues(s.b, s.now, s.flashAt);
      model.update(v);
      canvas.style.filter = v.filter;
      renderer.render(scene, camera);
    };
    frame();
    const unsub = subscribe(frame);

    const tmp = new Vector3();
    const api = {
      // Coordenadas de tela (client) do ponto que o agente i constroi em `key`; null se `key` e desconhecida.
      getPoint(key, b, i, T) {
        const p = prismPointSvg(key, b, i, T);
        if (!p) return null;
        const [wx, wy] = svgToWorld(p[0], p[1]);
        // as pecas do corpo acompanham a flutuacao (o glow do chao nao)
        tmp.set(wx, wy + (key === 'glow' ? 0 : model.body.position.y), 0).project(camera);
        const r = canvas.getBoundingClientRect();
        return [r.left + ((tmp.x + 1) / 2) * r.width, r.top + ((1 - tmp.y) / 2) * r.height];
      },
      // Centro do prisma (caixa do viewBox, sem a flutuacao) em coordenadas de tela.
      getCenter() {
        const r = host.parentElement.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      },
    };
    cb.current.onApi && cb.current.onApi(api);

    return () => {
      unsub();
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      cb.current.onApi && cb.current.onApi(null);
      model.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} style={hostStyle} />;
}
