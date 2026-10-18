import { useState } from 'react';
import { ARCHETYPE_IDS, ARCHETYPES, type ArchetypeId } from '@/domain';
import { ArchetypeCard, Button, Chip, ComparisonBar, Text } from '@/presentation/components';
import { place, points, pointsAbs } from '@/presentation/format';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import layout from './shared/Layout.module.css';
import { archetypeStat, traitSentence } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';

/** W-09 · The archetype of your municipality (RF-11). A1–A5 card from the classification. */
export function W09Archetype() {
  const nav = useNavigation();
  const story = useStoryData();
  const wide = useMediaQuery('(min-width: 768px)');
  const profile = story?.profile?.archetype ?? null;
  // Without a municipality (or with fewer than 5 elections) the five archetypes can be previewed.
  const [preview, setPreview] = useState<ArchetypeId>('A1');
  const archetype = profile?.archetype ?? preview;
  const t = nav.selected;
  return (
    <StoryFrame
      pending={!profile}
      label="Tu arquetipo"
      shareable={false}
      visualLeft
      after={
        <>
          {profile ? (
            <section className={layout.panel}>
              <h2 className={layout.panelTitle}>¿Por qué?</h2>
              <Text variant="meta">{traitSentence(profile)}</Text>
              <Text variant="meta">
                Nivel {points(profile.level)} · efecto presidencial{' '}
                {points(profile.presidentialEffect)} · tendencia {points(profile.trend)} por década
                · volatilidad {pointsAbs(profile.volatility)}
              </Text>
              <ComparisonBar
                label="Qué tan típico"
                value={profile.typicality.toFixed(2)}
                ratio={profile.typicality}
              />
            </section>
          ) : (
            <>
              <Text variant="meta">
                {t.level === 'municipality'
                  ? `${t.name} tiene menos de 5 elecciones para calcular su arquetipo. Mira los cinco:`
                  : 'Elige un municipio para conocer su arquetipo. Mientras, mira los cinco:'}
              </Text>
              <div
                className={layout.row}
                role="radiogroup"
                aria-label="Vista previa de los arquetipos"
              >
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
            </>
          )}
          <Button
            variant="primary"
            icon="share"
            fullWidth="mobile"
            onClick={() => nav.openSheet('W-12', { share: 'archetype' })}
          >
            Compartir mi arquetipo
          </Button>
        </>
      }
      visual={
        <ArchetypeCard
          archetype={archetype}
          format={wide ? 'story' : 'hero'}
          {...(t.level === 'municipality' ? { place: place(t) } : {})}
          {...(profile ? { stat: archetypeStat(profile) } : {})}
        />
      }
    >
      <Text variant="h1">
        {profile && t.level === 'municipality'
          ? `${t.name} es «${ARCHETYPES[archetype]}»`
          : 'Tu municipio tiene personalidad'}
      </Text>
      <Text variant="lead">
        Agrupamos los 2,477 municipios por cómo han votado de 2009 a 2024: su nivel, su tendencia,
        cuánto suben en presidenciales y qué tan predecibles son.
      </Text>
      <DataStatus />
    </StoryFrame>
  );
}
