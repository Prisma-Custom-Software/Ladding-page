// STUB (T01). T09 implementa: complete, skip, refs registradas e a API do prisma.
import { createContext, useContext, useMemo, useRef } from 'react';

const BuildContext = createContext(null);

export function BuildProvider({ children }) {
  const refs = useRef({});
  const value = useMemo(() => ({ refs, prismApi: null, complete: false }), []);
  return <BuildContext.Provider value={value}>{children}</BuildContext.Provider>;
}

export function useBuild() {
  return useContext(BuildContext);
}

export default BuildContext;
