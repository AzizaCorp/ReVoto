import { Button, Slot, Text, UtilityScreen } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStepNumber } from './shared/StoryFrame';
import { UtilityTopBar } from './shared/UtilityTopBar';

const FIGURES = [
  ['—.— %', 'Nacional · [año]'],
  ['—.— %', '[Municipio] · [año]'],
  ['#— de [n]', 'Tu lugar en [Entidad] · [año]'],
  ['—.— pts', '18–24 vs. 60 + · [año]'],
  ['—.— pts', 'Mujeres vs. hombres · [año]'],
] as const;

/** W-10 · Your summary (RF-04, US-21). Close of the story with five figures. */
export function W10Summary() {
  const nav = useNavigation();
  const number = useStepNumber();
  return (
    <UtilityScreen
      top={<UtilityTopBar />}
      label="Resumen"
      number={number}
      title="Lo esencial, en cinco cifras"
      actions={
        <>
          <Button
            variant="primary"
            size="large"
            icon="↗"
            fullWidth
            onClick={() => nav.openSheet('W-12')}
          >
            Compartir mi resumen
          </Button>
          <Button size="small" icon="↓" onClick={() => nav.goTo('W-16')}>
            Datos abiertos
          </Button>
          <Button size="small" icon="↺" onClick={() => nav.goTo('W-01')}>
            Volver a empezar
          </Button>
          <Button
            size="small"
            icon="‹"
            onClick={nav.previous ?? undefined}
            label="Pantalla anterior"
          >
            Anterior
          </Button>
        </>
      }
    >
      <Button size="small" icon="⌖" onClick={() => nav.goTo('W-09')}>
        Tu municipio: «[Arquetipo]»
      </Button>
      <Button size="small" icon="☆" onClick={() => nav.goTo('W-09b')}>
        Tú: «[Insignia]»
      </Button>
      {FIGURES.map(([value, context]) => (
        <Slot key={context} label={context} height="small">
          <Text variant="figure">{value}</Text>
          <Text variant="meta">{context}</Text>
        </Slot>
      ))}
    </UtilityScreen>
  );
}
