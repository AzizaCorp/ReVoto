import { Slot, TerritoryChip, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { StoryFrame } from './shared/StoryFrame';

/** W-04 · Your territory (RF-07). Your municipality against its state, the country and its neighbors. */
export function W04YourTerritory() {
  const nav = useNavigation();
  return (
    <StoryFrame
      pending
      label="Tu territorio"
      visual={
        <>
          <Slot label="Mapa del municipio y sus vecinos" height="fill" />
          <Slot label="Comparado con: municipio · entidad · nacional · vecinos" height="medium" />
        </>
      }
    >
      <Text variant="h1">[Municipio], [Entidad]</Text>
      <TerritoryChip territory={nav.territory} onClick={nav.changeTerritory} />
      <Text variant="meta">Elección federal [año] · lista nominal [n]</Text>
      <Slot label="Participación en tu municipio" height="small">
        <Text variant="figure">—.— %</Text>
      </Slot>
      <Text variant="meta">± —.— pts vs. nacional</Text>
    </StoryFrame>
  );
}
