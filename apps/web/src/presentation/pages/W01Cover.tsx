import { Button, Slot, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { StoryFrame } from './shared/StoryFrame';

/** W-01 · Cover (RIU-01). Promise, no personal data and the way into the story. */
export function W01Cover() {
  const nav = useNavigation();
  return (
    <StoryFrame
      cover
      label="Elecciones federales · 2009–2024"
      visual={<Slot label="Ilustración: urna con boleta marcada" height="fill" />}
    >
      <Text variant="h1">¿Cuánto vota tu territorio?</Text>
      <Text variant="lead">
        Descubre en 10 pantallas cómo vota tu municipio frente al país. Sin datos personales.
      </Text>
      <Button
        variant="brand"
        size="large"
        trailingIcon="→"
        fullWidth="mobile"
        onClick={nav.next ?? undefined}
      >
        Descubrir mi territorio
      </Button>
    </StoryFrame>
  );
}
