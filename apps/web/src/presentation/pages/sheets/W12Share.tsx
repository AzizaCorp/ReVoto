import { useState } from 'react';
import { Button, OptionGroup, SheetTemplate, Slot, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

const WHAT = ['Mi municipio', 'Mi insignia', 'Los dos'] as const;
const FORMATS = ['Historia 9:16', 'Publicación 1:1'] as const;

/** W-12 · Create a card (RF-15, RN-08). Pending US-14: real cards and PNG export. */
export function W12Share() {
  const nav = useNavigation();
  const [what, setWhat] = useState<string>(WHAT[0]);
  const [format, setFormat] = useState<string>(FORMATS[0]);
  return (
    <SheetTemplate
      open
      title="Comparte este dato"
      onClose={nav.closeSheet}
      actions={
        <>
          <Button variant="primary">Compartir…</Button>
          <Button>Descargar imagen</Button>
        </>
      }
    >
      <OptionGroup question="¿Qué compartes?" options={WHAT} selected={what} onSelect={setWhat} />
      <OptionGroup question="Formato" options={FORMATS} selected={format} onSelect={setFormat} />
      <Slot label={`Vista previa · ${what} · ${format}`} height="large" />
      <Text variant="meta">Nunca incluye datos personales.</Text>
    </SheetTemplate>
  );
}
