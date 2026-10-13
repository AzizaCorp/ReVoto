import { Slot, Text } from '@/presentation/components';
import { StoryFrame } from './shared/StoryFrame';

/** W-03 · Mexico voted (RF-06). National map by municipality and national turnout. */
export function W03MexicoVoted() {
  return (
    <StoryFrame
      pending
      label="México"
      visual={
        <>
          <Slot label="Mapa de participación por municipio" height="fill" />
          <Slot label="Escala: menor → mayor participación" height="line" />
        </>
      }
    >
      <Text variant="h1">Así vota México</Text>
      <Text variant="lead">
        Cada municipio, coloreado según su participación en la elección federal [año].
      </Text>
      <Slot label="Selector: Presidencial / Intermedia" height="line" />
      <Slot label="Participación nacional" height="small">
        <Text variant="figure">—.— %</Text>
      </Slot>
      <Text variant="meta">Participación nacional · [año]</Text>
    </StoryFrame>
  );
}
