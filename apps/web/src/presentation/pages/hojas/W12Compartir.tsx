import { useState } from 'react';
import { Boton, GrupoOpciones, PlantillaHoja, Ranura, Texto } from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';

const QUE = ['Mi municipio', 'Mi insignia', 'Los dos'] as const;
const FORMATOS = ['Historia 9:16', 'Publicación 1:1'] as const;

/** W-12 · Crear tarjeta (RF-15, RN-08). Pendiente US-14: tarjetas reales y exportación a PNG. */
export function W12Compartir() {
  const nav = useNavegacion();
  const [que, setQue] = useState<string>(QUE[0]);
  const [formato, setFormato] = useState<string>(FORMATOS[0]);
  return (
    <PlantillaHoja
      abierta
      titulo="Comparte este dato"
      onCerrar={nav.cerrarHoja}
      acciones={
        <>
          <Boton variante="primario">Compartir…</Boton>
          <Boton>Descargar imagen</Boton>
        </>
      }
    >
      <GrupoOpciones pregunta="¿Qué compartes?" opciones={QUE} seleccion={que} onElegir={setQue} />
      <GrupoOpciones
        pregunta="Formato"
        opciones={FORMATOS}
        seleccion={formato}
        onElegir={setFormato}
      />
      <Ranura etiqueta={`Vista previa · ${que} · ${formato}`} alto="grande" />
      <Texto rol="meta">Nunca incluye datos personales.</Texto>
    </PlantillaHoja>
  );
}
