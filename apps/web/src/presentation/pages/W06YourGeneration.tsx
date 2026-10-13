import { useState } from 'react';
import { ComparisonBar, SegmentedControl, StatCard, Text } from '@/presentation/components';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

const GROUPS = ['18–24 años', '25–34 años', '35–44 años', '45–59 años', '60 + años'] as const;
const SCOPES = [
  { value: 'territory', text: '[Territorio]' },
  { value: 'national', text: 'Nacional' },
] as const;

/** W-06 · Your generation (RF-09, RN-04). Turnout by age group, at municipal level. */
export function W06YourGeneration() {
  const [scope, setScope] = useState<string>('territory');
  return (
    <StoryFrame
      pending
      label="Tu generación"
      visual={
        <>
          <SegmentedControl label="Ámbito" options={SCOPES} value={scope} onChange={setScope} />
          <section className={layout.panel}>
            <h2 className={layout.panelTitle}>Participación por grupo de edad</h2>
            {GROUPS.map((g) => (
              <ComparisonBar key={g} label={g} value="—.— %" ratio={null} />
            ))}
          </section>
        </>
      }
    >
      <Text variant="h1">[Mensaje sobre la participación por edad]</Text>
      <StatCard icon="users" label="Brecha 18–24 vs. 60 +" value="—.— pts" pending highlight hero />
      <Text variant="lead">
        [Texto descriptivo de la brecha entre el grupo más joven y el mayor, sin juicios.]
      </Text>
    </StoryFrame>
  );
}
