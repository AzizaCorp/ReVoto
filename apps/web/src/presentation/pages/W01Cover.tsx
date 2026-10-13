import ballotBox from '@/presentation/assets/illustration-ballot-box.svg';
import { Button, Illustration, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { StoryFrame } from './shared/StoryFrame';

/** W-01 · Cover (RIU-01). Promise, no personal data and the way into the story. */
export function W01Cover() {
  const nav = useNavigation();
  return (
    <StoryFrame
      cover
      hasSource={false}
      shareable={false}
      label="Elecciones federales · 2009–2024"
      visual={<Illustration src={ballotBox} />}
    >
      <Text variant="h1">¿Cuánto vota tu territorio?</Text>
      <Text variant="lead">
        Descubre en 10 pantallas cómo vota tu municipio frente al país. Sin datos personales.
      </Text>
      <Button
        variant="brand"
        size="large"
        trailingIcon="arrow"
        fullWidth="mobile"
        onClick={nav.next ?? undefined}
      >
        Descubrir mi territorio
      </Button>
    </StoryFrame>
  );
}
