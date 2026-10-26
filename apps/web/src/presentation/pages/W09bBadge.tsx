import { BadgeCard, Button, ComparisonBar, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import layout from './shared/Layout.module.css';
import { ShareAction } from './shared/ShareAction';
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
      pending={Boolean(badge) && expected === null && Boolean(stateName)}
      label="Tu insignia"
      shareable={false}
      visualFirst
      visual={
        <BadgeCard
          badge={badge}
          you={you}
          {...(expected !== null ? { generation } : {})}
          {...(stateName ? { entity: stateName } : {})}
          {...(pace ? { pace } : {})}
          {...(badge && expected === null
            ? { generationHint: stateName ? 'Dinos tu edad' : 'Elige tu municipio' }
            : {})}
          format={wide ? 'story' : 'hero'}
        />
      }
    >
      <Text variant="h1">Y tú, ¿cómo votas?</Text>
      <Text variant="lead">
        {badge
          ? stateName
            ? 'Tu insignia sale de tus respuestas; la comparación, de la participación del INE para tu edad en tu entidad.'
            : 'Tu insignia sale de tus respuestas. Elige tu municipio para compararla con tu generación en tu entidad.'
          : stateName
            ? 'Saltaste «Sobre ti». Con 4 toques te damos tu insignia y la comparamos con tu generación; si prefieres, sigue sin ella.'
            : 'Saltaste «Sobre ti». Con 4 toques te damos tu insignia; si además eliges tu municipio, la comparamos con tu generación.'}
      </Text>
      {badge && (
        <section className={layout.panel}>
          <h2 className={layout.panelTitle}>Tú y tu generación</h2>
          <ComparisonBar label="Tú" value={you} ratio={votes / 3} />
          {expected === null ? (
            <Text variant="meta">
              {stateName
                ? 'Dinos tu edad en «Sobre ti» para compararte con tu generación.'
                : 'Elige tu municipio para compararte con tu generación en tu entidad.'}
            </Text>
          ) : (
            <ComparisonBar label={comparedWith} value={generation} ratio={expected / 3} />
          )}
        </section>
      )}
      <div className={layout.row}>
        {badge ? (
          <>
            <ShareAction what="badge" fullWidth={false} chroma="oro">
              Compartir mi insignia
            </ShareAction>
            <Button variant="text" onClick={nav.editAnswers}>
              Cambiar respuestas
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" icon="star" onClick={nav.editAnswers}>
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
