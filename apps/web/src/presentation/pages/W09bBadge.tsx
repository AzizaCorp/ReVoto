import { BadgeCard, Button, ComparisonBar, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import layout from './shared/Layout.module.css';
import { compareWithGeneration } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';

/**
 * W-09b · Your badge. It comes from the W-02b answers; without answers the card invites to
 * answer and the story can go on. The comparison is the expected votes of the person's age group
 * in their state (entidad/<cve>.json → votos_esperados_por_edad).
 */
export function W09bBadge() {
  const nav = useNavigation();
  const story = useStoryData();
  const { badge, votes, answers } = useProfile();
  const wide = useMediaQuery('(min-width: 768px)');
  const you = `${votes} de 3`;
  const {
    generation,
    expected,
    stateName,
    pace,
    label: comparedWith,
  } = compareWithGeneration(story, votes, answers.age);
  return (
    <StoryFrame
      pending={Boolean(badge) && expected === null}
      label="Tu insignia"
      shareable={false}
      visualFirst
      visual={
        <BadgeCard
          badge={badge}
          you={you}
          generation={generation}
          {...(stateName ? { entity: stateName } : {})}
          {...(pace ? { pace } : {})}
          format={wide ? 'story' : 'hero'}
        />
      }
    >
      <Text variant="h1">Y tú, ¿cómo votas?</Text>
      <Text variant="lead">
        {badge
          ? 'Tu insignia sale de tus respuestas; la comparación, de la participación del INE para tu edad en tu entidad.'
          : 'Saltaste «Sobre ti». Con 4 toques te damos tu insignia y la comparamos con tu generación; si prefieres, sigue sin ella.'}
      </Text>
      {badge && (
        <section className={layout.panel}>
          <h2 className={layout.panelTitle}>Tú y tu generación</h2>
          <ComparisonBar label="Tú" value={you} ratio={votes / 3} />
          <ComparisonBar
            label={comparedWith}
            value={generation}
            ratio={expected === null ? null : expected / 3}
          />
        </section>
      )}
      <div className={layout.row}>
        {badge ? (
          <>
            <Button
              variant="primary"
              icon="share"
              onClick={() => nav.openSheet('W-12', { share: 'badge' })}
            >
              Compartir mi insignia
            </Button>
            <Button variant="text" onClick={() => nav.goTo('W-02b')}>
              Cambiar respuestas
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" icon="star" onClick={() => nav.goTo('W-02b')}>
              Responder ahora
            </Button>
            <Button variant="text" onClick={nav.next ?? undefined}>
              Seguir sin insignia
            </Button>
          </>
        )}
      </div>
    </StoryFrame>
  );
}
