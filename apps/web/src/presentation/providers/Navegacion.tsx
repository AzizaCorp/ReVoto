import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  anterior as anteriorDe,
  crearSecuencia,
  nombrePantalla,
  pantallaDesdeTexto,
  progreso as progresoDe,
  siguiente as siguienteDe,
  type IdPantalla,
  type Progreso,
  type Secuencia,
} from '@/domain';

/** Vistas fuera de la secuencia: versión ligera, datos abiertos y catálogo de estados. */
export type IdVistaAuxiliar = 'W-15' | 'W-16' | 'W-17';
export type IdVista = IdPantalla | IdVistaAuxiliar;
/** Hojas inferiores que se abren sobre cualquier pantalla. */
export type IdHoja = 'W-11' | 'W-12' | 'W-13';

const AUXILIARES: readonly IdVistaAuxiliar[] = ['W-15', 'W-16', 'W-17'];

export interface Navegacion {
  secuencia: Secuencia;
  actual: IdVista;
  /** Última pantalla de la historia visitada (la usa la versión ligera para continuar ahí). */
  ultimaPantalla: IdPantalla;
  progreso: Progreso | null;
  nombrePaso: string | null;
  hoja: IdHoja | null;
  /** Etiqueta del territorio elegido. Sin datos todavía: «[Entidad] · [Municipio]». */
  territorio: string;
  irA: (id: IdVista) => void;
  /** `null` en los extremos (HU-10: sin vuelta circular). */
  siguiente: (() => void) | null;
  anterior: (() => void) | null;
  abrirHoja: (hoja: IdHoja) => void;
  cerrarHoja: () => void;
  /** Abre W-02 desde el chip y recuerda a dónde regresar (HU-28). */
  cambiarTerritorio: () => void;
  /** Sale de W-02: regresa a la pantalla de origen o avanza si se llegó en orden. */
  confirmarTerritorio: () => void;
}

const Contexto = createContext<Navegacion | null>(null);

function vistaDesdeHash(hash: string): IdVista | null {
  const texto = hash.replace(/^#\/?/, '');
  const aux = AUXILIARES.find((a) => a === texto.toUpperCase());
  return aux ?? pantallaDesdeTexto(texto);
}

const esPantalla = (v: IdVista): v is IdPantalla => !AUXILIARES.includes(v as IdVistaAuxiliar);

/**
 * Motor de secuencia (US-09). La URL refleja la pantalla (`#/W-03`) para que el botón «atrás»
 * del navegador funcione y una pantalla pueda abrirse directo. Nunca avanza sola (HU-10).
 */
export function ProveedorNavegacion({
  children,
  secuencia: secuenciaInicial,
}: {
  children: ReactNode;
  secuencia?: Secuencia;
}) {
  const secuencia = useMemo(() => secuenciaInicial ?? crearSecuencia(), [secuenciaInicial]);
  const [actual, setActual] = useState<IdVista>(
    () => vistaDesdeHash(window.location.hash) ?? 'W-01',
  );
  const [ultimaPantalla, setUltima] = useState<IdPantalla>(esPantalla(actual) ? actual : 'W-01');
  const [hoja, setHoja] = useState<IdHoja | null>(null);
  const [regreso, setRegreso] = useState<IdPantalla | null>(null);

  const irA = useCallback((id: IdVista) => {
    setHoja(null);
    setActual(id);
    if (esPantalla(id)) setUltima(id);
  }, []);

  // URL ↔ estado
  useEffect(() => {
    const destino = `#/${actual}`;
    if (window.location.hash !== destino) window.location.hash = destino;
  }, [actual]);
  useEffect(() => {
    const alCambiar = () => {
      const v = vistaDesdeHash(window.location.hash);
      if (v) irA(v);
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, [irA]);

  const valor = useMemo<Navegacion>(() => {
    const enSecuencia = esPantalla(actual) && secuencia.pantallas.includes(actual);
    const sig = enSecuencia ? siguienteDe(secuencia, actual) : null;
    const ant = enSecuencia ? anteriorDe(secuencia, actual) : null;
    return {
      secuencia,
      actual,
      ultimaPantalla,
      progreso: enSecuencia ? progresoDe(secuencia, actual) : null,
      nombrePaso: esPantalla(actual) ? nombrePantalla(actual) : null,
      hoja,
      territorio: '[Entidad] · [Municipio]',
      irA,
      siguiente: sig ? () => irA(sig) : null,
      anterior: ant ? () => irA(ant) : null,
      abrirHoja: setHoja,
      cerrarHoja: () => setHoja(null),
      cambiarTerritorio: () => {
        if (esPantalla(actual) && actual !== 'W-02') setRegreso(actual);
        irA('W-02');
      },
      confirmarTerritorio: () => {
        const destino = regreso ?? siguienteDe(secuencia, 'W-02') ?? 'W-03';
        setRegreso(null);
        irA(destino);
      },
    };
  }, [secuencia, actual, ultimaPantalla, hoja, irA, regreso]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useNavegacion(): Navegacion {
  const n = useContext(Contexto);
  if (!n) throw new Error('useNavegacion debe usarse dentro de <ProveedorNavegacion>');
  return n;
}
