// Destaque de um projeto (pagina de projetos): midia grande que abre o visualizador + nome, apresentacao,
// diferenciais e tags. Os elementos levam data-b para os robos construirem.
import Icon from '../ui/Icon.jsx';
import Tag from '../ui/Tag.jsx';
import ProjectCard from './ProjectCard.jsx';
import { projectKicker } from '../../data/content.js';
import styles from './ProjectFeature.module.css';

// reverse: midia a direita (alterna os destaques para dar ritmo).
// blk: atributos de bloco de construcao (pagina de projetos).
export default function ProjectFeature({ project, light = false, reverse = false, blk = {} }) {
  const f = project.feature;
  const theme = light ? styles.light : styles.dark;
  return (
    <div className={`${styles.feature} ${theme} ${reverse ? styles.reverse : ''}`} data-feature={project.n} {...blk}>
      <div className={styles.media}>
        <ProjectCard project={project} light={light} bare />
      </div>
      <div className={styles.body}>
        <span data-b="type" className={styles.kicker}>
          {projectKicker(project.n)} · {f.kicker}
        </span>
        <h3 data-b="type" className={styles.name}>
          {f.name}
        </h3>
        <p data-b="type" className={styles.lead}>
          {f.lead}
        </p>
        <ul className={styles.highlights}>
          {f.highlights.map((h) => (
            <li key={h.title} data-b="block" className={styles.hl}>
              <span className={styles.iconBox}>
                <Icon d={h.icon} />
              </span>
              <span className={styles.hlBody}>
                <strong className={styles.hlTitle}>{h.title}</strong>
                <span className={styles.hlText}>{h.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.tags}>
          {f.tags.map((t) => (
            <Tag key={t} light={light} data-b="block">
              {t}
            </Tag>
          ))}
        </div>
      </div>
    </div>
  );
}
