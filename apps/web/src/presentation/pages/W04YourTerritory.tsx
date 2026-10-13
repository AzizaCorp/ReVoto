import { ComparisonBar, Slot, StatCard, TerritoryChip, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

const COMPARED = ['[Municipio]', '[Entidad]', 'Nacional', 'Tus vecinos'] as const;

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
          <section className={layout.panel}>
            <h2 className={layout.panelTitle}>Comparado con</h2>
            {COMPARED.map((c) => (
              <ComparisonBar key={c} label={c} value="—.— %" ratio={null} />
            ))}
          </section>
        </>
      }
    >
      <Text variant="h1">[Municipio], [Entidad]</Text>
      <TerritoryChip territory={nav.territory} onClick={nav.changeTerritory} />
      <Text variant="meta">Elección federal [año] · lista nominal [n]</Text>
      <StatCard
        icon="pin"
        label="Participación en tu municipio"
        value="—.— %"
        pending
        highlight
        hero
      >
        <Text variant="meta">± —.— pts vs. nacional</Text>
      </StatCard>
    </StoryFrame>
  );
}
