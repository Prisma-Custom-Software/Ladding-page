import { forwardRef } from 'react';
import styles from './Button.module.css';

// variant: 'primary' (lima) | 'ghost' (borda). size: 'md' (hero) | 'lg' (contato).
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref,
) {
  const cls = [styles.btn, styles[variant], size === 'lg' ? styles.lg : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <a ref={ref} className={cls} {...rest}>
      {children}
    </a>
  );
});

export default Button;
