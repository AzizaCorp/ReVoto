import { Button, CheckList, Pill, SheetTemplate, StatCard, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import layout from '../shared/Layout.module.css';

const FIGURES = [
  ['Diferencia máxima vs. INE', '—.— pp', 'Debe ser ≤ 1 pp (RF-23)'],
  ['Registros sin dato', '—.— %', 'Quitados del denominador (RN-01)'],
  ['Registros excluidos', '[n]', 'Sexo o edad fuera de catálogo'],
  ['Municipios bajo umbral', '[n] de [N]', 'Se muestra su entidad (RN-05)'],
] as const;

/**
 * W-20 · Quality and validation report (RF-20, RF-23). Pending: read `manifest.validacion` and the
 * report published by the pipeline.
 */
export function W20Quality() {
  const nav = useNavigation();
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
        <Pill number="Versión">[AAAAMMDD-hash]</Pill>
        <Pill tone="pending">Datos pendientes</Pill>
      </div>
      <div className={layout.grid2}>
        {FIGURES.map(([label, value, note]) => (
          <StatCard key={label} label={label} value={value} pending>
            <Text variant="meta">{note}</Text>
          </StatCard>
        ))}
      </div>
      <CheckList
        items={[
          { text: 'Esquema y tipos homologados', reference: 'RF-20', passed: null },
          { text: 'Comparación con cifras oficiales', reference: 'RF-23', passed: null },
          { text: 'Sin secciones ni datos personales', reference: 'RN-02, RNF-13', passed: null },
          { text: 'Archivos dentro del presupuesto de peso', reference: 'RNF-04', passed: null },
        ]}
      />
    </SheetTemplate>
  );
}
