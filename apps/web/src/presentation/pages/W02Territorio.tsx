import { useState } from 'react';
import { Boton, CampoSelector, PantallaUtilitaria } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { BarraUtilitaria } from './compartido/BarraUtilitaria';

/**
 * W-02 · Elige tu territorio (HU-28, RF-05). Entidad → municipio dependiente.
 * Pendiente US-11: llenar las opciones con `listarEntidades` / `listarMunicipios`.
 */
export function W02Territorio() {
  const nav = useNavegacion();
  const [entidad, setEntidad] = useState('');
  const [municipio, setMunicipio] = useState('');
  return (
    <PantallaUtilitaria
      superior={<BarraUtilitaria />}
      titulo="¿Dónde votas?"
      entrada="Elige tu entidad y municipio para comparar sus cifras con las del país. No guardamos tu elección."
      accion={
        <>
          <Boton variante="primario" ancho onClick={nav.confirmarTerritorio}>
            Ver mis cifras
          </Boton>
          <Boton variante="texto" onClick={nav.confirmarTerritorio}>
            Continuar con cifras nacionales
          </Boton>
        </>
      }
    >
      <CampoSelector
        etiqueta="Entidad"
        opciones={[]}
        valor={entidad}
        onCambio={setEntidad}
        vacio="[Entidades: listarEntidades]"
      />
      <CampoSelector
        etiqueta="Municipio"
        opciones={[]}
        valor={municipio}
        onCambio={setMunicipio}
        deshabilitado={!entidad}
        vacio="[Municipios de la entidad]"
      />
    </PantallaUtilitaria>
  );
}
