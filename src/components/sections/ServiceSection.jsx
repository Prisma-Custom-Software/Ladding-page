// Secao de servico generica (software, motion, landing), guiada por content.js.
// Props: `service` (item de content.js) ou `id` ('software' | 'motion' | 'landing').
import { services, projectsLabel } from '../../data/content.js';
import SectionLabel from '../ui/SectionLabel.jsx';
import Tag from '../ui/Tag.jsx';
import ServiceCard from './ServiceCard.jsx';
import ProjectCard from './ProjectCard.jsx';
import ProjectFeature from './ProjectFeature.jsx';
import BotsFeature from './BotsFeature.jsx';
import styles from './ServiceSection.module.css';

// features: mostra o destaque dos projetos que tem `feature` (ou `bots`) logo abaixo do cabecalho (pagina de
// projetos) e tira esses projetos da grade; sem projeto sobrando, a grade some.
export default function ServiceSection({ service, id = 'software', agents, features = false }) {
  const s = service || services.find((x) => x.id === id) || services[0];
  const light = Boolean(s.light);
  const theme = light ? styles.light : styles.dark;
  const isFeatured = (p) => Boolean(p.feature || p.bots);
  const featured = features ? s.projects.filter(isFeatured) : [];
  const grid = features ? s.projects.filter((p) => !isFeatured(p)) : s.projects;
  return (
    <section
      id={s.id}
      data-sec="1"
      {...(light ? { 'data-light': '1' } : {})}
      data-ags={JSON.stringify(agents || s.agents)}
      data-screen-label={`${s.index} ${s.label}`}
      className={`${styles.section} ${theme}`}
    >
      {!light && <div className={styles.glow} />}
      {/* numeral gigante vazado (so aparece na tipografia do carrossel, pagina de projetos) */}
      <span className={styles.bigIndex} aria-hidden="true">
        {s.index}
      </span>
      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <SectionLabel light={light}>{`${s.index} / ${s.label}`}</SectionLabel>
            <h2 data-b="type" className={styles.h2}>
              {s.title}
            </h2>
          </div>
          <div className={styles.headRight}>
            <p data-b="type" className={styles.text}>
              {s.text}
            </p>
            <div className={styles.tags}>
              {s.tags.map((t) => (
                <Tag key={t} light={light} data-b="block">
                  {t}
                </Tag>
              ))}
            </div>
          </div>
        </div>
        {features &&
          featured.map((p, i) =>
            p.bots ? (
              <BotsFeature key={p.n} project={p} light={light} />
            ) : (
              <ProjectFeature key={p.n} project={p} light={light} reverse={i % 2 === 1} />
            ),
          )}
        <div className={styles.cards}>
          {s.cards.map((c) => (
            <ServiceCard key={c.title} card={c} light={light} />
          ))}
        </div>
        {grid.length > 0 && (
          <div className={styles.projects}>
            <span data-b="type" className={styles.projectsLabel}>
              {projectsLabel}
            </span>
            <div className={styles.projectGrid}>
              {grid.map((p) => (
                <ProjectCard key={p.n} project={p} light={light} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
