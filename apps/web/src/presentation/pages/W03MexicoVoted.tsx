import { useState } from 'react';
import { SegmentedControl, Slot, StatCard, Text } from '@/presentation/components';
import { StoryFrame } from './shared/StoryFrame';

const TYPES = [
  { value: 'presidential', text: 'Presidencial' },
  { value: 'midterm', text: 'Intermedia' },
] as const;

/** W-03 · Mexico voted (RF-06). National map by municipality and national turnout. */
export function W03MexicoVoted() {
  const [type, setType] = useState<string>('presidential');
  return (
    <StoryFrame
      pending
      label="México"
      visual={
        <Slot label="Mapa de participación por municipio (escala de menor a mayor)" height="fill" />
      }
    >
      <Text variant="h1">Así vota México</Text>
      <Text variant="lead">
        Cada municipio, coloreado según su participación en la elección federal [año].
      </Text>
      <SegmentedControl label="Tipo de elección" options={TYPES} value={type} onChange={setType} />
      <StatCard icon="chart" label="Participación nacional · [año]" value="—.— %" pending hero />
    </StoryFrame>
  );
}
