import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import CornerAccent from '../ui/CornerAccent.jsx';
import { projectKicker, projectViewer } from '../../data/content.js';
import CarouselViewer from './CarouselViewer.jsx';
import styles from './ProjectViewer.module.css';

const EASE = 'cubic-bezier(.2,.8,.2,1)';
const OPEN_MS = 560;
const CLOSE_MS = 420;
const RATIO = 16 / 9;
const CAPTION_SPACE = 64;

// Proporcao do painel: 16:9 para videos; carrossel em tela estreita usa um painel em pe (slide 4:5 + barra).
function panelRatio(project) {
  if (project.carousel && window.innerWidth / window.innerHeight < 1.1) return 0.72;
  return RATIO;
}

// Retangulo final do painel: centrado, cabendo na viewport com espaco para a legenda.
function targetRect(ratio = RATIO) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = vw < 600 ? 16 : 48;
  const maxW = Math.min(1200, vw - pad * 2);
  const maxH = vh - pad * 2 - CAPTION_SPACE;
  const width = Math.max(0, Math.min(maxW, maxH * ratio));
  const height = width / ratio;
  return {
    left: (vw - width) / 2,
    top: Math.max(pad, (vh - height - CAPTION_SPACE) / 2),
    width,
    height,
  };
}

const px = (r) => ({
  left: `${r.left}px`,
  top: `${r.top}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
});

function rectOf(el) {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// Visualizador do video de um projeto. Abre expandindo a partir do card (originEl) ate o centro
// da tela e, ao fechar, volta para o card. onClosed(currentTime) e chamado ao fim da animacao.
export default function ProjectViewer({ project, originEl, startTime = 0, onClosed }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const captionRef = useRef(null);
  const closeRef = useRef(null);
  const videoRef = useRef(null);
  const closing = useRef(false);
  const reduced = useRef(prefersReducedMotion());

  // Abertura: painel vai do retangulo do card ao retangulo final.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const to = targetRect(panelRatio(project));
    Object.assign(panel.style, px(to));
    const anims = [];
    if (reduced.current) {
      anims.push(panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }));
    } else if (originEl) {
      anims.push(
        panel.animate([px(rectOf(originEl)), px(to)], { duration: OPEN_MS, easing: EASE }),
      );
    }
    anims.push(
      backdropRef.current.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 320,
        easing: 'ease-out',
      }),
    );
    for (const el of [captionRef.current, closeRef.current]) {
      anims.push(
        el.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 320, delay: reduced.current ? 0 : OPEN_MS - 160, easing: 'ease-out', fill: 'backwards' },
        ),
      );
    }
    return () => anims.forEach((a) => a.cancel());
  }, [originEl, project]);

  // Retoma o video do ponto em que estava no card, com som (o clique no card libera o autoplay
  // com audio). Se o navegador recusar, toca mudo e o usuario ativa o som nos controles.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const start = () => {
      if (startTime > 0 && startTime < (v.duration || Infinity)) v.currentTime = startTime;
      v.muted = false;
      const p = v.play();
      if (p && p.catch) {
        p.catch(() => {
          v.muted = true;
          const retry = v.play();
          if (retry && retry.catch) retry.catch(() => {});
        });
      }
    };
    if (v.readyState >= 1) start();
    else v.addEventListener('loadedmetadata', start, { once: true });
    return () => v.removeEventListener('loadedmetadata', start);
  }, [startTime]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const panel = panelRef.current;
    // carrossel nao tem video proprio: o card continua de onde parou
    const time = videoRef.current ? videoRef.current.currentTime : startTime;
    if (videoRef.current) videoRef.current.muted = true;
    const done = () => onClosed(time);
    const fade = { duration: 160, easing: 'ease-in', fill: 'forwards' };
    captionRef.current.animate([{ opacity: 1 }, { opacity: 0 }], fade);
    closeRef.current.animate([{ opacity: 1 }, { opacity: 0 }], fade);
    backdropRef.current.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: CLOSE_MS,
      easing: 'ease-in',
      fill: 'forwards',
    });
    let anim;
    if (reduced.current || !originEl || !originEl.isConnected) {
      anim = panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    } else {
      anim = panel.animate([px(rectOf(panel)), px(rectOf(originEl))], {
        duration: CLOSE_MS,
        easing: EASE,
        fill: 'forwards',
      });
    }
    anim.onfinish = done;
    anim.oncancel = done;
  }, [onClosed, originEl, startTime]);

  // Esc fecha, Tab fica preso no dialogo, resize reposiciona, scroll da pagina travado.
  useEffect(() => {
    const panel = panelRef.current;
    closeRef.current.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        const items = [
          closeRef.current,
          ...panel.querySelectorAll('video[controls], button:not([disabled])'),
        ].filter(Boolean);
        const i = items.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey ? i - 1 : i + 1;
        items[(next + items.length) % items.length].focus();
      }
    };
    const onResize = () => {
      if (!closing.current) Object.assign(panel.style, px(targetRect(panelRatio(project))));
    };
    const html = document.documentElement;
    const body = document.body;
    const scrollbar = window.innerWidth - html.clientWidth;
    const prev = { overflow: html.style.overflow, padding: body.style.paddingRight };
    html.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      html.style.overflow = prev.overflow;
      body.style.paddingRight = prev.padding;
    };
  }, [close, project]);

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={project.title}>
      <div ref={backdropRef} className={styles.backdrop} onClick={close} />
      <div ref={panelRef} className={styles.panel}>
        {project.carousel ? (
          <CarouselViewer slides={project.carousel.slides} ratio={project.carousel.ratio} title={project.title} />
        ) : (
          <video
            ref={videoRef}
            className={styles.video}
            poster={project.poster}
            loop
            playsInline
            controls
            preload="auto"
            aria-label={project.title}
          >
            {project.webm && <source src={project.webm} type="video/webm" />}
            <source src={project.video} type="video/mp4" />
          </video>
        )}
        <CornerAccent size={56} />
        <div ref={captionRef} className={styles.caption}>
          <span className={styles.kicker}>{projectKicker(project.n)}</span>
          <span className={styles.title}>{project.title}</span>
        </div>
      </div>
      <button
        ref={closeRef}
        type="button"
        className={styles.close}
        onClick={close}
        aria-label={projectViewer.closeLabel}
      >
        <span aria-hidden="true">{projectViewer.closeText}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}
