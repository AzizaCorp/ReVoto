import { Aviso, Boton, Ranura, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import { usePerfil } from '@/presentation/providers/Perfil';
import { MarcoHistoria } from './compartido/MarcoHistoria';

/** W-09b · Tu insignia. Sale de las respuestas de W-02b; sin respuestas no hay insignia. */
export function W09bInsignia() {
  const nav = useNavegacion();
  const { completo } = usePerfil();
  return (
    <MarcoHistoria
      compartible={false}
      visual={<Ranura etiqueta="Tarjeta de tu insignia (I1–I6)" alto="llena" />}
    >
      <Texto rol="etiqueta">Tu insignia</Texto>
      <Texto rol="h1">Y tú, ¿cómo votas?</Texto>
      {completo ? (
        <Ranura etiqueta="Tú y tu generación" alto="chica">
          Tú: — de 3 · [Edad] en [Entidad]: —.— de 3
        </Ranura>
      ) : (
        <Aviso>Responde «Sobre ti» para recibir tu insignia.</Aviso>
      )}
      <Boton variante="texto" onClick={() => nav.irA('W-02b')}>
        {completo ? 'Cambiar respuestas' : 'Responder ahora'}
      </Boton>
      <Boton variante="primario" onClick={() => nav.abrirHoja('W-12')}>
        Compartir mi insignia
      </Boton>
    </MarcoHistoria>
  );
}
