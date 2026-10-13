import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** Preguntas de W-02b. Las respuestas viven solo en memoria: no se guardan ni se envían. */
export const PREGUNTAS = [
  {
    clave: 'edad',
    texto: '1. ¿En qué rango de edad estás?',
    opciones: ['18–24', '25–34', '35–44', '45–59', '60 +', 'Prefiero no decir'],
  },
  {
    clave: 'v2018',
    texto: '2. ¿Votaste en 2018? · presidencial',
    opciones: ['Sí', 'No', 'No podía', 'No recuerdo'],
  },
  {
    clave: 'v2021',
    texto: '3. ¿Votaste en 2021? · intermedia',
    opciones: ['Sí', 'No', 'No podía', 'No recuerdo'],
  },
  {
    clave: 'v2024',
    texto: '4. ¿Votaste en 2024? · presidencial',
    opciones: ['Sí', 'No', 'No podía', 'No recuerdo'],
  },
] as const;

export type ClavePregunta = (typeof PREGUNTAS)[number]['clave'];
export type Respuestas = Record<ClavePregunta, string | null>;

const VACIAS: Respuestas = { edad: null, v2018: null, v2021: null, v2024: null };

interface Perfil {
  respuestas: Respuestas;
  responder: (clave: ClavePregunta, valor: string) => void;
  /** Las tres preguntas de voto tienen respuesta: ya se puede asignar insignia. */
  completo: boolean;
}

const Contexto = createContext<Perfil | null>(null);

export function ProveedorPerfil({ children }: { children: ReactNode }) {
  const [respuestas, setRespuestas] = useState<Respuestas>(VACIAS);
  const valor = useMemo<Perfil>(
    () => ({
      respuestas,
      responder: (clave, v) => setRespuestas((r) => ({ ...r, [clave]: v })),
      completo: Boolean(respuestas.v2018 && respuestas.v2021 && respuestas.v2024),
    }),
    [respuestas],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePerfil(): Perfil {
  const p = useContext(Contexto);
  if (!p) throw new Error('usePerfil debe usarse dentro de <ProveedorPerfil>');
  return p;
}
