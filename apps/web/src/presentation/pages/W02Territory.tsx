import { useState } from 'react';
import { listMunicipalities, listStates } from '@/application';
import { NATIONAL, type Territory } from '@/domain';
import {
  Button,
  Notice,
  SearchField,
  SelectableRow,
  SelectField,
  Text,
  UtilityScreen,
  type BubbleTone,
} from '@/presentation/components';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStepNumber } from './shared/StoryFrame';
import layout from './shared/Layout.module.css';
import { StatesPicker } from './shared/maps';
import { UtilityTopBar } from './shared/UtilityTopBar';

const TONES: readonly BubbleTone[] = ['brand', 'violet', 'indigo', 'brand', 'neutral'];
const normalize = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const stateCodeOf = (t: Territory) => (t.level === 'national' ? null : t.stateCode);

/**
 * W-02 · Choose your territory (HU-28, RF-05). State → dependent municipality, read through the
 * TurnoutRepository port (catalogos/entidades.json and entidad/<cve>.json).
 */
export function W02Territory() {
  const nav = useNavigation();
  const { turnout } = useDependencies();
  const number = useStepNumber();
  const [query, setQuery] = useState('');
  const [stateCode, setStateCode] = useState<number | null>(stateCodeOf(nav.selected));
  const [municipality, setMunicipality] = useState(
    nav.selected.level === 'municipality' ? nav.selected.key : '',
  );
  const states = useAsync(() => listStates(turnout), [turnout]);
  const towns = useAsync(
    () => (stateCode ? listMunicipalities(turnout, stateCode) : Promise.resolve([])),
    [turnout, stateCode],
  );

  const stateList = states.status === 'ready' ? states.data : [];
  const chosenState = stateList.find((s) => stateCodeOf(s) === stateCode) ?? null;
  const townList = towns.status === 'ready' ? towns.data : [];
  const visible = stateList.filter((s) => normalize(s.name).includes(normalize(query)));
  const shown = query ? visible : visible.slice(0, 5);
  if (chosenState && !shown.includes(chosenState)) shown.unshift(chosenState);

  const confirm = (t: Territory) => {
    nav.chooseTerritory(t);
    nav.confirmTerritory();
  };
  const chosen =
    townList.find((t) => t.level === 'municipality' && t.key === municipality) ??
    chosenState ??
    NATIONAL;

  return (
    <UtilityScreen
      top={<UtilityTopBar />}
      label="Tu territorio"
      number={number}
      title="¿Dónde votas?"
      lead="Elige tu entidad y municipio para comparar sus cifras con las del país. No guardamos tu elección."
      aside={
        <>
          <StatesPicker
            selected={stateCode}
            onSelect={(code) => {
              setStateCode(code);
              setMunicipality('');
            }}
          />
          <Text variant="meta">
            ¿Tu entidad es pequeña en el mapa? Acércalo con + o búscala por nombre.
          </Text>
        </>
      }
      actions={
        <>
          <Button
            variant="primary"
            size="large"
            trailingIcon="arrow"
            fullWidth="mobile"
            onClick={() => confirm(chosen)}
          >
            Continuar
          </Button>
          <Button icon="back" onClick={() => nav.goTo('W-01')}>
            Inicio
          </Button>
          <Button variant="text" onClick={() => confirm(NATIONAL)}>
            Usar cifras nacionales
          </Button>
        </>
      }
    >
      <SearchField
        label="Buscar entidad"
        value={query}
        onChange={setQuery}
        placeholder="Busca tu entidad…"
      />
      {states.status === 'error' ? (
        <Notice tone="error" title="No pudimos cargar las entidades">
          <Button variant="text" onClick={states.retry}>
            Reintentar
          </Button>
        </Notice>
      ) : (
        <div
          role="radiogroup"
          aria-label="Entidad"
          aria-busy={states.status === 'loading'}
          className={layout.stack}
        >
          {shown.map((s, i) => (
            <SelectableRow
              key={s.name}
              checked={s === chosenState}
              tone={TONES[i % TONES.length]}
              onSelect={() => {
                setStateCode(stateCodeOf(s));
                setMunicipality('');
              }}
            >
              {s.name}
            </SelectableRow>
          ))}
        </div>
      )}
      <SelectField
        label="Municipio"
        options={townList.map((t) => ({
          value: t.level === 'municipality' ? t.key : '',
          text: t.name,
        }))}
        value={municipality}
        onChange={setMunicipality}
        disabled={!chosenState || towns.status !== 'ready'}
        placeholder={
          !chosenState
            ? 'Primero elige una entidad'
            : towns.status === 'loading'
              ? 'Cargando municipios…'
              : `Elige un municipio de ${chosenState.name}`
        }
      />
    </UtilityScreen>
  );
}
