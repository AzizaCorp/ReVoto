import { BadgeCard, Button, ComparisonBar, Notice, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

/** W-09b · Your badge. It comes from the W-02b answers; without answers there is no badge. */
export function W09bBadge() {
  const nav = useNavigation();
  const { badge, votes } = useProfile();
  const wide = useMediaQuery('(min-width: 768px)');
  const you = `${votes} de 3`;
  return (
    <StoryFrame
      pending
      label="Tu insignia"
      shareable={false}
      visualFirst
      visual={
        badge ? <BadgeCard badge={badge} you={you} format={wide ? 'story' : 'hero'} /> : undefined
      }
    >
      <Text variant="h1">Y tú, ¿cómo votas?</Text>
      <Text variant="lead">
        Tu insignia sale de tus respuestas; la comparación, de la participación del INE para tu edad
        en tu entidad.
      </Text>
      {badge ? (
        <section className={layout.panel}>
          <h2 className={layout.panelTitle}>Tú y tu generación</h2>
          <ComparisonBar label="Tú" value={you} ratio={votes / 3} />
          <ComparisonBar label="[Edad] en [Entidad]" value="—.— de 3" ratio={null} />
        </section>
      ) : (
        <Notice tone="pending">Responde «Sobre ti» para recibir tu insignia.</Notice>
      )}
      <div className={layout.row}>
        {badge && (
          <Button variant="primary" icon="share" onClick={() => nav.openSheet('W-12')}>
            Compartir mi insignia
          </Button>
        )}
        <Button variant="text" onClick={() => nav.goTo('W-02b')}>
          {badge ? 'Cambiar respuestas' : 'Responder ahora'}
        </Button>
      </div>
    </StoryFrame>
  );
}
