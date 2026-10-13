import { Button, Slot, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { StoryFrame } from './shared/StoryFrame';

/** W-09 · The archetype of your municipality (RF-11). A1–A5 card from the classification. */
export function W09Archetype() {
  const nav = useNavigation();
  return (
    <StoryFrame
      pending
      label="Tu arquetipo"
      shareable={false}
      visual={<Slot label="Tarjeta del arquetipo (A1–A5)" height="fill" />}
    >
      <Text variant="h1">Tu municipio tiene personalidad</Text>
      <Text variant="lead">
        Agrupamos los municipios por cómo han votado de 2009 a 2024: su nivel, su tendencia, cuánto
        suben en presidenciales y qué tan predecibles son.
      </Text>
      <Slot label="¿Por qué?" height="small">
        [Rasgo dominante] · Qué tan típico: —.—
      </Slot>
      <Button variant="primary" icon="↗" onClick={() => nav.openSheet('W-12')}>
        Compartir mi arquetipo
      </Button>
    </StoryFrame>
  );
}
