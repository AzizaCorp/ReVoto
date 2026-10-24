import { ARCHETYPES } from '@/domain';
import { ArchetypeCard, Button, ComparisonBar, Text } from '@/presentation/components';
import { place, points, pointsAbs } from '@/presentation/format';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import { ShareAction } from './shared/ShareAction';
import layout from './shared/Layout.module.css';
import { archetypeStat, traitSentence } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';

/** W-09 · The archetype of your municipality (RF-11). A1–A5 card from the classification. */
export function W09Archetype() {
  const nav = useNavigation();
  const story = useStoryData();
  const wide = useMediaQuery('(min-width: 768px)');
  const profile = story?.profile?.archetype ?? null;
  const t = nav.selected;
  const municipality = t.level === 'municipality' ? t : null;
  return (
    <StoryFrame
      pending={Boolean(municipality) && !story}
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
            <Text variant="meta">
              {municipality
                ? `${municipality.name} tiene menos de 5 elecciones para calcular su arquetipo.`
                : 'Elige un municipio para conocer su arquetipo.'}
            </Text>
          )}
          {municipality ? (
            <ShareAction what="archetype" chroma="aurora">
              Compartir mi arquetipo
            </ShareAction>
          ) : (
            <Button variant="primary" icon="pin" fullWidth="mobile" onClick={nav.changeTerritory}>
              Elegir municipio
            </Button>
          )}
        </>
      }
      visual={
        // DEF-26: without an archetype the card invites to choose a municipality, never a sample.
        <ArchetypeCard
          archetype={profile?.archetype ?? null}
          format={wide ? 'story' : 'hero'}
          {...(municipality ? { place: place(municipality) } : {})}
          {...(profile ? { stat: archetypeStat(profile) } : {})}
        />
      }
    >
      <Text variant="h1">
        {profile && municipality
          ? `${municipality.name} es «${ARCHETYPES[profile.archetype]}»`
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
