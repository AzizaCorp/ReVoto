import styles from './Illustration.module.css';

export interface IllustrationProps {
  src: string;
  /** Empty when it is decorative (the default). */
  alt?: string;
}

/** Brand illustration that pops in after the text (M-01 «pop»). */
export function Illustration({ src, alt = '' }: IllustrationProps) {
  return <img className={styles.illustration} src={src} alt={alt} />;
}
