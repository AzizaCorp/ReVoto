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

type TextSize = (typeof SIZES)[number]['value'];
const isTextSize = (v: string | undefined): v is TextSize => SIZES.some((s) => s.value === v);

/**
 * W-13 · Reading settings (HU-10, RF-16). Settings live as attributes of `<html>`, so they apply
 * to every screen, the lite version included, and survive closing the sheet (DEF-28):
 * `data-reading="easy"`, `data-motion="reduced"` and `data-text-size="small|large"` (tokens.css
 * scales every text token from them).
 */
export function W13Settings() {
  const nav = useNavigation();
  const [easyReading, setEasyReading] = useState(() => root().dataset.reading === 'easy');
  const [reducedMotion, setReducedMotion] = useState(() => root().dataset.motion === 'reduced');
  const [size, setSize] = useState<TextSize>(() => {
    const v = root().dataset.textSize;
    return isTextSize(v) ? v : 'normal';
  });
  const lite = nav.currentView === 'W-15';

  const changeEasyReading = (on: boolean) => {
    setEasyReading(on);
    if (on) root().dataset.reading = 'easy';
    else delete root().dataset.reading;
  };
  const changeSize = (v: string) => {
    if (!isTextSize(v)) return;
    setSize(v);
    if (v === 'normal') delete root().dataset.textSize;
    else root().dataset.textSize = v;
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
        description="Letra más grande, más espacio entre líneas y sin animaciones"
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
        checked={lite}
        onChange={(on) => nav.goTo(on ? 'W-15' : nav.lastScreen)}
      />
      <SegmentedControl
        label="Tamaño de texto"
        options={SIZES}
        value={size}
        onChange={changeSize}
      />
      <Notice>Aquí nunca avanzamos solos: tú decides cuándo pasar a la siguiente pantalla.</Notice>
    </SheetTemplate>
  );
}
