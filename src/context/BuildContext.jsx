// Contexto da construcao da pagina (intro da hero + secoes). Guarda refs registradas, API do prisma e o
// estado do relogio. Nada aqui causa re-render: tudo e lido por refs dentro do loop.
import { createContext, useContext, useMemo, useRef } from 'react';
import { pb } from '../engine/timeline.js';
import { useBuildLoop } from '../hooks/useBuildLoop.js';

const BuildContext = createContext(null);

export function BuildProvider({ children }) {
  const refs = useRef({});
  const apiRef = useRef(null);
  const state = useRef({ t: 0, complete: false, flashAt: 0, skip: false });
  const value = useMemo(() => {
    const cache = {};
    return {
      refs,
      state,
      // Registra um ref (callback memoizado) em refs.current[name]: fab, chip, agents, ...
      reg: (name) =>
        cache[name] ||
        (cache[name] = (el) => {
          refs.current[name] = el;
        }),
      get prismApi() {
        return apiRef.current;
      },
      get complete() {
        return state.current.complete;
      },
      setPrismApi: (api) => {
        apiRef.current = api;
      },
      // Para <Prism getState>: b/now/flashAt a partir do relogio global da intro.
      getPrismState: () => ({ b: pb(state.current.t), now: performance.now(), flashAt: state.current.flashAt }),
    };
  }, []);
  useBuildLoop(value);
  return <BuildContext.Provider value={value}>{children}</BuildContext.Provider>;
}

export function useBuild() {
  return useContext(BuildContext);
}

export default BuildContext;
