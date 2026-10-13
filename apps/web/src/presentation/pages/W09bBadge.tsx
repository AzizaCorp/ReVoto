import { Button, ComparisonBar, Notice, ShareCard, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

/** W-09b · Your badge. It comes from the W-02b answers; without answers there is no badge. */
export function W09bBadge() {
  const nav = useNavigation();
  const { complete } = useProfile();
  return (
    <StoryFrame
      pending
      label="Tu insignia"
      shareable={false}
      visualFirst
      visual={
        complete ? (
          <ShareCard
            kicker="Eres…"
            title="[Insignia]"
            subtitle="[Frase de la insignia]"
            footer="Insignia según tus respuestas · comparación: INE"
          />
        ) : undefined
      }
    >
      <Text variant="h1">Y tú, ¿cómo votas?</Text>
      <Text variant="lead">
        Tu insignia sale de tus respuestas; la comparación, de la participación del INE para tu edad
        en tu entidad.
      </Text>
      {complete ? (
        <section className={layout.panel}>
          <h2 className={layout.panelTitle}>Tú y tu generación</h2>
          <ComparisonBar label="Tú" value="— de 3" ratio={null} />
          <ComparisonBar label="[Edad] en [Entidad]" value="—.— de 3" ratio={null} />
        </section>
      ) : (
        <Notice tone="pending">Responde «Sobre ti» para recibir tu insignia.</Notice>
      )}
      <div className={layout.row}>
        {complete && (
          <Button variant="primary" icon="share" onClick={() => nav.openSheet('W-12')}>
            Compartir mi insignia
          </Button>
        )}
        <Button variant="text" onClick={() => nav.goTo('W-02b')}>
          {complete ? 'Cambiar respuestas' : 'Responder ahora'}
        </Button>
      </div>
    </StoryFrame>
  );
}
