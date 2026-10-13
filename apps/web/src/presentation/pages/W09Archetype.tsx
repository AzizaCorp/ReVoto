import { Button, ComparisonBar, ShareCard, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

/** W-09 · The archetype of your municipality (RF-11). A1–A5 card from the classification. */
export function W09Archetype() {
  const nav = useNavigation();
  return (
    <StoryFrame
      pending
      label="Tu arquetipo"
      shareable={false}
      visualFirst
      visual={
        <ShareCard
          kicker="[Municipio] es…"
          title="[Arquetipo]"
          subtitle="[Frase del arquetipo]"
          figure="+—.— pts"
          figureCaption="sobre el país, elección tras elección"
          footer="Fuente: INE, conteos censales 2009–2024 · arquetipo calculado por ReVoto"
        />
      }
    >
      <Text variant="h1">Tu municipio tiene personalidad</Text>
      <Text variant="lead">
        Agrupamos los 2,477 municipios por cómo han votado de 2009 a 2024: su nivel, su tendencia,
        cuánto suben en presidenciales y qué tan predecibles son.
      </Text>
      <section className={layout.panel}>
        <h2 className={layout.panelTitle}>¿Por qué?</h2>
        <Text variant="meta">[Rasgo dominante: «gana —.— pts por década frente al país»]</Text>
        <ComparisonBar label="Qué tan típico" value="—.—" ratio={null} />
      </section>
      <Button
        variant="primary"
        icon="share"
        fullWidth="mobile"
        onClick={() => nav.openSheet('W-12')}
      >
        Compartir mi arquetipo
      </Button>
    </StoryFrame>
  );
}
