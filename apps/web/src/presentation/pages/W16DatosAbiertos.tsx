import { Aviso, Boton, ListaDatos, PantallaUtilitaria } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';

const CONJUNTOS = [
  'Participación por entidad y municipio',
  'Participación por edad y sexo',
  'Arquetipos municipales',
] as const;

/** W-16 · Datos abiertos (US-22). Pendiente: ligas a los CSV/JSON publicados. */
export function W16DatosAbiertos() {
  const nav = useNavegacion();
  return (
    <PantallaUtilitaria
      titulo="Datos abiertos"
      entrada="Los mismos agregados que usa este sitio. Úsalos, verifícalos y cítalos."
      onVolver={() => nav.irA(nav.ultimaPantalla)}
      accion={
        <>
          <Boton variante="texto">Diccionario</Boton>
          <Boton variante="texto">Metodología</Boton>
          <Boton variante="texto">Reporte de calidad y validación</Boton>
        </>
      }
    >
      <Aviso tono="pendiente">Se publican con el dataset final.</Aviso>
      <ListaDatos
        datos={CONJUNTOS.map((c) => ({
          termino: c,
          valor: '2009–2024 · corte [dd/mm/aaaa] · [peso] · CSV · JSON',
        }))}
      />
    </PantallaUtilitaria>
  );
}
