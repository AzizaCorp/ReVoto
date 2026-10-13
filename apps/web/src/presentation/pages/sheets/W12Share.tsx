import { useState } from 'react';
import {
  ArchetypeCard,
  BadgeCard,
  Button,
  Notice,
  SegmentedControl,
  ShareCard,
  SheetTemplate,
  Text,
} from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';

const WHAT = [
  { value: 'municipality', text: 'Mi municipio' },
  { value: 'badge', text: 'Mi insignia' },
  { value: 'both', text: 'Los dos' },
] as const;
const FORMATS = [
  { value: 'story', text: 'Historia 9:16' },
  { value: 'square', text: 'Publicación 1:1' },
] as const;

/** W-12 · Create a card (RF-15, RN-08). Pending US-14: real cards and PNG export. */
export function W12Share() {
  const nav = useNavigation();
  const { badge, votes } = useProfile();
  const [what, setWhat] = useState<string>('municipality');
  const [format, setFormat] = useState<string>('story');
  return (
    <SheetTemplate
      open
      title="Comparte este dato"
      onClose={nav.closeSheet}
      actions={
        <>
          <Button variant="primary" size="large" icon="share" fullWidth>
            Compartir…
          </Button>
          <Button icon="download" fullWidth>
            Descargar imagen
          </Button>
          <Button icon="copy" fullWidth>
            Copiar enlace
          </Button>
        </>
      }
    >
      <SegmentedControl label="Qué compartes" options={WHAT} value={what} onChange={setWhat} />
      <SegmentedControl label="Formato" options={FORMATS} value={format} onChange={setFormat} />
      {what === 'municipality' && (
        <ArchetypeCard archetype="A1" format={format === 'square' ? 'post' : 'story'} />
      )}
      {what === 'badge' &&
        (badge ? (
          <BadgeCard
            badge={badge}
            you={`${votes} de 3`}
            format={format === 'square' ? 'post' : 'story'}
          />
        ) : (
          <Notice tone="pending">Responde «Sobre ti» para crear tu insignia.</Notice>
        ))}
      {what === 'both' && (
        <ShareCard
          format={format === 'square' ? 'square' : 'story'}
          kicker="Mi municipio y yo"
          title="[Titular del cruce]"
          subtitle="Mi municipio es «[Arquetipo]»; yo, «[Insignia]»."
          footer="Arquetipo: datos INE 2009–2024 · Insignia: según mis respuestas"
        />
      )}
      <Text variant="meta">
        Plantillas P1–P7, P8 (tu insignia) y P9 (mi municipio y yo). Nunca incluye datos personales.
      </Text>
    </SheetTemplate>
  );
}
