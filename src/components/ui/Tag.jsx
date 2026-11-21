import styles from './Tag.module.css';

// Chip mono ("web apps"). light = versao para secao clara.
export default function Tag({ light = false, children, ...rest }) {
  return (
    <span className={`${styles.tag} ${light ? styles.light : styles.dark}`} {...rest}>
      {children}
    </span>
  );
}
