import { useState } from 'react';
import { ARCHETYPE_IDS, ARCHETYPES, BADGES, type ArchetypeId } from '@/domain';
import { Button, Chip, DuoCard, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import { place } from '@/presentation/format';
import layout from './shared/Layout.module.css';
import { ageGroupOfAnswer, archetypeStat } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';

/**
 * W-09c · My municipality and me. Archetype crossed with the badge (30 headlines). Without
 * answers the card keeps the municipality half and waits for the person's.
 */
export function W09cMyMunicipalityAndMe() {
  const nav = useNavigation();
  const { badge, votes, answers } = useProfile();
  const story = useStoryData();
  const wide = useMediaQuery('(min-width: 768px)');
  const profile = story?.profile?.archetype ?? null;
  // Without a municipality archetype the five can be previewed.
  const [preview, setPreview] = useState<ArchetypeId>('A1');
  const archetype = profile?.archetype ?? preview;
  const t = nav.selected;
  const stateName = story?.overview?.state.name ?? '[Entidad]';
  const group = ageGroupOfAnswer(answers.age);
  const expected = group ? story?.overview?.expectedVotes[group] : undefined;
  const generation = expected === undefined ? '—.—' : expected.toFixed(1);
  return (
    <StoryFrame
      pending={!profile}
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
              ? `${votes} de 3 · tu generación en ${stateName}: ${generation} de 3`
              : `${votes} de 3 · tu gen. ${generation}`
          }
          {...(t.level === 'municipality' ? { place: place(t) } : {})}
          {...(profile ? { figure: archetypeStat(profile) } : {})}
        />
      }
    >
      <Text variant="h1">Tu municipio y tú, en una tarjeta</Text>
      <Text variant="lead">
        {badge
          ? `Juntamos el arquetipo de ${t.level === 'municipality' ? t.name : 'tu municipio'} con tu insignia: cada cruce tiene su titular.`
          : 'Tu municipio ya tiene su mitad. Responde «Sobre ti» para completar la tarjeta con tu insignia.'}
      </Text>
      {!profile && (
        <div className={layout.row} role="radiogroup" aria-label="Vista previa de los arquetipos">
          {ARCHETYPE_IDS.map((id) => (
            <Chip
              key={id}
              kind="filter"
              role="radio"
              pressed={id === preview}
              onClick={() => setPreview(id)}
            >
              {ARCHETYPES[id]}
            </Chip>
          ))}
        </div>
      )}
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
