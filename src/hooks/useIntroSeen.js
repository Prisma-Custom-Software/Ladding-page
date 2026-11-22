import { useState } from 'react';
// Sessao ja vista (sessionStorage) e preferencia por movimento reduzido.
export const INTRO_KEY = 'prisma-hero-built';

export function introSeen() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    /* sem storage: ignora */
  }
}

export function reducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Intro deve ser pulada: sessao ja vista ou movimento reduzido.
export const shouldSkipIntro = () => introSeen() || reducedMotion();

// Hook fino para uso em componentes (valor lido uma vez na montagem).
export function useIntroSeen() {
  const [seen] = useState(shouldSkipIntro);
  return seen;
}
