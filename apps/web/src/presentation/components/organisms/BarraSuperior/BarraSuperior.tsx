import { BotonIcono, Texto } from '../../atoms';
import { BarraProgreso, ChipTerritorio } from '../../molecules';
import estilos from './BarraSuperior.module.css';

export interface ProgresoBarra {
  posicion: number;
  total: number;
  texto: string;
}

export interface BarraSuperiorProps {
  /** Sin progreso en pantallas fuera de la historia (W-01, W-16). */
  progreso?: ProgresoBarra | null;
  /** Nombre del paso actual; se muestra junto al progreso en escritorio. */
  nombrePaso?: string;
  /** «Entidad · Municipio». Sin territorio no se muestra el chip. */
  territorio?: string | null;
  onTerritorio?: () => void;
  onAjustes: () => void;
}

/** Zona superior de 56 px: progreso, chip de territorio y «Aa» (manual §7.1, RIU-03). */
export function BarraSuperior({
  progreso,
  nombrePaso,
  territorio,
  onTerritorio,
  onAjustes,
}: BarraSuperiorProps) {
  return (
    <header className={estilos.barraSuperior}>
      <span className={estilos.marca}>ReVoto</span>
      {progreso && (
        <div className={estilos.progreso}>
          <BarraProgreso {...progreso} />
          {nombrePaso && (
            <span className={estilos.paso} aria-hidden="true">
              <Texto rol="meta">
                Paso {progreso.posicion} de {progreso.total} · {nombrePaso}
              </Texto>
            </span>
          )}
        </div>
      )}
      <div className={estilos.acciones}>
        {territorio && onTerritorio && (
          <ChipTerritorio territorio={territorio} onClick={onTerritorio} />
        )}
        <BotonIcono etiqueta="Ajustes de lectura" onClick={onAjustes}>
          Aa
        </BotonIcono>
      </div>
    </header>
  );
}
