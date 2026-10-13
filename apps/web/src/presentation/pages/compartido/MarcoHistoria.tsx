import type { ReactNode } from 'react';
import { BarraInferior, BarraSuperior, PantallaNarrativa } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';

export interface MarcoHistoriaProps {
  children: ReactNode;
  visual?: ReactNode;
  /** La pantalla muestra cifras: lleva «Fuente» (RF-12). */
  conFuente?: boolean;
  /** La pantalla es compartible: lleva «Compartir» (RF-15). */
  compartible?: boolean;
  /** Oculta el progreso (W-01). */
  sinProgreso?: boolean;
}

/** Une la plantilla narrativa con el motor de secuencia: barras, progreso y navegación. */
export function MarcoHistoria({
  children,
  visual,
  conFuente = true,
  compartible = true,
  sinProgreso,
}: MarcoHistoriaProps) {
  const nav = useNavegacion();
  return (
    <PantallaNarrativa
      visual={visual}
      superior={
        <BarraSuperior
          progreso={sinProgreso ? null : nav.progreso}
          nombrePaso={nav.nombrePaso ?? undefined}
          territorio={sinProgreso ? null : nav.territorio}
          onTerritorio={nav.cambiarTerritorio}
          onAjustes={() => nav.abrirHoja('W-13')}
        />
      }
      inferior={
        <BarraInferior
          onFuente={conFuente ? () => nav.abrirHoja('W-11') : undefined}
          onCompartir={compartible ? () => nav.abrirHoja('W-12') : undefined}
          onAnterior={nav.anterior}
          onSiguiente={nav.siguiente}
        />
      }
    >
      {children}
    </PantallaNarrativa>
  );
}
