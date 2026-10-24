import { useState } from 'react';
import {
  Button,
  DataList,
  FieldTable,
  SegmentedControl,
  Text,
  TopBar,
  UtilityScreen,
  type Field,
} from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { DATA_COPY, SOURCE, THRESHOLD } from './shared/dataSource';

interface Dataset {
  title: string;
  /** Published files that carry these fields. */
  files: string;
  coverage: string;
  source: string;
  fields: readonly Field[];
}

const CUTOFF = `Jornada de cada elección (05/07/2009 a 02/06/2024) · copia del ${DATA_COPY.date}`;

/** Fields of the published L4 files (`@revoto/contracts`), same definitions as D06 §3–4. */
const DATASETS: Record<string, Dataset> = {
  turnout: {
    title: 'Participación por territorio',
    files: 'nacional.json, entidad/<entidad>.json y municipio/<entidad>/<cvegeo>_<municipio>.json',
    coverage:
      'País, 32 entidades y 2,451 municipios; 6 elecciones federales de 2009 a 2024 (ver Metodología para los años sin cifra)',
    source: 'INE · Conteos censales (LN, SV, NS)',
    fields: [
      {
        name: 'territorio.nombre',
        type: 'texto',
        description: 'Nombre del territorio como lo publica el INE.',
        example: 'Aguascalientes',
      },
      {
        name: 'territorio.cve',
        type: 'entero',
        description: 'Clave INE del municipio o de la entidad (1–32).',
        example: '1',
      },
      {
        name: 'territorio.cvegeo',
        type: 'texto',
        description: 'Clave INEGI del municipio: 2 dígitos de entidad y 3 de municipio.',
        example: '01001',
      },
      {
        name: 'elecciones[].anio',
        type: 'entero',
        description: 'Año de la elección federal: 2009, 2012, 2015, 2018, 2021 o 2024.',
        example: '2024',
      },
      {
        name: 'elecciones[].tipo',
        type: 'texto',
        description: 'presidencial (2012, 2018, 2024) o intermedia (2009, 2015, 2021).',
        example: 'presidencial',
      },
      {
        name: 'elecciones[].lista_nominal',
        type: 'entero',
        description: 'Personas en la lista nominal del territorio (suma de LN).',
        example: '533517',
      },
      {
        name: 'elecciones[].participacion',
        type: 'decimal',
        description:
          'Votaron ÷ (lista nominal − sin dato). Proporción de 0 a 1 con 3 decimales; en pantalla, porcentaje.',
        example: '0.420',
      },
      {
        name: 'elecciones[].suprimido',
        type: 'booleano',
        description: `true si la lista nominal es menor a ${THRESHOLD} personas; entonces no trae cifras.`,
        example: 'false',
      },
      {
        name: 'elecciones[].estado_tasa',
        type: 'texto',
        description:
          'Solo cuando no hay cifra: suppressed (menos de 50 personas), rate_undefined (toda la lista sin dato), unavailable o no_data.',
        example: 'rate_undefined',
      },
    ],
  },
  ageSex: {
    title: 'Participación por edad y sexo',
    files: 'Campos por_edad y por_sexo de cada elección; votos_esperados_por_edad en entidad/',
    coverage: `País y 32 entidades con los 5 grupos y los 2 sexos; en municipios se omite el grupo con menos de ${THRESHOLD} personas`,
    source: 'INE · Conteos censales (EDAD, SEXO)',
    fields: [
      {
        name: 'por_edad.<grupo>',
        type: 'decimal',
        description:
          'Participación dentro del grupo: 18-24, 25-34, 35-44, 45-59 o 60+ (60 a 110 años). Las edades fuera de 18–110 se excluyen y la edad simple no se publica.',
        example: '0.329',
      },
      {
        name: 'por_sexo.H · por_sexo.M',
        type: 'decimal',
        description:
          'Participación dentro de cada sexo según el catálogo del INE (H = 0, M = 1). Otros valores se excluyen del desglose.',
        example: '0.450',
      },
      {
        name: 'votos_esperados_por_edad.<grupo>',
        type: 'decimal',
        description:
          'Solo entidad: suma de la participación del grupo en 2018, 2021 y 2024. Cuántas de esas 3 elecciones vota en promedio una persona de esa edad.',
        example: '1.412',
      },
    ],
  },
  archetypes: {
    title: 'Arquetipos municipales',
    files: 'Campo arquetipo de municipio/<entidad>/<cvegeo>_<municipio>.json',
    coverage:
      '2,415 de 2,451 municipios; los que tienen menos de 5 elecciones con cifra no se clasifican',
    source: 'Cálculo de ReVoto con la participación del INE (K-medias, k = 5)',
    fields: [
      {
        name: 'arquetipo.id',
        type: 'texto',
        description:
          'A1 Siempre presente · A2 En ascenso · A3 Bajando el ritmo · A4 De elección grande · A5 Montaña rusa.',
        example: 'A4',
      },
      {
        name: 'arquetipo.nombre',
        type: 'texto',
        description: 'Nombre del arquetipo que se muestra en pantalla.',
        example: 'De elección grande',
      },
      {
        name: 'arquetipo.nivel',
        type: 'decimal',
        description: 'Distancia promedio frente a la participación nacional, en puntos.',
        example: '-4.590',
      },
      {
        name: 'arquetipo.efecto_presidencial',
        type: 'decimal',
        description:
          'Cuánto más sube en presidenciales que en intermedias, comparado con el país, en puntos.',
        example: '3.525',
      },
      {
        name: 'arquetipo.tendencia',
        type: 'decimal',
        description:
          'Cómo cambia su distancia frente al país, en puntos por década (sin el efecto del tipo de elección).',
        example: '-0.927',
      },
      {
        name: 'arquetipo.volatilidad',
        type: 'decimal',
        description:
          'Qué tan impredecible es: desviación de lo que no explican el tiempo y el tipo de elección, en puntos.',
        example: '3.909',
      },
      {
        name: 'arquetipo.tipicidad',
        type: 'decimal',
        description: '1 ÷ (1 + distancia al centro de su grupo). 1 = el municipio más típico.',
        example: '0.800',
      },
      {
        name: 'arquetipo.rasgo',
        type: 'texto',
        description: 'Rasgo que más lo distingue: nivel, efp (efecto presidencial), tend o vol.',
        example: 'efp',
      },
    ],
  },
  state: {
    title: 'Perfil de la entidad',
    files: 'Campo perfil_estatal de entidad/<entidad>.json',
    coverage: '32 de 32 entidades, con las 6 elecciones',
    source: 'Cálculo de ReVoto con la participación del INE',
    fields: [
      {
        name: 'perfil_estatal.nivel_pp',
        type: 'decimal',
        description: 'Distancia promedio de la entidad frente al país, en puntos.',
        example: '-3.964',
      },
      {
        name: 'perfil_estatal.efecto_presidencial_pp',
        type: 'decimal',
        description:
          'Cuánto más sube en presidenciales que en intermedias, frente al país, en puntos.',
        example: '2.198',
      },
      {
        name: 'perfil_estatal.tendencia_pp_decada',
        type: 'decimal',
        description: 'Cómo cambia su distancia frente al país, en puntos por década.',
        example: '0.838',
      },
      {
        name: 'perfil_estatal.volatilidad_pp',
        type: 'decimal',
        description: 'Qué tan impredecible es su serie, en puntos.',
        example: '4.161',
      },
    ],
  },
};
const TABS = [
  { value: 'turnout', text: 'Participación' },
  { value: 'ageSex', text: 'Edad y sexo' },
  { value: 'archetypes', text: 'Arquetipos' },
  { value: 'state', text: 'Entidad' },
] as const;

/** The dictionary of every dataset as a CSV the person can save. */
function downloadCsv() {
  const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [['conjunto', 'campo', 'tipo', 'descripcion', 'ejemplo', 'fuente', 'cobertura']];
  for (const d of Object.values(DATASETS)) {
    for (const f of d.fields) {
      rows.push([d.title, f.name, f.type, f.description, f.example, d.source, d.coverage]);
    }
  }
  const csv = rows.map((r) => r.map(quote).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'revoto-diccionario.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** W-19 · Data dictionary (US-07, US-22). Fields of the published JSON files, with their source. */
export function W19Dictionary() {
  const nav = useNavigation();
  const [tab, setTab] = useState<string>('turnout');
  const dataset = DATASETS[tab] ?? DATASETS.turnout!;
  return (
    <UtilityScreen
      top={
        <TopBar
          onBack={() => nav.goTo('W-16')}
          backLabel="Datos abiertos"
          onSettings={() => nav.openSheet('W-13')}
        />
      }
      title="Diccionario de datos"
      lead="Qué significa cada campo de los archivos que puedes descargar, de dónde sale y qué cubre."
    >
      <SegmentedControl label="Conjunto de datos" options={TABS} value={tab} onChange={setTab} />
      <DataList
        items={[
          { term: 'Archivos', value: dataset.files, icon: 'download', tone: 'neutral' },
          { term: 'Fuente', value: dataset.source, icon: 'info' },
          { term: 'Cobertura', value: dataset.coverage, icon: 'map', tone: 'indigo' },
          { term: 'Corte', value: CUTOFF, icon: 'calendar', tone: 'violet' },
        ]}
      />
      <FieldTable caption={`Campos de «${dataset.title}»`} fields={dataset.fields} />
      <Button variant="primary" icon="download" fullWidth="mobile" onClick={downloadCsv}>
        Descargar diccionario (CSV)
      </Button>
      <Text variant="meta">
        {SOURCE.name}. Proporciones de 0 a 1; puntos = puntos porcentuales.
      </Text>
    </UtilityScreen>
  );
}
