import { useEffect, useRef } from 'react';
import CornerAccent from '../ui/CornerAccent.jsx';
import { projectKicker, projectPlaceholderLabel } from '../../data/content.js';
import styles from './ProjectCard.module.css';

// Card de projeto: video (object-fit:contain) ou placeholder listrado.
export default function ProjectCard({ project, light = false }) {
  const theme = light ? styles.light : styles.dark;
  const hasVideo = Boolean(project.video);
  const videoRef = useRef(null);
  // Toca so quando visivel (economiza CPU/bateria); respeita reduced motion.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || typeof IntersectionObserver === 'undefined') return undefined;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver((es) => {
      const on = es[es.length - 1].isIntersecting;
      if (on && !reduced) {
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <article data-b="block" className={`${styles.card} ${theme}`}>
      <div className={`${styles.media} ${hasVideo ? styles.withVideo : styles.placeholder}`}>
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
        <CornerAccent size={32} />
      </div>
      <div className={styles.info}>
        <span className={styles.kicker}>{projectKicker(project.n)}</span>
        <h3 className={styles.title}>{project.title}</h3>
        <p className={styles.meta}>{project.meta}</p>
      </div>
    </article>
  );
}
