import { Slot, Text } from '@/presentation/components';
import { StoryFrame } from './shared/StoryFrame';

/** W-07 · Women and men (RF-10, RN-06). */
export function W07WomenAndMen() {
  return (
    <StoryFrame
      pending
      label="Mujeres y hombres"
      visual={<Slot label="Mujeres —.— % · Hombres —.— %" height="fill" />}
    >
      <Text variant="h1">[Mensaje sobre la participación por sexo]</Text>
      <Text variant="meta">[Territorio] · Elección federal [año]</Text>
      <Slot label="Diferencia entre mujeres y hombres" height="small">
        <Text variant="figure">—.— pts</Text>
      </Slot>
      <Text variant="meta">Se excluyen registros con sexo fuera de catálogo (RN-06).</Text>
    </StoryFrame>
  );
}
