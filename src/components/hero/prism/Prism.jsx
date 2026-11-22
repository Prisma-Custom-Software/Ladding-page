// Prisma da hero. Escolhe Prism3D (Three.js, lazy) ou PrismFallback (SVG: sem WebGL, reduced motion, carregando).
// Props: getState: () => ({ b, now, flashAt }) (sem ele, roda standalone); onApi: api => void (api = null ao desmontar),
// api.getPoint(key, b, i, T) e api.getCenter() em coordenadas de tela.
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import PrismFallback from './PrismFallback.jsx';
import { hasWebGL, prefersReducedMotion, usePrismBuild } from './usePrismBuild.js';

const Prism3D = lazy(() => import('./Prism3D.jsx'));

const slot = { position: 'relative', width: 'min(380px,70vw)', aspectRatio: '200/206' };

export default function Prism({ getState, onApi }) {
  const get = usePrismBuild(getState);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const webgl = useMemo(hasWebGL, []);
  const [failed, setFailed] = useState(false);
  let content;
  if (reduced || failed || !webgl) {
    content = <PrismFallback ready={reduced} getState={get} onApi={onApi} />;
  } else {
    content = (
      <Suspense fallback={<PrismFallback getState={get} onApi={onApi} />}>
        <Prism3D getState={get} onApi={onApi} onFail={() => setFailed(true)} />
      </Suspense>
    );
  }
  return (
    <div data-prism style={slot}>
      {content}
    </div>
  );
}
