import { BarraSuperior } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';

/** Barra superior para pantallas utilitarias que siguen en la historia (W-02, W-02b, W-10). */
export function BarraUtilitaria() {
  const nav = useNavegacion();
  return (
    <BarraSuperior
      progreso={nav.progreso}
      nombrePaso={nav.nombrePaso ?? undefined}
      onAjustes={() => nav.abrirHoja('W-13')}
    />
  );
}
