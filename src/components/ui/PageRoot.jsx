import styles from './PageRoot.module.css';

// Wrapper raiz identico ao do modelo (usado por Home, Placeholder e preview.html).
export default function PageRoot({ children }) {
  return <div className={styles.root}>{children}</div>;
}
