import { forwardRef } from 'react';
import { fab } from '../../data/content.js';
import styles from './Fab.module.css';

// visible: controlado pela intro (T09). Opacidade/pointer-events via classe (transicao 500ms).
const Fab = forwardRef(function Fab({ visible = false }, ref) {
  return (
    <a
      ref={ref}
      href={fab.href}
      data-fab
      className={`${styles.fab} ${visible ? styles.on : ''}`}
      tabIndex={visible ? 0 : -1}
      aria-hidden={visible ? undefined : true}
    >
      {fab.label}{' '}
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14 M13 5l7 7-7 7" />
      </svg>
    </a>
  );
});

export default Fab;
