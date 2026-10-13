import { Button, DataList, Notice, UtilityScreen } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

const DATASETS = [
  'Participación por entidad y municipio',
  'Participación por edad y sexo',
  'Arquetipos municipales',
] as const;

/** W-16 · Open data (US-22). Pending: links to the published CSV/JSON files. */
export function W16OpenData() {
  const nav = useNavigation();
  return (
    <UtilityScreen
      title="Datos abiertos"
      lead="Los mismos agregados que usa este sitio. Úsalos, verifícalos y cítalos."
      onBack={() => nav.goTo(nav.lastScreen)}
      actions={
        <>
          <Button variant="text">Diccionario</Button>
          <Button variant="text">Metodología</Button>
          <Button variant="text">Reporte de calidad y validación</Button>
        </>
      }
    >
      <Notice tone="pending">Se publican con el dataset final.</Notice>
      <DataList
        items={DATASETS.map((d) => ({
          term: d,
          value: '2009–2024 · corte [dd/mm/aaaa] · [peso] · CSV · JSON',
        }))}
      />
    </UtilityScreen>
  );
}
