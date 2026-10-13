import { useState } from 'react';
import {
  Button,
  SearchField,
  SelectableRow,
  SelectField,
  Slot,
  UtilityScreen,
  type BubbleTone,
} from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStepNumber } from './shared/StoryFrame';
import layout from './shared/Layout.module.css';
import { UtilityTopBar } from './shared/UtilityTopBar';

/** The 32 states (INEGI catalog). Pending US-11: read them with `listStates`. */
const STATES = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Coahuila de Zaragoza',
  'Colima',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Durango',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'México',
  'Michoacán de Ocampo',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz de Ignacio de la Llave',
  'Yucatán',
  'Zacatecas',
] as const;
const TONES: readonly BubbleTone[] = ['brand', 'violet', 'indigo', 'brand', 'neutral'];
const normalize = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** W-02 · Choose your territory (HU-28, RF-05). State → dependent municipality. */
export function W02Territory() {
  const nav = useNavigation();
  const number = useStepNumber();
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [municipality, setMunicipality] = useState('');
  const visible = STATES.filter((s) => normalize(s).includes(normalize(query)));
  return (
    <UtilityScreen
      top={<UtilityTopBar />}
      label="Tu territorio"
      number={number}
      title="¿Dónde votas?"
      lead="Elige tu entidad y municipio para comparar sus cifras con las del país. No guardamos tu elección."
      aside={<Slot label="Mapa de entidades (elige en la lista o en el mapa)" height="large" />}
      actions={
        <>
          <Button
            variant="primary"
            size="large"
            trailingIcon="arrow"
            fullWidth="mobile"
            onClick={nav.confirmTerritory}
          >
            Continuar
          </Button>
          <Button icon="back" onClick={() => nav.goTo('W-01')}>
            Inicio
          </Button>
          <Button variant="text" onClick={nav.confirmTerritory}>
            Usar cifras nacionales
          </Button>
        </>
      }
    >
      <SearchField
        label="Buscar entidad"
        value={query}
        onChange={setQuery}
        placeholder="Busca tu entidad o municipio…"
      />
      <div role="radiogroup" aria-label="Entidad" className={layout.stack}>
        {visible.slice(0, query ? undefined : 5).map((s, i) => (
          <SelectableRow
            key={s}
            checked={state === s}
            tone={TONES[i % TONES.length]}
            onSelect={() => {
              setState(s);
              setMunicipality('');
            }}
          >
            {s}
          </SelectableRow>
        ))}
      </div>
      <SelectField
        label="Municipio"
        options={[]}
        value={municipality}
        onChange={setMunicipality}
        disabled={!state}
        placeholder={state ? `Elige un municipio de ${state}` : 'Primero elige una entidad'}
      />
    </UtilityScreen>
  );
}
