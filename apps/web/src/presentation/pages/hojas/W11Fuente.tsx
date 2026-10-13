import { Boton, ListaDatos, PlantillaHoja, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';

/** W-11 · Ficha de fuente (RF-12, RN-10). Pendiente US-12: datos de la cifra de origen. */
export function W11Fuente() {
  const nav = useNavegacion();
  return (
    <PlantillaHoja
      abierta
      titulo="¿De dónde sale esta cifra?"
      onCerrar={nav.cerrarHoja}
      acciones={
        <>
          <Boton href="https://www.ine.mx/transparencia/datos-abiertos/">
            Portal de datos abiertos del INE
          </Boton>
          <Boton variante="texto">Copiar cita</Boton>
        </>
      }
    >
      <Texto rol="meta">Desde: {nav.nombrePaso ?? '[Pantalla de origen]'}</Texto>
      <ListaDatos
        datos={[
          { termino: 'Fuente', valor: 'INE · DECEYEC · Conteos censales de participación' },
          { termino: 'Elección', valor: 'Federal [año] ([fecha])' },
          { termino: 'Territorio', valor: '[Municipio], [Entidad]' },
          { termino: 'Fecha de corte', valor: '[dd/mm/aaaa]' },
          { termino: 'Fórmula', valor: 'Votaron ÷ (lista nominal − sin dato)' },
          {
            termino: 'Se excluyeron',
            valor:
              '[—.— %] de registros sin dato de participación. No son abstención: el registro no trae información.',
          },
        ]}
      />
    </PlantillaHoja>
  );
}
