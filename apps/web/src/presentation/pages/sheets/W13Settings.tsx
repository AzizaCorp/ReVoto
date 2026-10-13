import { useState } from 'react';
import {
  Button,
  OptionGroup,
  SheetTemplate,
  SwitchRow,
  TerritoryChip,
  Text,
} from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

const root = () => document.documentElement;
const SIZES = ['A−', 'A', 'A+'] as const;

/**
 * W-13 · Reading settings (HU-10, RF-16). Settings live as attributes of `<html>`:
 * `data-reading="easy"` and `data-motion="reduced"` (see tokens.css).
 */
export function W13Settings() {
  const nav = useNavigation();
  const [easyReading, setEasyReading] = useState(() => root().dataset.reading === 'easy');
  const [reducedMotion, setReducedMotion] = useState(() => root().dataset.motion === 'reduced');
  const [size, setSize] = useState<string>('A');

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
      actions={<Button onClick={() => nav.goTo('W-10')}>Ver resumen</Button>}
    >
      <TerritoryChip territory={nav.territory} onClick={nav.changeTerritory} />
      <SwitchRow
        title="Lectura fácil"
        description="Letra más grande, frases cortas"
        checked={easyReading}
        onChange={changeEasyReading}
      />
      <SwitchRow
        title="Reducir movimiento"
        description="También se activa con la preferencia de tu sistema"
        checked={reducedMotion}
        onChange={changeReducedMotion}
      />
      <SwitchRow
        title="Versión ligera"
        description="Sin imágenes ni gráficas, menos datos"
        checked={false}
        onChange={() => nav.goTo('W-15')}
      />
      <OptionGroup question="Tamaño de texto" options={SIZES} selected={size} onSelect={setSize} />
      <Text variant="meta">
        Aquí nunca avanzamos solos: tú decides cuándo pasar a la siguiente pantalla.
      </Text>
    </SheetTemplate>
  );
}
