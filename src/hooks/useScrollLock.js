// Trava de scroll, roda e teclas durante a intro (como lock/block/blockKeys do modelo).
import { useEffect, useRef } from 'react';

const KEYS = [' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Tab'];

// getRoot(): elemento raiz da pagina (recebe pointer-events:none enquanto trava).
// Devolve lock(bool). Os listeners bloqueiam enquanto a trava estiver ligada.
export function useScrollLock(getRoot) {
  const locked = useRef(false);
  const rootFn = useRef(getRoot);
  rootFn.current = getRoot;
  const lockRef = useRef(null);
  if (!lockRef.current) {
    lockRef.current = (on) => {
      locked.current = on;
      const v = on ? 'hidden' : '';
      document.documentElement.style.overflow = v;
      document.body.style.overflow = v;
      const root = rootFn.current && rootFn.current();
      if (root) root.style.pointerEvents = on ? 'none' : '';
    };
  }
  useEffect(() => {
    const block = (e) => {
      if (locked.current) e.preventDefault();
    };
    const blockKeys = (e) => {
      if (locked.current && KEYS.includes(e.key)) e.preventDefault();
    };
    addEventListener('wheel', block, { passive: false });
    addEventListener('touchmove', block, { passive: false });
    addEventListener('keydown', blockKeys);
    return () => {
      removeEventListener('wheel', block);
      removeEventListener('touchmove', block);
      removeEventListener('keydown', blockKeys);
      lockRef.current(false);
    };
  }, []);
  return lockRef.current;
}
