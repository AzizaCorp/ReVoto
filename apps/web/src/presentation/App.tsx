import { useEffect } from 'react';
import { OcultoVisual } from '@/presentation/components';
import { useAtajosNavegacion } from '@/presentation/hooks/useAtajosNavegacion';
import { HOJAS, PAGINAS } from '@/presentation/pages';
import { ProveedorNavegacion, useNavegacion } from '@/presentation/providers/Navegacion';
import { ProveedorPerfil } from '@/presentation/providers/Perfil';

/** Monta la página actual, la hoja abierta y la región viva del progreso (HU-14). */
function Vista() {
  const nav = useNavegacion();
  const Pagina = PAGINAS[nav.actual];
  const Hoja = nav.hoja ? HOJAS[nav.hoja] : null;

  useAtajosNavegacion({ activo: !nav.hoja, siguiente: nav.siguiente, anterior: nav.anterior });

  // Al cambiar de pantalla, el foco va al título para que el lector de pantalla lo anuncie.
  useEffect(() => {
    document.querySelector<HTMLElement>('#contenido h1')?.focus();
  }, [nav.actual]);

  return (
    <main id="contenido" aria-label="ReVoto">
      <Pagina />
      <div aria-live="polite">
        {nav.progreso && <OcultoVisual>{nav.progreso.texto}</OcultoVisual>}
      </div>
      {Hoja && <Hoja />}
    </main>
  );
}

/** Raíz de la presentación: proveedores de estado de la sesión y motor de secuencia (US-09). */
export function App() {
  return (
    <ProveedorPerfil>
      <ProveedorNavegacion>
        <Vista />
      </ProveedorNavegacion>
    </ProveedorPerfil>
  );
}
