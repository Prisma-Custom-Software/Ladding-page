import { menu } from '../../data/content.js';
import { menuStore, useMenuOpen } from './menuStore.js';
import styles from './MenuButton.module.css';

export const MENU_BUTTON_ID = 'menu-toggle';

export default function MenuButton() {
  const open = useMenuOpen();
  return (
    <button
      type="button"
      id={MENU_BUTTON_ID}
      aria-label="Abrir menu"
      aria-expanded={open}
      aria-controls="menu-drawer"
      className={styles.btn}
      onClick={() => menuStore.toggle()}
    >
      {menu.open}
      <span className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
    </button>
  );
}
