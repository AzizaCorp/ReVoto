import { useState } from 'react';
import {
  Boton,
  FilaInterruptor,
  GrupoOpciones,
  PlantillaHoja,
  Texto,
} from '@/presentation/components';
import { useNavegacion } from '@/presentation/providers/Navegacion';

const raiz = () => document.documentElement;
const TAMANOS = ['A−', 'A', 'A+'] as const;

/**
 * W-13 · Ajustes de lectura (HU-10, RF-16). Los ajustes viven como atributos de `<html>`:
 * `data-lectura="facil"` y `data-movimiento="reducido"` (ver tokens.css).
 */
export function W13Ajustes() {
  const nav = useNavegacion();
  const [facil, setFacil] = useState(() => raiz().dataset.lectura === 'facil');
  const [reducido, setReducido] = useState(() => raiz().dataset.movimiento === 'reducido');
  const [tamano, setTamano] = useState<string>('A');

  const cambiarFacil = (v: boolean) => {
    setFacil(v);
    if (v) raiz().dataset.lectura = 'facil';
    else delete raiz().dataset.lectura;
  };
  const cambiarMovimiento = (v: boolean) => {
    setReducido(v);
    if (v) raiz().dataset.movimiento = 'reducido';
    else delete raiz().dataset.movimiento;
  };

  return (
    <PlantillaHoja
      abierta
      titulo="Ajustes de lectura"
      onCerrar={nav.cerrarHoja}
      acciones={<Boton onClick={() => nav.irA('W-10')}>Ver resumen</Boton>}
    >
      <FilaInterruptor
        titulo="Lectura fácil"
        descripcion="Letra más grande, frases cortas"
        activo={facil}
        onCambio={cambiarFacil}
      />
      <FilaInterruptor
        titulo="Reducir movimiento"
        descripcion="También se activa con la preferencia de tu sistema"
        activo={reducido}
        onCambio={cambiarMovimiento}
      />
      <FilaInterruptor
        titulo="Versión ligera"
        descripcion="Sin imágenes ni gráficas, menos datos"
        activo={false}
        onCambio={() => nav.irA('W-15')}
      />
      <GrupoOpciones
        pregunta="Tamaño de texto"
        opciones={TAMANOS}
        seleccion={tamano}
        onElegir={setTamano}
      />
      <Texto rol="meta">
        Aquí nunca avanzamos solos: tú decides cuándo pasar a la siguiente pantalla.
      </Texto>
    </PlantillaHoja>
  );
}
