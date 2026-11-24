// Destaque de um projeto de robos (pagina de projetos): um cartao por robo com a funcao e o que ele faz.
// Cada robo e desenhado como os mini-robos do carrossel, com a cor dele. Os cartoes levam data-b para os
// robos da pagina construirem.
import { useEffect, useRef } from 'react';
import Tag from '../ui/Tag.jsx';
import { projectKicker } from '../../data/content.js';
import { drawMiniBot } from '../../engine/drawMiniBot.js';
import { mix } from '../../engine/math.js';
import styles from './BotsFeature.module.css';

const BOT_W = 72;
const BOT_H = 104;

// Retrato parado do mini-robo (desenhado uma vez; a flutuacao e CSS).
function BotPortrait({ col, seed }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c && c.getContext && c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = BOT_W * dpr;
    c.height = BOT_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMiniBot(ctx, { x: BOT_W / 2, y: 40, s: 0.78, col, eye: 1, flame: 0.55, T: seed * 0.37, seed });
  }, [col, seed]);
  return <canvas ref={ref} className={styles.bot} style={{ width: BOT_W, height: BOT_H }} aria-hidden="true" />;
}

// blk: atributos de bloco de construcao; o cabecalho e a grade sao construidos separados.
export default function BotsFeature({ project, light = false, blk = {} }) {
  const b = project.bots;
  const theme = light ? styles.light : styles.dark;
  const last = Math.max(1, b.list.length - 1);
  return (
    <div className={`${styles.feature} ${theme}`} data-feature={project.n}>
      <div className={styles.head} {...blk}>
        <span data-b="type" className={styles.kicker}>
          {projectKicker(project.n)} · {b.kicker}
        </span>
        <h3 data-b="type" className={styles.name}>
          {b.name}
        </h3>
        <p data-b="type" className={styles.lead}>
          {b.lead}
        </p>
        <div className={styles.tags}>
          {b.tags.map((t) => (
            <Tag key={t} light={light} data-b="block">
              {t}
            </Tag>
          ))}
        </div>
      </div>
      <ol className={styles.grid} {...blk}>
        {b.list.map((bot, i) => (
          <li key={bot.name} data-b="block" className={styles.card} style={{ '--i': i }}>
            <div className={styles.cardHead}>
              <BotPortrait col={mix(i / last)} seed={i * 3} />
              <div className={styles.cardTitle}>
                <span className={styles.index}>{`BOT ${String(i + 1).padStart(2, '0')}`}</span>
                <h4 className={styles.botName}>{bot.name}</h4>
              </div>
            </div>
            <p className={styles.role}>{bot.role}</p>
            <ul className={styles.does}>
              {bot.does.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <div className={styles.stack}>
              {bot.stack.map((t) => (
                <span key={t} className={styles.chip}>
                  {t}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
