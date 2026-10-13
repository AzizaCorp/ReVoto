import { useState } from 'react';
import { ARCHETYPE_IDS, ARCHETYPES, BADGES, type ArchetypeId } from '@/domain';
import { Button, Chip, DuoCard, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

/**
 * W-09c · My municipality and me. Archetype crossed with the badge (30 headlines). Without
 * answers the card keeps the municipality half and waits for the person's.
 */
export function W09cMyMunicipalityAndMe() {
  const nav = useNavigation();
  const { badge, votes } = useProfile();
  const wide = useMediaQuery('(min-width: 768px)');
  // Pending US-11: the archetype comes from the municipality data; until then, a preview.
  const [archetype, setArchetype] = useState<ArchetypeId>('A1');
  return (
    <StoryFrame
      pending
      label="Mi municipio y yo"
      shareable={false}
      visualFirst
      visual={
        <DuoCard
          archetype={archetype}
          badge={badge}
          format={wide ? 'story' : 'post'}
          you={
            wide
              ? `${votes} de 3 · tu generación en [Entidad]: —.— de 3`
              : `${votes} de 3 · tu gen. —.—`
          }
        />
      }
    >
      <Text variant="h1">Tu municipio y tú, en una tarjeta</Text>
      <Text variant="lead">
        {badge
          ? 'Juntamos el arquetipo de [Municipio] con tu insignia: cada cruce tiene su titular.'
          : 'Tu municipio ya tiene su mitad. Responde «Sobre ti» para completar la tarjeta con tu insignia.'}
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
      <div className={layout.row}>
        <Button size="small" icon="pin" onClick={() => nav.goTo('W-09')}>
          Tu municipio: «{ARCHETYPES[archetype]}»
        </Button>
        <Button size="small" icon="star" onClick={() => nav.goTo(badge ? 'W-09b' : 'W-02b')}>
          {badge ? `Tú: «${BADGES[badge]}»` : 'Tú: responde «Sobre ti»'}
        </Button>
      </div>
      {badge ? (
        <Button
          variant="primary"
          icon="share"
          fullWidth="mobile"
          onClick={() => nav.openSheet('W-12')}
        >
          Compartir los dos
        </Button>
      ) : (
        <Button variant="primary" icon="star" fullWidth="mobile" onClick={() => nav.goTo('W-02b')}>
          Responder «Sobre ti»
        </Button>
      )}
    </StoryFrame>
  );
}
