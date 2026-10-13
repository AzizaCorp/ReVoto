import { Button, Slot, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { StoryFrame } from './shared/StoryFrame';

/** W-09c · My municipality and me. Archetype crossed with the badge (30 combinations). */
export function W09cMyMunicipalityAndMe() {
  const nav = useNavigation();
  return (
    <StoryFrame
      pending
      label="Mi municipio y yo"
      shareable={false}
      visual={<Slot label="Tarjeta «Mi municipio y yo» (titular del cruce)" height="fill" />}
    >
      <Text variant="h1">Tu municipio y tú, en una tarjeta</Text>
      <Text variant="lead">
        Juntamos el arquetipo de [Municipio] con tu insignia: cada cruce tiene su titular.
      </Text>
      <Button size="small" icon="⌖" onClick={() => nav.goTo('W-09')}>
        Tu municipio: «[Arquetipo]»
      </Button>
      <Button size="small" icon="☆" onClick={() => nav.goTo('W-09b')}>
        Tú: «[Insignia]»
      </Button>
      <Button variant="primary" icon="↗" onClick={() => nav.openSheet('W-12')}>
        Compartir los dos
      </Button>
    </StoryFrame>
  );
}
