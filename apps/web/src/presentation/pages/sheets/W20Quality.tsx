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
import { AUDIT, DATA_COPY, QUALITY_RULES } from '../shared/dataSource';
import layout from '../shared/Layout.module.css';

const countOf = (
  checks: readonly { result: QualityCheck['result'] }[],
  r: QualityCheck['result'],
) => checks.filter((c) => c.result === r).length;

/**
 * W-20 · Quality and validation report (RF-20, RF-23). Reads the manifest and
 * `<version>/calidad.json` through the QualityRepository port; while the copy has no
 * `calidad.json`, it shows the audit of the copy (`AUDIT`).
 */
export function W20Quality() {
  const nav = useNavigation();
  const { quality } = useDependencies();
  const result = useAsync(() => getQualityReport(quality), [quality]);
  const r = result.status === 'ready' ? result.data : null;
  const published = r !== null && r.checks.length > 0;
  const checks: readonly Pick<QualityCheck, 'description' | 'result' | 'detail'>[] = published
    ? r.checks
    : AUDIT.checks;

  const figures: [string, string, string][] = [
    [
      'Diferencia máxima vs. INE',
      r?.maxDifferencePoints == null ? 'Pendiente' : `${r.maxDifferencePoints} pp`,
      'Debe ser de 1 punto o menos',
    ],
    [
      'Reglas que se cumplen',
      `${countOf(checks, 'passed')} de ${checks.length}`,
      published ? 'Validaciones del pipeline' : 'Verificaciones de esta copia',
    ],
    ['Pendientes', String(countOf(checks, 'pending')), 'Aún sin medir o sin insumo'],
    ['No se cumplen', String(countOf(checks, 'failed')), 'Bloquean la publicación'],
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
        <Pill number="Versión">{r?.generatedAt ? r.version : `Copia del ${DATA_COPY.date}`}</Pill>
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
      {!published && (
        <Text variant="meta">
          Auditoría del {AUDIT.date}. {AUDIT.verdict}
        </Text>
      )}
      <CheckList
        items={checks.map((c) => ({
          text: c.description,
          detail: c.detail,
          passed: c.result === 'pending' ? null : c.result === 'passed',
        }))}
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
