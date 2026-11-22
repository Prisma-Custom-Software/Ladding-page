import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { subscribe } from '../../engine/loop.js';
import { createNetwork } from '../../engine/network.js';

// Canvas da rede de nos. Aceita ref (canvas) e prop `rng` opcional (PRNG semeado p/ testes visuais).
// `rng` deve ser estavel (so e lido na primeira montagem). init() roda uma unica vez por canvas,
// mesmo com o double-invoke de effects do StrictMode, para consumir o PRNG como o modelo (1 initNet).
const HeroNetwork = forwardRef(function HeroNetwork({ rng, ...rest }, ref) {
  const local = useRef(null);
  const netRef = useRef(null);
  const rngRef = useRef(rng);
  const outRef = useRef(ref);
  outRef.current = ref;
  const setRef = useCallback((el) => {
    local.current = el;
    const r = outRef.current;
    if (typeof r === 'function') r(el);
    else if (r) r.current = el;
  }, []);
  useEffect(() => {
    const c = local.current;
    if (!c) return undefined;
    if (!netRef.current || netRef.current.canvas !== c) {
      const created = createNetwork(c, rngRef.current);
      created.init();
      netRef.current = { net: created, canvas: c };
    }
    const net = netRef.current.net;
    const onResize = () => net.init();
    window.addEventListener('resize', onResize);
    const off = subscribe((now, dt) => net.draw(dt));
    return () => {
      off();
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return (
    <canvas
      ref={setRef}
      data-network
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      {...rest}
    />
  );
});

export default HeroNetwork;
