import { PantallaUtilitaria, Texto, VistaEstado } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';

/**
 * W-17 · Catálogo de estados (solo QA: `#/W-17`). En la app, los estados no son una pantalla:
 * cada página los muestra con `VistaEstado` según el resultado del caso de uso.
 */
export function W17Estados() {
  const nav = useNavegacion();
  return (
    <PantallaUtilitaria titulo="Estados de pantalla" onVolver={() => nav.irA(nav.ultimaPantalla)}>
      <Texto rol="etiqueta">A · Cargando</Texto>
      <VistaEstado estado="cargando" />
      <Texto rol="etiqueta">B · Error</Texto>
      <VistaEstado estado="error" onReintentar={() => {}} onVersionLigera={() => nav.irA('W-15')} />
      <Texto rol="etiqueta">C · Umbral de publicación</Texto>
      <VistaEstado estado="umbral" />
      <Texto rol="etiqueta">D · Periodo faltante</Texto>
      <VistaEstado estado="periodo-faltante" />
      <Texto rol="etiqueta">E · Sin dato en esa elección</Texto>
      <VistaEstado estado="sin-dato" />
      <Texto rol="etiqueta">F · Sin dataset</Texto>
      <VistaEstado estado="sin-dataset" />
    </PantallaUtilitaria>
  );
}
