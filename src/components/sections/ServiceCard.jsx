import Icon from '../ui/Icon.jsx';
import styles from './ServiceCard.module.css';

// Card de servico: caixa do icone + titulo + texto. light = variante clara.
export default function ServiceCard({ card, light = false }) {
  const theme = light ? styles.light : styles.dark;
  return (
    <div data-b="block" className={`${styles.card} ${theme}`}>
      <div className={styles.iconBox}>
        <Icon d={card.icon} />
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{card.title}</h3>
        <p className={styles.text}>{card.text}</p>
      </div>
    </div>
  );
}
