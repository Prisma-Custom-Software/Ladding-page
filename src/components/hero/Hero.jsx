import { forwardRef, useCallback, useMemo } from 'react';
import { hero } from '../../data/content.js';
import { useBuild } from '../../context/BuildContext.jsx';
import Button from '../ui/Button.jsx';
import Logo from '../ui/Logo.jsx';
import HeroNetwork from './HeroNetwork.jsx';
import Prism from './prism/Prism.jsx';
import styles from './Hero.module.css';

// Estado final da hero. Refs expostas (para T09): prop `refs` (objeto) ou BuildContext.refs.current;
// o ref encaminhado aponta para a <section id="topo">. Atencao T09: `prism` aponta para o slot (div wrapper),
// nao para o <svg> do prisma como no modelo.
const Hero = forwardRef(function Hero({ refs }, ref) {
  const build = useBuild();
  const target = refs || (build && build.refs && build.refs.current) || null;
  const reg = useMemo(() => {
    const cache = {};
    return (name) =>
      cache[name] ||
      (cache[name] = (el) => {
        if (target) target[name] = el;
      });
  }, [target]);
  const setSection = useCallback(
    (el) => {
      reg('root')(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [reg, ref],
  );
  const [before, accent] = hero.title;
  const [c1, c2] = hero.ctas;
  return (
    <section id="topo" data-screen-label="Hero" ref={setSection} className={styles.hero}>
      <div ref={reg('heroBg')} className={styles.bg}>
        <div className={styles.glowLime} />
        <div className={styles.glowLilac} />
        <HeroNetwork ref={reg('net')} />
      </div>
      <Logo ref={reg('logo')} className={styles.logo} />
      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.kicker}>
            <span ref={reg('kLine')} className={styles.kLine} />
            <span ref={reg('kText')} className={styles.kText}>
              {hero.kicker}
            </span>
          </div>
          <h1 ref={reg('h1')} className={styles.h1}>
            {before}
            <span className={styles.accent}>{accent}</span>
          </h1>
          <p ref={reg('p')} className={styles.p}>
            {hero.text}
          </p>
          <div className={styles.ctas}>
            <Button ref={reg('btn1')} variant={c1.variant} href={c1.href}>
              {c1.label}
            </Button>
            <Button ref={reg('btn2')} variant={c2.variant} href={c2.href}>
              {c2.label}
            </Button>
          </div>
        </div>
        <div ref={reg('prism')} className={styles.prismSlot}>
          <Prism getState={build ? build.getPrismState : undefined} onApi={build ? build.setPrismApi : undefined} />
        </div>
      </div>
      <a ref={reg('role')} href="#software" className={styles.role}>
        <span>{hero.scroll}</span>
        <span className={styles.roleLine} />
      </a>
    </section>
  );
});

export default Hero;
