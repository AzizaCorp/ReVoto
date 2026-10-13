import { Button, Notice, Slot, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
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
      visual={<Slot label="Tarjeta de tu insignia (I1–I6)" height="fill" />}
    >
      <Text variant="h1">Y tú, ¿cómo votas?</Text>
      <Text variant="lead">
        Tu insignia sale de tus respuestas; la comparación, de la participación del INE para tu edad
        en tu entidad.
      </Text>
      {complete ? (
        <Slot label="Tú y tu generación" height="small">
          Tú: — de 3 · [Edad] en [Entidad]: —.— de 3
        </Slot>
      ) : (
        <Notice>Responde «Sobre ti» para recibir tu insignia.</Notice>
      )}
      <Button variant="text" onClick={() => nav.goTo('W-02b')}>
        {complete ? 'Cambiar respuestas' : 'Responder ahora'}
      </Button>
      <Button variant="primary" icon="↗" onClick={() => nav.openSheet('W-12')}>
        Compartir mi insignia
      </Button>
    </StoryFrame>
  );
}
