import { Slot, Text } from '@/presentation/components';
import { StoryFrame } from './shared/StoryFrame';

/** W-06 · Your generation (RF-09, RN-04). Turnout by age group, at municipal level. */
export function W06YourGeneration() {
  return (
    <StoryFrame
      pending
      label="Tu generación"
      visual={
        <>
          <Slot label="Selector: [Territorio] / Nacional" height="line" />
          <Slot label="Barras por grupo de edad: 18–24 … 60 +" height="fill" />
        </>
      }
    >
      <Text variant="h1">[Mensaje sobre la participación por edad]</Text>
      <Slot label="Brecha 18–24 vs. 60 +" height="small">
        <Text variant="figure">—.— pts</Text>
      </Slot>
      <Text variant="lead">
        [Texto descriptivo de la brecha entre el grupo más joven y el mayor, sin juicios.]
      </Text>
    </StoryFrame>
  );
}
