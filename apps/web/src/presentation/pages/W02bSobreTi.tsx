import { Aviso, Boton, GrupoOpciones, PantallaUtilitaria, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { PREGUNTAS, usePerfil } from '@/presentation/providers/Perfil';
import { BarraUtilitaria } from './compartido/BarraUtilitaria';

/** W-02b · Sobre ti (opcional). Cuatro preguntas para la insignia; nada sale del dispositivo. */
export function W02bSobreTi() {
  const nav = useNavegacion();
  const { respuestas, responder } = usePerfil();
  return (
    <PantallaUtilitaria
      superior={<BarraUtilitaria />}
      titulo="Cuéntanos de ti"
      entrada="4 toques y al final te damos tu insignia, comparada con tu generación en [Entidad]."
      accion={
        <>
          <Boton variante="primario" ancho onClick={nav.siguiente ?? undefined}>
            Ver mis cifras
          </Boton>
          <Boton variante="texto" onClick={nav.siguiente ?? undefined}>
            Saltar
          </Boton>
        </>
      }
    >
      <Texto rol="etiqueta">Sobre ti · Opcional</Texto>
      {PREGUNTAS.map((p) => (
        <GrupoOpciones
          key={p.clave}
          pregunta={p.texto}
          opciones={p.opciones}
          seleccion={respuestas[p.clave]}
          onElegir={(v) => responder(p.clave, v)}
        />
      ))}
      <Aviso>
        Tus respuestas se quedan en tu teléfono: no las guardamos ni las enviamos. Solo sirven para
        darte tu insignia.
      </Aviso>
    </PantallaUtilitaria>
  );
}
