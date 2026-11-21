import styles from './SectionLabel.module.css';

// Losango lima 10px + texto mono ("01 / Software"). O texto leva data-b="type".
export default function SectionLabel({ light = false, children }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.diamond} />
      <span data-b="type" className={`${styles.text} ${light ? styles.light : styles.dark}`}>
        {children}
      </span>
    </div>
  );
}
