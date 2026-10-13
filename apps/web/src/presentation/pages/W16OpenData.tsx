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
import { useNavigation } from '@/presentation/providers/Navigation';
import layout from './shared/Layout.module.css';

const DATASETS: readonly [string, IconName, BubbleTone][] = [
  ['Participación por entidad y municipio', 'pin', 'brand'],
  ['Participación por edad y sexo', 'users', 'violet'],
  ['Arquetipos municipales', 'star', 'indigo'],
];

/** W-16 · Open data (US-22). Pending: links to the published CSV/JSON files. */
export function W16OpenData() {
  const nav = useNavigation();
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
      <Pill tone="pending">Se publican con el dataset final</Pill>
      {DATASETS.map(([name, icon, tone]) => (
        <section key={name} className={layout.panel}>
          <div className={layout.row}>
            <IconBubble icon={icon} tone={tone} size={36} />
            <div>
              <h2 className={layout.panelTitle}>{name}</h2>
              <Text variant="meta">2009–2024 · corte [dd/mm/aaaa] · [peso]</Text>
            </div>
          </div>
          <div className={layout.grid2}>
            <Button size="small" icon="download" disabled>
              CSV
            </Button>
            <Button size="small" icon="download" disabled>
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
        Licencia: [licencia] · Cita sugerida: ReVoto ([año]). Participación electoral 2009–2024 con
        datos del INE.
      </Text>
    </UtilityScreen>
  );
}
