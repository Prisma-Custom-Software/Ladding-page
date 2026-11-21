import styles from './CornerAccent.module.css';

// Cantoneira lima no canto inferior esquerdo. size: 32 (projetos) | 56 (foto).
export default function CornerAccent({ size = 32 }) {
  return <span className={styles.corner} style={{ width: size, height: size }} />;
}
