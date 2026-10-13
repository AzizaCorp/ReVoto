import { Button, Slot, Text } from '@/presentation/components';
import { StoryFrame } from './shared/StoryFrame';

/** W-05 · Fifteen years of elections (RF-08, RN-03). 2009–2024 series. */
export function W05FifteenYears() {
  return (
    <StoryFrame
      pending
      label="15 años"
      visual={
        <>
          <Slot
            label="Serie 2009–2024: presidenciales sólidas, intermedias rayadas"
            height="fill"
          />
          <Button variant="text">Ver como tabla</Button>
        </>
      }
    >
      <Text variant="h1">[Mensaje sobre presidenciales e intermedias]</Text>
      <Text variant="meta">[Territorio] · Elecciones federales 2009–2024</Text>
      <Slot label="Promedios" height="small">
        Presidenciales —.— % · Intermedias —.— %
      </Slot>
      <Text variant="meta">2018 → 2024: ± —.— pts</Text>
    </StoryFrame>
  );
}
