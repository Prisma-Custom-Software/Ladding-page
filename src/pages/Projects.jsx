// Pagina /projetos: extensao das secoes de servico da home com a tipografia do carrossel Prisma
// (Oswald 700, Exo 2 900, Roboto Mono 700). Construida pelos robos do carrossel em ate 1,5 s por secao.
import { useEffect, useRef } from 'react';
import PageRoot from '../components/ui/PageRoot.jsx';
import SectionLabel from '../components/ui/SectionLabel.jsx';
import ServiceSection from '../components/sections/ServiceSection.jsx';
import ContactBlock from '../components/sections/ContactBlock.jsx';
import MenuButton from '../components/overlay/MenuButton.jsx';
import MenuDrawer from '../components/overlay/MenuDrawer.jsx';
import { services, projectsPage as copy } from '../data/content.js';
import { useProjectsBuild } from '../hooks/useProjectsBuild.js';
import styles from './Projects.module.css';

const ALL_ROBOTS = [0, 1, 2, 3, 4];

export default function Projects() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useProjectsBuild(rootRef, canvasRef);
  return (
    <>
      <PageRoot>
        <div ref={rootRef} data-type="heavy">
          <header id="projetos" data-sec="1" data-ags="[0,1,2,3,4]" data-screen-label="Projetos" className={styles.hero}>
            <div className={styles.grid} aria-hidden="true" />
            <div className={styles.glow} aria-hidden="true" />
            <span className={styles.bigWord} aria-hidden="true">
              00
            </span>
            <div className={styles.inner}>
              <SectionLabel>{copy.kicker}</SectionLabel>
              <h1 data-b="type" className={styles.title}>
                {copy.title[0]}
                <span className={styles.accent}>{copy.title[1]}</span>
              </h1>
              <p data-b="type" className={styles.text}>
                {copy.text}
              </p>
              <nav className={styles.jump} aria-label="Frentes">
                {copy.jump.map((j) => (
                  <a key={j.href} href={j.href} data-b="block" className={styles.chip}>
                    <span className={styles.chipIndex}>{j.index}</span>
                    {j.label}
                    <span className={styles.chipArrow} aria-hidden="true">
                      ↓
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </header>
          {services.map((s) => (
            <ServiceSection key={s.id} service={s} agents={ALL_ROBOTS} />
          ))}
          <ContactBlock />
        </div>
      </PageRoot>
      <MenuButton />
      <MenuDrawer />
      <canvas
        ref={canvasRef}
        data-agents
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-agents)',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'block',
        }}
      />
    </>
  );
}
