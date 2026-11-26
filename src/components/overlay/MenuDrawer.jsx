import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { menu } from '../../data/content.js';
import { menuStore, useMenuOpen } from './menuStore.js';
import { MENU_BUTTON_ID } from './MenuButton.jsx';
import styles from './MenuDrawer.module.css';

function Arrow({ d, size, sw }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

// Rotas do app ('/x') usam Link; ancoras ('#x') ficam como <a>.
function NavLink({ href, onClick, children, ...rest }) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

export default function MenuDrawer() {
  const open = useMenuOpen();
  const navRef = useRef(null);
  const closeBtnRef = useRef(null);
  const wasOpen = useRef(false);
  const restoreFocus = useRef(true);
  const close = () => {
    restoreFocus.current = true;
    menuStore.set(false);
  };
  // Fechamento por ancora/link: nao devolve o foco ao botao (evita disputar scroll/foco do destino).
  const closeNav = () => {
    restoreFocus.current = false;
    menuStore.set(false);
  };

  useEffect(() => {
    if (open) {
      (closeBtnRef.current || navRef.current)?.focus({ preventScroll: true });
    } else if (wasOpen.current && restoreFocus.current) {
      document.getElementById(MENU_BUTTON_ID)?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={close}
        aria-hidden="true"
      />
      <nav
        ref={navRef}
        id="menu-drawer"
        aria-label="Menu principal"
        tabIndex={-1}
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
      >
        <div className={styles.head}>
          <Logo size={26} onClick={closeNav} style={{ color: '#F4F5F8' }} />
          <button ref={closeBtnRef} type="button" aria-label="Fechar menu" className={styles.close} onClick={close}>
            {menu.close}
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12 M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className={styles.items}>
          {menu.items.map((mi) => (
            <NavLink key={mi.n} href={mi.href} onClick={closeNav} className={styles.item}>
              <span className={styles.itemN}>{mi.n}</span>
              <span className={styles.itemText}>
                <span className={styles.itemLabel}>{mi.label}</span>
                <span className={styles.itemDesc}>{mi.desc}</span>
              </span>
              <Arrow d="M7 17 17 7 M8 7h9v9" size={20} sw={1.6} />
            </NavLink>
          ))}
        </div>
        <div className={styles.foot}>
          <div className={styles.contact}>
            <span className={styles.small}>{menu.contactLabel}</span>
            <a href={`mailto:${menu.email}`} className={styles.email}>
              {menu.email}
            </a>
            <a href={`tel:${menu.phone.tel}`} className={styles.email}>
              {menu.phone.label}
            </a>
          </div>
          <a href="#contato" onClick={closeNav} className={styles.cta}>
            {menu.cta}
            <Arrow d="M5 12h14 M13 5l7 7-7 7" size={14} sw={2.2} />
          </a>
        </div>
      </nav>
    </>
  );
}
