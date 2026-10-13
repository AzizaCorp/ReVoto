import { useState } from 'react';
import { Button, SelectField, UtilityScreen } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStepNumber } from './shared/StoryFrame';
import { UtilityTopBar } from './shared/UtilityTopBar';

/**
 * W-02 · Choose your territory (HU-28, RF-05). State → dependent municipality.
 * Pending US-11: fill the options with `listStates` / `listMunicipalities`.
 */
export function W02Territory() {
  const nav = useNavigation();
  const number = useStepNumber();
  const [state, setState] = useState('');
  const [municipality, setMunicipality] = useState('');
  return (
    <UtilityScreen
      top={<UtilityTopBar />}
      label="Tu territorio"
      number={number}
      title="¿Dónde votas?"
      lead="Elige tu entidad y municipio para comparar sus cifras con las del país. No guardamos tu elección."
      actions={
        <>
          <Button
            variant="primary"
            size="large"
            trailingIcon="→"
            fullWidth
            onClick={nav.confirmTerritory}
          >
            Continuar
          </Button>
          <Button size="small" icon="←" onClick={() => nav.goTo('W-01')}>
            Inicio
          </Button>
          <Button variant="text" onClick={nav.confirmTerritory}>
            Usar cifras nacionales
          </Button>
        </>
      }
    >
      <SelectField
        label="Entidad"
        options={[]}
        value={state}
        onChange={setState}
        placeholder="[Entidades: listStates]"
      />
      <SelectField
        label="Municipio"
        options={[]}
        value={municipality}
        onChange={setMunicipality}
        disabled={!state}
        placeholder="[Municipios de la entidad]"
      />
    </UtilityScreen>
  );
}
