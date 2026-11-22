import { about } from '../../data/content';
import styles from './About.module.css';

export default function About() {
  const [pre, mid, post] = about.title;
  return (
    <section id="sobre" data-sec="1" data-ags="[2,3]" data-screen-label="Sobre" className={styles.section}>
      <div className={styles.glow} />
      <div className={styles.grid}>
        <div data-b="block" className={styles.photo}>
          <img
            src={about.image}
            srcSet={about.imageSet}
            sizes={about.imageSizes}
            alt={about.alt}
            className={styles.img}
            width="1600"
            height="1119"
            decoding="async"
            loading="lazy"
          />
          <span className={styles.corner} />
        </div>
        <div className={styles.col}>
          <span data-b="type" className={styles.label}>
            {about.label}
          </span>
          <h2 data-b="type" className={styles.title}>
            {pre}
            <span className={styles.lime}>{mid}</span>
            {post}
          </h2>
          <p data-b="type" className={styles.text}>
            {about.text[0]}
            <span className={styles.highlight}>{about.text[1]}</span>
          </p>
          <div className={styles.pillars}>
            {about.pillars.map((p) => (
              <div key={p.label} data-b="block" className={styles.pillar}>
                <span className={styles.diamond} style={{ background: p.color }} />
                <span className={styles.pillarLabel}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
