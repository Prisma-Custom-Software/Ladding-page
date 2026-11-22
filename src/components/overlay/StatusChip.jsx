import { forwardRef, useImperativeHandle, useRef } from 'react';
import styles from './StatusChip.module.css';

const pad = (pct) => String(pct).padStart(2, '0') + '%';

// Depois de montado, o chip deve ser atualizado so pelo ref (set/setVisible), nunca por mudanca de props:
// o texto e atualizado de forma imperativa e um re-render poderia divergir.
// Props: text, pct (0-100), visible. Para atualizacao por frame use o ref imperativo:
// ref.current = { root, text, pct, bar, set(text, pct), setVisible(bool) } (sem setState).
const StatusChip = forwardRef(function StatusChip(
  { text = 'iniciando agentes', pct = 0, visible = true },
  ref,
) {
  const root = useRef(null);
  const textEl = useRef(null);
  const pctEl = useRef(null);
  const bar = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      get root() {
        return root.current;
      },
      get text() {
        return textEl.current;
      },
      get pct() {
        return pctEl.current;
      },
      get bar() {
        return bar.current;
      },
      set(msg, p) {
        const t = textEl.current;
        if (t?.firstChild && t.firstChild.nodeValue !== msg) t.firstChild.nodeValue = msg;
        if (pctEl.current?.firstChild) pctEl.current.firstChild.nodeValue = pad(p);
        if (bar.current) bar.current.style.width = p + '%';
      },
      setVisible(v) {
        if (root.current) root.current.style.opacity = v ? 1 : 0;
      },
    }),
    [],
  );

  return (
    <div
      ref={root}
      data-chip
      className={styles.chip}
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div className={styles.row}>
        <span className={styles.left}>
          <span className={styles.prompt}>&gt;_</span>
          <span ref={textEl}>{text}</span>
        </span>
        <span ref={pctEl} className={styles.pct}>
          {pad(pct)}
        </span>
      </div>
      <div className={styles.track}>
        <div ref={bar} className={styles.bar} style={{ width: pct + '%' }} />
      </div>
    </div>
  );
});

export default StatusChip;
