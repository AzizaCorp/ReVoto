import { useState } from 'react';
import {
  Button,
  SegmentedControl,
  ShareCard,
  SheetTemplate,
  Text,
} from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

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
      <ShareCard
        format={format === 'square' ? 'square' : 'story'}
        kicker={WHAT.find((w) => w.value === what)?.text ?? ''}
        title="—.— %"
        subtitle="[Territorio] · Elección federal [año]"
        footer="Fuente: INE, conteos censales · [dominio]"
      />
      <Text variant="meta">
        Plantillas P1–P7, P8 (tu insignia) y P9 (mi municipio y yo). Nunca incluye datos personales.
      </Text>
    </SheetTemplate>
  );
}
