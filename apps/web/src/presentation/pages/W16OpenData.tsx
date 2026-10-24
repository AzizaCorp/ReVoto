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
import { DATA_COPY, SOURCE } from './shared/dataSource';
import layout from './shared/Layout.module.css';

type Link = 'csv' | 'national' | 'folder' | null;
const DATASETS: readonly [string, IconName, BubbleTone, Link, Link, string][] = [
  [
    'Participación por entidad y municipio',
    'pin',
    'brand',
    'csv',
    'folder',
    'entidad/<entidad>.json y municipio/<entidad>/<cvegeo>_<municipio>.json',
  ],
  [
    'Participación por edad y sexo',
    'users',
    'violet',
    'csv',
    'national',
    'por_edad y por_sexo en nacional.json, entidad/ y municipio/',
  ],
  [
    'Arquetipos municipales',
    'star',
    'indigo',
    null,
    'folder',
    'campo «arquetipo» de municipio/<entidad>/<cvegeo>_<municipio>.json',
  ],
];

/** W-16 · Open data (US-22). Links to the files of the current data version. */
export function W16OpenData() {
  const nav = useNavigation();
  const { openData } = useDependencies();
  const links = useAsync(() => openData.links(), [openData]);
  const l = links.status === 'ready' ? links.data : null;
  const url = (k: Link) =>
    !l || !k
      ? undefined
      : k === 'csv'
        ? (l.turnoutCsv ?? undefined)
        : k === 'national'
          ? l.nationalJson
          : l.baseUrl;
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
      {DATASETS.map(([name, icon, tone, csv, json, files]) => (
        <section key={name} className={layout.panel}>
          <div className={layout.row}>
            <IconBubble icon={icon} tone={tone} size={36} />
            <div>
              <h2 className={layout.panelTitle}>{name}</h2>
              <Text variant="meta">
                2009–2024 · datos del {date} · {files}
              </Text>
            </div>
          </div>
          <div className={layout.grid2}>
            <Button size="small" icon="download" href={url(csv)} disabled={!url(csv)}>
              CSV
            </Button>
            <Button size="small" icon="download" href={url(json)} disabled={!url(json)}>
              JSON
            </Button>
          </div>
        </section>
      ))}
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
