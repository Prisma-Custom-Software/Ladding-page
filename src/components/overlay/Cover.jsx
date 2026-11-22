import { useEffect, useRef } from 'react';
import styles from './Cover.module.css';

// Cobre a pagina e some no primeiro frame (fade 400ms; display:none apos 450ms), como no modelo.
export default function Cover() {
  const ref = useRef(null);
  useEffect(() => {
    let t;
    const raf = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.style.opacity = 0;
      t = setTimeout(() => {
        if (ref.current) ref.current.style.display = 'none';
      }, 450);
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);
  return <div ref={ref} data-cover className={styles.cover} aria-hidden="true" />;
}
