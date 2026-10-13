import { BadgeCard, Button, ComparisonBar, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

/**
 * W-09b · Your badge. It comes from the W-02b answers; without answers the card invites to
 * answer and the story can go on.
 */
export function W09bBadge() {
  const nav = useNavigation();
  const { badge, votes } = useProfile();
  const wide = useMediaQuery('(min-width: 768px)');
  const you = `${votes} de 3`;
  return (
    <StoryFrame
      pending={Boolean(badge)}
      label="Tu insignia"
      shareable={false}
      visualFirst
      visual={<BadgeCard badge={badge} you={you} format={wide ? 'story' : 'hero'} />}
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
          <ComparisonBar label="[Edad] en [Entidad]" value="—.— de 3" ratio={null} />
        </section>
      )}
      <div className={layout.row}>
        {badge ? (
          <>
            <Button variant="primary" icon="share" onClick={() => nav.openSheet('W-12')}>
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
