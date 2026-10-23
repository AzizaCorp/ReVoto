import { Button, DataList, Notice, Pill, SheetTemplate } from '@/presentation/components';
import { place } from '@/presentation/format';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStoryData } from '@/presentation/providers/Story';
import { YEAR } from '../shared/storyFigures';

/** W-11 · Source sheet (RF-12, RN-10): territory, election and version of the figures shown. */
const date = (iso: string) => new Date(iso).toLocaleDateString('es-MX');

export function W11Source() {
  const nav = useNavigation();
  const story = useStoryData();
  const { openData } = useDependencies();
  const links = useAsync(() => openData.links(), [openData]);
  const l = links.status === 'ready' ? links.data : null;
  return (
    <SheetTemplate
      open
      title="¿De dónde sale esta cifra?"
      onClose={nav.closeSheet}
      actions={
        <>
          <Button
            variant="primary"
            size="large"
            trailingIcon="share"
            fullWidth
            href="https://www.ine.mx/transparencia/datos-abiertos/"
          >
            Portal de datos abiertos del INE
          </Button>
          <Button icon="copy" fullWidth>
            Copiar cita
          </Button>
        </>
      }
    >
      <Pill number="Desde">{nav.stepName ?? '[Pantalla de origen]'}</Pill>
      <DataList
        items={[
          {
            term: 'Fuente',
            value: 'INE · DECEYEC · Conteos censales de participación',
            icon: 'info',
          },
          {
            term: 'Elección',
            value: `Federal ${YEAR} y serie 2009–2024`,
            icon: 'calendar',
            tone: 'violet',
          },
          {
            term: 'Territorio',
            value: story ? place(story.own.territory) : place(nav.selected),
            icon: 'pin',
            tone: 'indigo',
          },
          {
            term: 'Versión de datos',
            value: l
              ? [l.version ?? 'Sin versión publicada', l.generatedAt && date(l.generatedAt)]
                  .filter(Boolean)
                  .join(' · ')
              : '[AAAAMMDD-hash]',
            icon: 'calendar',
            tone: 'neutral',
          },
          {
            term: 'Fórmula',
            value: 'Votaron ÷ (lista nominal − sin dato)',
            icon: 'chart',
            tone: 'brand-strong',
          },
        ]}
      />
      <Notice tone="info">
        Los registros sin dato de participación salen del denominador. No son abstención: el
        registro no trae información.
      </Notice>
    </SheetTemplate>
  );
}
