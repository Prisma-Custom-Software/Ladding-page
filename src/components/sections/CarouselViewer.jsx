import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { carouselViewer as copy } from '../../data/content.js';
import styles from './CarouselViewer.module.css';

const BAR = 64; // faixa inferior com bolinhas, contador e som
const GAP = 28;
const DRAG_THRESHOLD = 0.16; // fracao do passo para trocar de slide ao soltar

// Carrossel interativo no estilo do Instagram: slide atual no centro (toca o video do slide desde o
// inicio, em loop), vizinhos menores e escurecidos nas laterais. Setas, bolinhas, teclado e arrastar.
export default function CarouselViewer({ slides, ratio = 4 / 5, title }) {
  const rootRef = useRef(null);
  const videos = useRef([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(null); // { x0, dx } enquanto arrasta
  const [muted, setMuted] = useState(false);
  const [touched, setTouched] = useState(false);
  const total = slides.length;

  useLayoutEffect(() => {
    const el = rootRef.current;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let slideH = Math.max(0, size.h - BAR - 16);
  let slideW = slideH * ratio;
  if (slideW > size.w * 0.86) {
    slideW = size.w * 0.86;
    slideH = slideW / ratio;
  }
  const step = slideW * 0.9 + GAP;

  const go = useCallback(
    (i) => {
      setTouched(true);
      setIndex(Math.max(0, Math.min(total - 1, i)));
    },
    [total],
  );

  // O slide ativo toca do inicio, como no Instagram; os outros param no primeiro quadro.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) {
        v.currentTime = 0;
        v.muted = muted;
        const p = v.play();
        if (p && p.catch) {
          p.catch(() => {
            // autoplay com som recusado: segue mudo e o botao de som fica disponivel
            v.muted = true;
            setMuted(true);
            const retry = v.play();
            if (retry && retry.catch) retry.catch(() => {});
          });
        }
      } else {
        v.pause();
      }
    });
    // muted fica fora das dependencias de proposito: trocar o som nao reinicia o slide
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    const v = videos.current[index];
    if (v) v.muted = muted;
  }, [muted, index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(index - 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, index]);

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button')) return;
    rootRef.current.setPointerCapture?.(e.pointerId);
    setDrag({ x0: e.clientX, dx: 0, id: e.pointerId });
  };
  const onPointerMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    setDrag({ ...drag, dx: e.clientX - drag.x0 });
  };
  const onPointerUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    setDrag(null);
    if (Math.abs(dx) > step * DRAG_THRESHOLD) {
      go(index + (dx < 0 ? 1 : -1));
      return;
    }
    // toque sem arrastar num vizinho leva ate ele
    // com pointer capture o alvo vira o root; procura o slide sob o ponteiro
    const under = document.elementFromPoint?.(e.clientX, e.clientY);
    const hit = under && under.closest('[data-slide]');
    if (Math.abs(dx) < 6 && hit) go(Number(hit.dataset.slide));
  };

  const pos = index - (drag ? drag.dx / step : 0);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${drag ? styles.dragging : ''}`}
      role="group"
      aria-roledescription={copy.label}
      aria-label={title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      <div className={styles.stage} style={{ height: `calc(100% - ${BAR}px)` }}>
        {slides.map((s, i) => {
          const rel = i - pos;
          const ar = Math.abs(rel);
          if (ar > 2.6) return null;
          const scale = 1 - 0.18 * Math.min(1, ar);
          const near = Math.abs(i - index) <= 1;
          return (
            <div
              key={s.n}
              data-slide={i}
              className={`${styles.slide} ${i === index ? styles.active : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={copy.slideLabel(i + 1, total)}
              aria-hidden={i === index ? undefined : true}
              style={{
                width: `${slideW}px`,
                height: `${slideH}px`,
                transform: `translate(-50%, -50%) translateX(${rel * step}px) scale(${scale})`,
                zIndex: 10 - Math.round(ar * 2),
              }}
            >
              {near ? (
                <video
                  ref={(el) => (videos.current[i] = el)}
                  className={styles.media}
                  poster={s.poster}
                  loop
                  playsInline
                  muted={i !== index || muted}
                  preload={i === index ? 'auto' : 'metadata'}
                  src={s.video}
                />
              ) : (
                <img className={styles.media} src={s.poster} alt="" draggable="false" />
              )}
              <span className={styles.dim} style={{ opacity: Math.min(1, ar) * 0.6 }} />
            </div>
          );
        })}
        <button
          type="button"
          className={`${styles.arrow} ${styles.prev}`}
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label={copy.prev}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          onClick={() => go(index + 1)}
          disabled={index === total - 1}
          aria-label={copy.next}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className={styles.bar} style={{ height: `${BAR}px` }}>
        <span className={styles.counter} aria-live="polite">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <div className={styles.dots}>
          {slides.map((s, i) => (
            <button
              key={s.n}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotOn : ''}`}
              onClick={() => go(i)}
              aria-label={copy.goTo(i + 1)}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>
        <button type="button" className={styles.sound} onClick={() => setMuted((m) => !m)} aria-pressed={!muted}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            {muted ? (
              <path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
          <span>{muted ? copy.soundOn : copy.soundOff}</span>
        </button>
      </div>
      <span className={`${styles.hint} ${touched ? styles.hintOff : ''}`} aria-hidden="true">
        {copy.hint}
      </span>
    </div>
  );
}
