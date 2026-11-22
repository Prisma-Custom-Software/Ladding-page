import { footer } from '../../data/content.js';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer
      id="rodape"
      className={styles.footer}
      data-sec="1"
      data-ags="[1]"
      data-screen-label="Rodapé"
    >
      <span className={styles.copy} data-b="type">
        {footer.copyright}
      </span>
      <span className={styles.slogan} data-b="type">
        {footer.slogan}
      </span>
    </footer>
  );
}
