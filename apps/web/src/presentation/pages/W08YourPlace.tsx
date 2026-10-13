import { Button, Slot, StatCard, Text } from '@/presentation/components';
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
      <Text variant="lead">Entre los [n] municipios de [Entidad] · Elección federal [año]</Text>
      <StatCard icon="star" label="Posición en [Entidad]" value="#— de [n]" pending highlight hero>
        <Text variant="meta">Vota más que el —— % de los municipios de [Entidad].</Text>
      </StatCard>
    </StoryFrame>
  );
}
