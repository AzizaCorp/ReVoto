import { useState } from 'react';
import { ARCHETYPE_IDS, ARCHETYPES, type ArchetypeId } from '@/domain';
import { ArchetypeCard, Button, Chip, ComparisonBar, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

/** W-09 · The archetype of your municipality (RF-11). A1–A5 card from the classification. */
export function W09Archetype() {
  const nav = useNavigation();
  const wide = useMediaQuery('(min-width: 768px)');
  // Pending US-11: the archetype comes from the municipality data; until then, a preview.
  const [archetype, setArchetype] = useState<ArchetypeId>('A1');
  return (
    <StoryFrame
      pending
      label="Tu arquetipo"
      shareable={false}
      visualFirst
      visual={<ArchetypeCard archetype={archetype} format={wide ? 'story' : 'hero'} />}
    >
      <Text variant="h1">Tu municipio tiene personalidad</Text>
      <Text variant="lead">
        Agrupamos los 2,477 municipios por cómo han votado de 2009 a 2024: su nivel, su tendencia,
        cuánto suben en presidenciales y qué tan predecibles son.
      </Text>
      <div className={layout.row} role="radiogroup" aria-label="Vista previa de los arquetipos">
        {ARCHETYPE_IDS.map((id) => (
          <Chip
            key={id}
            kind="filter"
            role="radio"
            pressed={id === archetype}
            onClick={() => setArchetype(id)}
          >
            {ARCHETYPES[id]}
          </Chip>
        ))}
      </div>
      <section className={layout.panel}>
        <h2 className={layout.panelTitle}>¿Por qué?</h2>
        <Text variant="meta">[Rasgo dominante: «gana —.— pts por década frente al país»]</Text>
        <ComparisonBar label="Qué tan típico" value="—.—" ratio={null} />
      </section>
      <Button
        variant="primary"
        icon="share"
        fullWidth="mobile"
        onClick={() => nav.openSheet('W-12')}
      >
        Compartir mi arquetipo
      </Button>
    </StoryFrame>
  );
}
