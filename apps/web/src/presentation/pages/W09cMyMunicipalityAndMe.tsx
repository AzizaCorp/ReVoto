import { Button, ShareCard, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

/** W-09c · My municipality and me. Archetype crossed with the badge (30 combinations). */
export function W09cMyMunicipalityAndMe() {
  const nav = useNavigation();
  return (
    <StoryFrame
      pending
      label="Mi municipio y yo"
      shareable={false}
      visualFirst
      visual={
        <ShareCard
          format="square"
          kicker="Mi municipio y yo"
          title="[Titular del cruce]"
          subtitle="Mi municipio es «[Arquetipo]»; yo, «[Insignia]»."
          footer="Arquetipo: datos INE 2009–2024 · Insignia: según mis respuestas"
        />
      }
    >
      <Text variant="h1">Tu municipio y tú, en una tarjeta</Text>
      <Text variant="lead">
        Juntamos el arquetipo de [Municipio] con tu insignia: cada cruce tiene su titular.
      </Text>
      <div className={layout.row}>
        <Button size="small" icon="pin" onClick={() => nav.goTo('W-09')}>
          Tu municipio: «[Arquetipo]»
        </Button>
        <Button size="small" icon="star" onClick={() => nav.goTo('W-09b')}>
          Tú: «[Insignia]»
        </Button>
      </div>
      <Button
        variant="primary"
        icon="share"
        fullWidth="mobile"
        onClick={() => nav.openSheet('W-12')}
      >
        Compartir los dos
      </Button>
    </StoryFrame>
  );
}
