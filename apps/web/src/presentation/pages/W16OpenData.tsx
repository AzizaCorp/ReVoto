import {
  Button,
  IconBubble,
  Pill,
  Text,
  TopBar,
  UtilityScreen,
  type BubbleTone,
  type IconName,
} from '@/presentation/components';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { useNavigation } from '@/presentation/providers/Navigation';
import type { OpenDataset } from '@/application';
import { DATA_COPY, SOURCE } from './shared/dataSource';
import layout from './shared/Layout.module.css';

const DATASETS: readonly [OpenDataset, string, IconName, BubbleTone, string, string][] = [
  [
    'turnout',
    'Participación por territorio',
    'pin',
    'brand',
    'participacion',
    'Una fila por territorio y elección: el país, 32 entidades y 2,450 municipios, con lista nominal y participación.',
  ],
  [
    'ageSex',
    'Participación por edad y sexo',
    'users',
    'violet',
    'participacion_edad_sexo',
    'Una fila por territorio, elección y grupo: 5 grupos de edad y 2 sexos.',
  ],
  [
    'archetypes',
    'Arquetipos municipales',
    'star',
    'indigo',
    'arquetipos_municipales',
    'Una fila por municipio con su arquetipo y sus cuatro rasgos en puntos.',
  ],
];

/** W-16 · Open data (US-22). CSV and JSON downloads of the current data copy. */
export function W16OpenData() {
  const nav = useNavigation();
  const { openData } = useDependencies();
  const links = useAsync(() => openData.links(), [openData]);
  const l = links.status === 'ready' ? links.data : null;
  const date = l?.generatedAt
    ? new Date(l.generatedAt).toLocaleDateString('es-MX')
    : DATA_COPY.date;
  return (
    <UtilityScreen
      top={
        <TopBar
          onBack={() => nav.goTo('W-10')}
          backLabel="Volver al resumen"
          onSettings={() => nav.openSheet('W-13')}
        />
      }
      title="Datos abiertos"
      lead="Los mismos agregados que usa este sitio. Úsalos, verifícalos y cítalos."
    >
      {l ? (
        <Pill number="Versión">{l.version ?? `Copia del ${DATA_COPY.date} · exploratoria`}</Pill>
      ) : (
        <Pill tone="pending">{links.status === 'error' ? 'No disponible' : 'Cargando'}</Pill>
      )}
      {DATASETS.map(([key, name, icon, tone, file, rows]) => {
        const d = l?.downloads[key];
        return (
          <section key={key} className={layout.panel}>
            <div className={layout.row}>
              <IconBubble icon={icon} tone={tone} size={36} />
              <div>
                <h2 className={layout.panelTitle}>{name}</h2>
                <Text variant="meta">
                  2009–2024 · datos del {date} · {rows}
                </Text>
              </div>
            </div>
            <div className={layout.grid2}>
              <Button
                size="small"
                icon="download"
                href={d?.csv ?? undefined}
                download={`revoto_${file}.csv`}
                disabled={!d?.csv}
                label={`Descargar ${name} en CSV`}
              >
                CSV
              </Button>
              <Button
                size="small"
                icon="download"
                href={d?.json ?? undefined}
                download={`revoto_${file}.json`}
                disabled={!d?.json}
                label={`Descargar ${name} en JSON`}
              >
                JSON
              </Button>
            </div>
          </section>
        );
      })}
      {l && Object.values(l.downloads).some((d) => !d.csv || !d.json) && (
        <Text variant="meta">
          Los archivos que no se pueden descargar aún no se publican en esta copia.
        </Text>
      )}
      <div className={layout.grid2}>
        <Button onClick={() => nav.goTo('W-19')}>Diccionario de datos</Button>
        <Button onClick={() => nav.goTo('W-18')}>Metodología</Button>
      </div>
      <Button icon="check" fullWidth onClick={() => nav.openSheet('W-20')}>
        Reporte de calidad y validación
      </Button>
      <Text variant="meta">
        Fuente: {SOURCE.name}. Código del sitio con licencia MIT. Cita sugerida: {SOURCE.citation}
      </Text>
    </UtilityScreen>
  );
}
