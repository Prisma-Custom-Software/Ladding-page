import Button from '../ui/Button.jsx';
import { contact } from '../../data/content.js';
import styles from './Contact.module.css';

export default function Contact() {
  return (
    <section
      id="contato"
      className={styles.section}
      data-sec="1"
      data-ags="[1,2]"
      data-screen-label="Contato"
    >
      <div className={styles.inner}>
        <h2 className={styles.title} data-b="type">
          {contact.title[0]}
          <br />
          <span className={styles.accent}>{contact.title[1]}</span>
        </h2>
        <p className={styles.text} data-b="type">
          {contact.text}
        </p>
        <div className={styles.ctas}>
          {contact.ctas.map((c) => (
            <Button
              key={c.label}
              variant={c.variant}
              size="lg"
              href={c.href}
              target={c.target}
              rel={c.rel}
              data-b="block"
            >
              {c.label}
            </Button>
          ))}
        </div>
        <a href={`tel:${contact.phone.tel}`} className={styles.phone} data-b="type">
          {contact.phone.label}
        </a>
      </div>
    </section>
  );
}
