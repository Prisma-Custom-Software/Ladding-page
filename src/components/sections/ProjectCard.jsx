import { useCallback, useEffect, useRef, useState } from 'react';
import CornerAccent from '../ui/CornerAccent.jsx';
import { projectKicker, projectPlaceholderLabel, projectViewer } from '../../data/content.js';
import ProjectViewer from './ProjectViewer.jsx';
import styles from './ProjectCard.module.css';

// Card de projeto: video (object-fit:contain) ou placeholder listrado.
// bare: so a midia (usado no destaque da pagina de projetos, que tem o proprio texto).
export default function ProjectCard({ project, light = false, bare = false }) {
  const theme = light ? styles.light : styles.dark;
  const hasVideo = Boolean(project.video);
  const videoRef = useRef(null);
  const mediaRef = useRef(null);
  const triggerRef = useRef(null);
  const visible = useRef(false);
  // viewer: { start } enquanto o visualizador esta aberto; null fechado.
  const [viewer, setViewer] = useState(null);
  // Toca so quando visivel (economiza CPU/bateria); respeita reduced motion.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || typeof IntersectionObserver === 'undefined') return undefined;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver((es) => {
      const on = es[es.length - 1].isIntersecting;
      visible.current = on;
      if (on && !reduced && !v.dataset.viewing) {
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const openViewer = () => {
    const v = videoRef.current;
    if (v) {
      v.dataset.viewing = '1';
      v.pause();
    }
    setViewer({ start: v ? v.currentTime : 0 });
  };
  // Ao fechar, o card continua do ponto em que o visualizador parou.
  const onClosed = useCallback((time) => {
    const v = videoRef.current;
    if (v) {
      delete v.dataset.viewing;
      if (Number.isFinite(time)) v.currentTime = time;
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (visible.current && !reduced) {
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      }
    }
    setViewer(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <article data-b="block" className={`${styles.card} ${theme} ${bare ? styles.bare : ''}`}>
      <div
        ref={mediaRef}
        className={`${styles.media} ${hasVideo ? styles.withVideo : styles.placeholder} ${viewer ? styles.lifted : ''}`}
      >
        {hasVideo ? (
          <video
            ref={videoRef}
            className={styles.video}
            poster={project.poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={project.title}
          >
            <source src={project.video} type="video/mp4" />
            {project.webm && <source src={project.webm} type="video/webm" />}
          </video>
        ) : (
          <span className={styles.phLabel}>{projectPlaceholderLabel(project.n)}</span>
        )}
        {hasVideo && (
          <button
            ref={triggerRef}
            type="button"
            className={styles.open}
            onClick={openViewer}
            aria-label={projectViewer.openLabel(project.title)}
            aria-haspopup="dialog"
          >
            <span className={styles.hint} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path
                  d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {projectViewer.hint}
            </span>
          </button>
        )}
        <CornerAccent size={32} />
      </div>
      {viewer && (
        <ProjectViewer
          project={project}
          originEl={mediaRef.current}
          startTime={viewer.start}
          onClosed={onClosed}
        />
      )}
      {!bare && (
        <div className={styles.info}>
          <span className={styles.kicker}>{projectKicker(project.n)}</span>
          <h3 className={styles.title}>{project.title}</h3>
          {project.meta && <p className={styles.meta}>{project.meta}</p>}
        </div>
      )}
    </article>
  );
}
