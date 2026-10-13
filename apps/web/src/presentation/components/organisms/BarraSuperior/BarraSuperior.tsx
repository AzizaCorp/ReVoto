import { Boton, BotonIcono, Logo, Texto } from '../../atoms';
import { BarraProgreso } from '../../molecules';
import estilos from './BarraSuperior.module.css';

export interface ProgresoBarra {
  posicion: number;
  total: number;
  texto: string;
}

export interface BarraSuperiorProps {
  /** Sin progreso en pantallas fuera de la historia (W-16, W-17). */
  progreso?: ProgresoBarra | null;
  /** Nombre del paso actual; se lee junto al progreso en escritorio. */
  nombrePaso?: string;
  onAjustes: () => void;
  /** En escritorio «Fuente» y «Compartir» suben a esta barra. */
  onFuente?: () => void;
  onCompartir?: () => void;
  /** Fondo oscuro (portada). */
  oscura?: boolean;
}

/**
 * Barra superior del diseño de alta fidelidad.
 * Móvil: progreso a todo lo ancho y, debajo, logotipo + «Aa».
 * Tablet: logotipo · progreso · «N/10» · «Aa» en una fila.
 * Escritorio: logotipo · progreso con «Paso N de 10 · nombre» · Fuente · Compartir · «Aa».
 */
export function BarraSuperior({
  progreso,
  nombrePaso,
  onAjustes,
  onFuente,
  onCompartir,
  oscura,
}: BarraSuperiorProps) {
  return (
    <header className={[estilos.barraSuperior, oscura ? estilos.oscura : ''].join(' ')}>
      <div className={estilos.logo}>
        <Logo sobre={oscura ? 'oscuro' : 'claro'} />
      </div>
      <div className={estilos.progreso}>
        {progreso && (
          <>
            <BarraProgreso {...progreso} />
            {nombrePaso && (
              <span className={estilos.paso} aria-hidden="true">
                <Texto rol="meta">
                  Paso {progreso.posicion} de {progreso.total} · {nombrePaso}
                </Texto>
              </span>
            )}
          </>
        )}
      </div>
      {progreso && (
        <span className={estilos.contador} aria-hidden="true">
          {progreso.posicion}/{progreso.total}
        </span>
      )}
      <div className={estilos.acciones}>
        {onFuente && (
          <Boton tamano="chico" icono="ⓘ" onClick={onFuente}>
            Fuente
          </Boton>
        )}
        {onCompartir && (
          <Boton tamano="chico" icono="↗" onClick={onCompartir}>
            Compartir
          </Boton>
        )}
      </div>
      <div className={estilos.aa}>
        <BotonIcono etiqueta="Ajustes de lectura" onClick={onAjustes}>
          Aa
        </BotonIcono>
      </div>
    </header>
  );
}
