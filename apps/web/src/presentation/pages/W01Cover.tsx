import ballotBox from '@/presentation/assets/illustration-ballot-box.svg';
import blob from '@/presentation/assets/decor-blob.svg';
import sparkle from '@/presentation/assets/decor-sparkle.svg';
import star from '@/presentation/assets/decor-star.svg';
import { Button, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { StoryFrame } from './shared/StoryFrame';
import styles from './W01Cover.module.css';

/**
 * W-01 · Cover (RIU-01, canvas «D01/T01/W-01 · Portada»). Promise, no personal data and the way
 * into the story. Mobile: text, illustration and the button at the bottom; tablet and desktop:
 * text and button on the left, illustration on the right.
 */
export function W01Cover() {
  const nav = useNavigation();
  // One button, placed by breakpoint: under the illustration on mobile, under the text above it.
  const wide = useMediaQuery('(min-width: 768px)');
  const start = (
    <Button
      variant="brand"
      size="large"
      trailingIcon="arrow"
      fullWidth="mobile"
      onClick={nav.next ?? undefined}
    >
      Descubrir mi territorio
    </Button>
  );
  return (
    <StoryFrame
      cover
      hasSource={false}
      shareable={false}
      labelPrefix="Elecciones federales"
      label="2009–2024"
      visual={
        <div className={styles.art}>
          <img className={styles.blob} src={blob} alt="" />
          <img className={styles.ballot} src={ballotBox} alt="Urna con una boleta marcada" />
          <img className={styles.star} src={star} alt="" />
          <img className={styles.sparkle} src={sparkle} alt="" />
          {!wide && <div className={styles.startMobile}>{start}</div>}
        </div>
      }
    >
      <h1 className={styles.title} tabIndex={-1}>
        ¿Cuánto vota <br />
        <span className={styles.accent}>tu territorio?</span>
      </h1>
      <Text variant="lead">
        <span className={styles.lead}>
          Descubre en 10 pantallas cómo vota tu municipio frente al país. Sin datos personales.
        </span>
      </Text>
      {wide && <div className={styles.startWide}>{start}</div>}
    </StoryFrame>
  );
}
