import type { ReactNode } from 'react';
import {
  BarraInferior,
  BarraSuperior,
  PantallaNarrativa,
  Pastilla,
} from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';
import estilos from './MarcoHistoria.module.css';

export interface MarcoHistoriaProps {
  children: ReactNode;
  visual?: ReactNode;
  /** Píldora de sección («MÉXICO»). El número «N/9» lo pone el motor. */
  etiqueta?: string;
  /** Muestra la píldora «Datos pendientes» del esqueleto. */
  pendiente?: boolean;
  /** La pantalla muestra cifras: lleva «Fuente» (RF-12). */
  conFuente?: boolean;
  /** La pantalla es compartible: lleva «Compartir» (RF-15). */
  compartible?: boolean;
  /** Portada: fondo oscuro, sin número de paso y sin ‹ › (avanza con su botón principal). */
  portada?: boolean;
}

/** Número de la píldora de sección: la portada no cuenta, así que W-03 es «2/9». */
export function useNumeroPaso(): string | undefined {
  const { progreso } = useNavegacion();
  return progreso && progreso.posicion > 1
    ? `${progreso.posicion - 1}/${progreso.total - 1}`
    : undefined;
}

/** Une la plantilla narrativa con el motor de secuencia: barras, progreso y navegación. */
export function MarcoHistoria({
  children,
  visual,
  etiqueta,
  pendiente,
  conFuente = true,
  compartible = true,
  portada,
}: MarcoHistoriaProps) {
  const nav = useNavegacion();
  const numero = useNumeroPaso();
  const fuente = conFuente ? () => nav.abrirHoja('W-11') : undefined;
  const compartir = compartible ? () => nav.abrirHoja('W-12') : undefined;
  return (
    <PantallaNarrativa
      oscura={portada}
      visual={visual}
      superior={
        <BarraSuperior
          oscura={portada}
          progreso={nav.progreso}
          nombrePaso={nav.nombrePaso ?? undefined}
          onAjustes={() => nav.abrirHoja('W-13')}
          onFuente={fuente}
          onCompartir={compartir}
        />
      }
      inferior={
        <BarraInferior
          oscura={portada}
          onFuente={fuente}
          onCompartir={compartir}
          onAnterior={nav.anterior}
          onSiguiente={nav.siguiente}
          sinAvance={portada}
        />
      }
    >
      {(etiqueta || pendiente) && (
        <div className={estilos.fila}>
          {etiqueta && <Pastilla numero={portada ? undefined : numero}>{etiqueta}</Pastilla>}
          {pendiente && <Pastilla tono="pendiente">Datos pendientes</Pastilla>}
        </div>
      )}
      {children}
    </PantallaNarrativa>
  );
}
