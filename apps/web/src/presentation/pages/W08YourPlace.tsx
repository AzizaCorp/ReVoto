import { Button, Slot, Text } from '@/presentation/components';
import { StoryFrame } from './shared/StoryFrame';

/** W-08 · Your place in your state. Position of the municipality among those of its state. */
export function W08YourPlace() {
  return (
    <StoryFrame
      pending
      label="Tu lugar"
      visual={
        <>
          <Slot label="Ranking: mayor participación → tu municipio → menor" height="fill" />
          <Button variant="text">Ver el Top 5 de [Entidad]</Button>
        </>
      }
    >
      <Text variant="h1">Tu lugar en [Entidad]</Text>
      <Text variant="meta">Entre los [n] municipios de [Entidad] · Elección federal [año]</Text>
      <Slot label="Posición" height="small">
        <Text variant="figure">#— de [n]</Text>
      </Slot>
      <Text variant="lead">Vota más que el —— % de los municipios de [Entidad].</Text>
    </StoryFrame>
  );
}
