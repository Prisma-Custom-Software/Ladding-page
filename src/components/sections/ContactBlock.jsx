import Contact from './Contact.jsx';
import Footer from './Footer.jsx';
import styles from './ContactBlock.module.css';

export default function ContactBlock() {
  return (
    <div className={styles.block} data-contact-block>
      <div className={styles.glow} />
      <Contact />
      <Footer />
    </div>
  );
}
