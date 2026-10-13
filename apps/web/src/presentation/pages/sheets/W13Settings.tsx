import { useState } from 'react';
import {
  Button,
  Notice,
  SegmentedControl,
  SheetTemplate,
  SwitchRow,
} from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

const root = () => document.documentElement;
const SIZES = [
  { value: 'small', text: 'A−' },
  { value: 'normal', text: 'A' },
  { value: 'large', text: 'A+' },
] as const;

/**
 * W-13 · Reading settings (HU-10, RF-16). Settings live as attributes of `<html>`:
 * `data-reading="easy"` and `data-motion="reduced"` (see tokens.css).
 */
export function W13Settings() {
  const nav = useNavigation();
  const [easyReading, setEasyReading] = useState(() => root().dataset.reading === 'easy');
  const [reducedMotion, setReducedMotion] = useState(() => root().dataset.motion === 'reduced');
  const [size, setSize] = useState<string>('normal');

  const changeEasyReading = (on: boolean) => {
    setEasyReading(on);
    if (on) root().dataset.reading = 'easy';
    else delete root().dataset.reading;
  };
  const changeReducedMotion = (on: boolean) => {
    setReducedMotion(on);
    if (on) root().dataset.motion = 'reduced';
    else delete root().dataset.motion;
  };

  return (
    <SheetTemplate
      open
      title="Ajustes de lectura"
      onClose={nav.closeSheet}
      presentation="popover"
      actions={
        <Button icon="chart" fullWidth onClick={() => nav.goTo('W-10')}>
          Ver resumen
        </Button>
      }
    >
      <SwitchRow
        icon="type"
        title="Lectura fácil"
        description="Letra más grande, frases cortas"
        checked={easyReading}
        onChange={changeEasyReading}
      />
      <SwitchRow
        icon="redo"
        title="Reducir movimiento"
        description="También se activa con la preferencia de tu sistema"
        checked={reducedMotion}
        onChange={changeReducedMotion}
      />
      <SwitchRow
        icon="download"
        title="Versión ligera"
        description="Sin imágenes ni gráficas, menos datos"
        checked={false}
        onChange={() => nav.goTo('W-15')}
      />
      <SegmentedControl label="Tamaño de texto" options={SIZES} value={size} onChange={setSize} />
      <Notice>Aquí nunca avanzamos solos: tú decides cuándo pasar a la siguiente pantalla.</Notice>
    </SheetTemplate>
  );
}
