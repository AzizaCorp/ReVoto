import onDarkLogo from '../../../assets/revoto-horizontal-oscuro.svg';
import onLightLogo from '../../../assets/revoto-horizontal-claro.svg';
import styles from './Logo.module.css';

/** Horizontal logo. `light` for light backgrounds (ink text), `dark` for dark backgrounds. */
export function Logo({ on = 'light' }: { on?: 'light' | 'dark' }) {
  return (
    <img className={styles.logo} src={on === 'light' ? onLightLogo : onDarkLogo} alt="ReVoto" />
  );
}
