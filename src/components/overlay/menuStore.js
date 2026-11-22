// Estado compartilhado do menu (MenuButton, MenuDrawer). Fora do React para nao depender de contexto.
import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export const menuStore = {
  get: () => open,
  set(v) {
    if (open === v) return;
    open = v;
    emit();
  },
  toggle() {
    this.set(!open);
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useMenuOpen() {
  return useSyncExternalStore(menuStore.subscribe, menuStore.get, () => false);
}
