import { Boton, BotonIcono } from '../../atoms';
import estilos from './BarraInferior.module.css';

export interface BarraInferiorProps {
  /** Abre W-11. Toda pantalla con cifra lo muestra (RF-12, RN-10). */
  onFuente?: () => void;
  /** Abre W-12 si la pantalla es compartible (RF-15). */
  onCompartir?: () => void;
  /** `null` en el primer paso: el botón queda deshabilitado (HU-10, sin vuelta circular). */
  onAnterior: (() => void) | null;
  onSiguiente: (() => void) | null;
}

/** Zona inferior de 72 px: Fuente · Compartir · ‹ › (manual §7.1, RF-02). */
export function BarraInferior({
  onFuente,
  onCompartir,
  onAnterior,
  onSiguiente,
}: BarraInferiorProps) {
  return (
    <nav className={estilos.barraInferior} aria-label="Navegación de la historia">
      <div className={estilos.grupo}>
        {onFuente && (
          <Boton compacto onClick={onFuente}>
            <span aria-hidden="true">ⓘ</span> Fuente
          </Boton>
        )}
        {onCompartir && (
          <Boton compacto onClick={onCompartir} etiqueta="Compartir">
            <span aria-hidden="true">↗</span>
            <span className={estilos.textoAncho}>Compartir</span>
          </Boton>
        )}
      </div>
      <div className={estilos.grupo}>
        <BotonIcono
          etiqueta="Pantalla anterior"
          onClick={onAnterior ?? undefined}
          deshabilitado={!onAnterior}
        >
          ‹
        </BotonIcono>
        <BotonIcono
          etiqueta="Pantalla siguiente"
          onClick={onSiguiente ?? undefined}
          deshabilitado={!onSiguiente}
          relleno
        >
          ›
        </BotonIcono>
      </div>
    </nav>
  );
}
