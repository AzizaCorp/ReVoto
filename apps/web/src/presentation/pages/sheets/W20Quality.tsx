import { getQualityReport } from '@/application';
import { isPublishable, type QualityCheck } from '@/domain';
import {
  Button,
  CheckList,
  DataList,
  Pill,
  SheetTemplate,
  StatCard,
  Text,
} from '@/presentation/components';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { useNavigation } from '@/presentation/providers/Navigation';
import { DATA_COPY, QUALITY_RULES } from '../shared/dataSource';
import layout from '../shared/Layout.module.css';

const countOf = (checks: readonly QualityCheck[], r: QualityCheck['result']) =>
  checks.filter((c) => c.result === r).length;

/**
 * W-20 · Quality and validation report (RF-20, RF-23). Reads the manifest and
 * `<version>/calidad.json` through the QualityRepository port.
 */
export function W20Quality() {
  const nav = useNavigation();
  const { quality } = useDependencies();
  const result = useAsync(() => getQualityReport(quality), [quality]);
  const r = result.status === 'ready' ? result.data : null;
  const checks = r?.checks ?? [];

  const figures: [string, string, string][] = [
    [
      'Diferencia máxima vs. INE',
      r ? (r.maxDifferencePoints === null ? 'Pendiente' : `${r.maxDifferencePoints} pp`) : '—.— pp',
      'Debe ser de 1 punto o menos',
    ],
    [
      'Reglas que se cumplen',
      r ? `${countOf(checks, 'passed')} de ${checks.length}` : '[n]',
      'Validaciones del pipeline',
    ],
    ['Pendientes', r ? String(countOf(checks, 'pending')) : '[n]', 'Sin insumo para comparar'],
    ['No se cumplen', r ? String(countOf(checks, 'failed')) : '[n]', 'Bloquean la publicación'],
  ];

  return (
    <SheetTemplate
      open
      title="Reporte de calidad y validación"
      onClose={nav.closeSheet}
      actions={
        <>
          <Button variant="primary" size="large" icon="download" fullWidth disabled>
            Descargar reporte completo (PDF)
          </Button>
          <Button fullWidth onClick={() => nav.goTo('W-18')}>
            Ver metodología
          </Button>
        </>
      }
    >
      <div className={layout.row}>
        <Pill number="Versión">{r?.version ?? `Copia del ${DATA_COPY.date}`}</Pill>
        {!r ? (
          <Pill tone="pending">{result.status === 'error' ? 'No disponible' : 'Cargando'}</Pill>
        ) : (
          !isPublishable(r) && <Pill tone="pending">Con fallas</Pill>
        )}
      </div>
      <div className={layout.grid2}>
        {figures.map(([label, value, note]) => (
          <StatCard key={label} label={label} value={value} pending={!r}>
            <Text variant="meta">{note}</Text>
          </StatCard>
        ))}
      </div>
      <CheckList
        items={
          r
            ? checks.map((c) => ({
                text: c.description,
                passed: c.result === 'pending' ? null : c.result === 'passed',
              }))
            : [
                { text: 'Esquema y tipos homologados', passed: null },
                { text: 'Comparación con cifras oficiales', passed: null },
              ]
        }
      />
      <h3 className={layout.panelTitle}>Reglas de calidad y registros afectados</h3>
      <DataList
        items={QUALITY_RULES.map((q) => ({
          term: q.rule,
          value: `${q.affected} · ${q.treatment}`,
        }))}
      />
      {r && <Text variant="meta">Fuente: {r.source}</Text>}
    </SheetTemplate>
  );
}
