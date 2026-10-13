import { Boton, Texto } from '../../atoms';
import estilos from './BarraInferior.module.css';

export interface BarraInferiorProps {
  /** Abre W-11. Toda pantalla con cifra lo muestra (RF-12, RN-10). */
  onFuente?: () => void;
  /** Abre W-12 si la pantalla es compartible (RF-15). */
  onCompartir?: () => void;
  /** `null` en el primer paso: el botón no se dibuja (HU-10, sin vuelta circular). */
  onAnterior: (() => void) | null;
  /** `null` en el último paso: se muestra «Fin». */
  onSiguiente: (() => void) | null;
  /** Texto del botón de avance (portada: «Empezar»). */
  textoSiguiente?: string;
  /** Fondo oscuro (portada). */
  oscura?: boolean;
  /** Sin ‹ › ni «Fin»: la pantalla ya tiene su propia acción para avanzar (portada). */
  sinAvance?: boolean;
}

/**
 * Barra inferior del diseño de alta fidelidad.
 * Móvil: Fuente · Compartir a la izquierda y ‹ › en círculos de 44 px a la derecha.
 * Tablet: Fuente · Compartir y «← Anterior» / «Siguiente →» con texto.
 * Escritorio: nota de fuente a la izquierda (Fuente y Compartir suben a la barra superior).
 */
export function BarraInferior({
  onFuente,
  onCompartir,
  onAnterior,
  onSiguiente,
  textoSiguiente = 'Siguiente',
  oscura,
  sinAvance,
}: BarraInferiorProps) {
  return (
    <nav
      className={[estilos.barraInferior, oscura ? estilos.oscura : ''].join(' ')}
      aria-label="Navegación de la historia"
    >
      <div className={estilos.izquierda}>
        {onFuente && (
          <Boton
            tamano="chico"
            icono="ⓘ"
            colapsable="estrecho"
            etiqueta="Fuente"
            onClick={onFuente}
          >
            Fuente
          </Boton>
        )}
        {onCompartir && (
          <Boton
            tamano="chico"
            icono="↗"
            colapsable="estrecho"
            etiqueta="Compartir"
            onClick={onCompartir}
          >
            Compartir
          </Boton>
        )}
      </div>
      <span className={estilos.nota}>
        <Texto rol="meta">Fuente: conteos censales INE 2009–2024 · Sin datos personales</Texto>
      </span>
      {!sinAvance && (
        <div className={estilos.derecha}>
          {onAnterior && (
            <Boton colapsable icono="←" onClick={onAnterior} etiqueta="Pantalla anterior">
              Anterior
            </Boton>
          )}
          {onSiguiente ? (
            <Boton
              colapsable
              variante={oscura ? 'marca' : 'primario'}
              iconoFinal="→"
              onClick={onSiguiente}
              etiqueta="Pantalla siguiente"
            >
              {textoSiguiente}
            </Boton>
          ) : (
            <span className={estilos.fin}>Fin</span>
          )}
        </div>
      )}
    </nav>
  );
}
