import { useState } from 'react';
import {
  Button,
  FieldTable,
  Notice,
  SegmentedControl,
  Text,
  TopBar,
  UtilityScreen,
  type Field,
} from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

const GEOGRAPHY: readonly Field[] = [
  {
    name: 'cve_entidad',
    type: 'entero',
    description: 'Clave INEGI de la entidad (1–32).',
    example: '14',
  },
  {
    name: 'cve_municipio',
    type: 'entero',
    description: 'Clave INEGI del municipio dentro de la entidad.',
    example: '39',
  },
];
const ELECTION: readonly Field[] = [
  {
    name: 'anio',
    type: 'entero',
    description: 'Año de la elección federal: 2009, 2012, 2015, 2018, 2021 o 2024.',
    example: '2024',
  },
  {
    name: 'tipo',
    type: 'texto',
    description: 'presidencial o intermedia (RN-03).',
    example: 'presidencial',
  },
];
const TURNOUT: Field = {
  name: 'participacion',
  type: 'decimal',
  description: 'Votaron ÷ (lista nominal − sin dato), de 0 a 1 con 3 decimales (RN-01).',
  example: '0.598',
};

/** Columns of each published file (contract L4, `@revoto/contracts`). */
const DATASETS: Record<string, { title: string; fields: readonly Field[] | null }> = {
  turnout: {
    title: 'Participación por entidad y municipio',
    fields: [
      ...GEOGRAPHY,
      {
        name: 'nombre',
        type: 'texto',
        description: 'Nombre oficial del territorio.',
        example: 'Guadalajara',
      },
      ...ELECTION,
      {
        name: 'lista_nominal',
        type: 'entero',
        description: 'Personas en la lista nominal del territorio.',
        example: '[n]',
      },
      TURNOUT,
      {
        name: 'suprimido',
        type: 'booleano',
        description:
          'true si no alcanza el umbral de publicación (RN-05); entonces no trae cifras.',
        example: 'false',
      },
    ],
  },
  ageSex: {
    title: 'Participación por edad y sexo',
    fields: [
      ...GEOGRAPHY,
      ...ELECTION,
      {
        name: 'grupo_edad',
        type: 'texto',
        description: '18-24, 25-34, 35-44, 45-59 o 60+ (RN-04). La edad simple nunca se publica.',
        example: '25-34',
      },
      {
        name: 'sexo',
        type: 'texto',
        description: 'H o M, según el catálogo (RN-06).',
        example: 'M',
      },
      TURNOUT,
    ],
  },
  archetypes: { title: 'Arquetipos municipales', fields: null },
};
const TABS = [
  { value: 'turnout', text: 'Participación' },
  { value: 'ageSex', text: 'Edad y sexo' },
  { value: 'archetypes', text: 'Arquetipos' },
] as const;

/** W-19 · Data dictionary (US-22). Columns of the CSV and JSON files of open data. */
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
      lead="Columnas de los archivos CSV y JSON que puedes descargar."
    >
      <SegmentedControl label="Conjunto de datos" options={TABS} value={tab} onChange={setTab} />
      {dataset.fields ? (
        <FieldTable caption={`Campos de «${dataset.title}»`} fields={dataset.fields} />
      ) : (
        <Notice tone="pending">
          El esquema de arquetipos se publica junto con el dataset final de la clasificación.
        </Notice>
      )}
      <Button variant="primary" icon="download" fullWidth="mobile" disabled>
        Descargar diccionario (CSV)
      </Button>
      <Text variant="meta">El CSV se publica con el dataset final.</Text>
    </UtilityScreen>
  );
}
