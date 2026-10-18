// Contrato de datos L4 · DIS-REVOTO-ARQUITECTURA-DESPLIEGUE §5.
// Fuente de verdad: los JSON Schema de ../schemas, que son los que publica apps/pipeline
// (export/exportar_ine_exploratorio.py + export/enriquecer.py). Estos tipos los reflejan.
// Son DTOs: la forma exacta de los JSON que lee apps/web/src/infrastructure. NO es el modelo de
// dominio: el adaptador los traduce. Un cambio incompatible es un BREAKING CHANGE y se refleja en
// schemas/*.schema.json en el mismo PR.

/** Años de elección federal cubiertos por el MVP. */
export type AnioEleccion = 2009 | 2012 | 2015 | 2018 | 2021 | 2024;

/** RN-03: deben distinguirse en toda comparación temporal. */
export type TipoEleccion = 'presidencial' | 'intermedia';

/** RN-04: únicos grupos de edad publicables. La edad simple nunca se publica. */
export type GrupoEdad = '18-24' | '25-34' | '35-44' | '45-59' | '60+';

/** Categorías válidas de sexo del catálogo (RN-06). */
export type Sexo = 'H' | 'M';

/** RN-02: la sección electoral nunca es un nivel publicado. */
export type NivelTerritorial = 'nacional' | 'entidad' | 'municipio';

/** Proporción entre 0 y 1 con 3 decimales. El formato de porcentaje lo aplica la UI. */
export type Proporcion = number;

/** Clave geoestadística INEGI de 5 dígitos (entidad + municipio). */
export type Cvegeo = string;

/** Qué tan segura es la equivalencia entre la clave INE y el municipio INEGI. */
export type EstadoResolucion =
  | 'equivalencia_verificada'
  | 'alias_historico_verificado'
  | 'candidato_inequivoco'
  | 'ambiguo'
  | 'sin_resolver';

/** Por qué una elección no trae tasa. `suppressed` = RN-05. */
export type EstadoTasa = 'available' | 'suppressed' | 'rate_undefined' | 'unavailable' | 'no_data';

export interface TerritorioDto {
  nivel: NivelTerritorial;
  /** Clave INE. Ausente en el nivel nacional. */
  cve?: number;
  cveEntidad?: number;
  nombre: string;
  /** Identidad estable del municipio dentro del pipeline (p. ej. `cvegeo:22001`). */
  id_operativo?: string;
  /** Presente solo si la equivalencia con INEGI está verificada. */
  cvegeo?: Cvegeo;
  /** Equivalencia inequívoca pero no verificada documentalmente. */
  cvegeo_candidato?: Cvegeo;
}

/** Elección con cifras publicadas. */
export interface CifrasPublicadasDto {
  anio: AnioEleccion;
  tipo: TipoEleccion;
  /** RN-01: SV / (LN − NS). */
  participacion: Proporcion;
  lista_nominal: number;
  por_edad: Partial<Record<GrupoEdad, Proporcion>>;
  por_sexo: Partial<Record<Sexo, Proporcion>>;
  suprimido?: false;
  estado_tasa?: EstadoTasa;
}

/** Elección sin tasa: suprimida por RN-05 o sin denominador. Nunca trae `participacion`. */
export interface CifrasNoPublicadasDto {
  anio: AnioEleccion;
  tipo: TipoEleccion;
  estado_tasa: EstadoTasa;
  suprimido?: boolean;
  /** Prohibida si `estado_tasa` es `suppressed`. */
  lista_nominal?: number;
}

/** Cifras de una elección para un territorio. */
export type CifrasEleccionDto = CifrasPublicadasDto | CifrasNoPublicadasDto;

/** Metadatos comunes a todo archivo: ninguna cifra sin territorio, periodo y fuente (RN-10). */
export interface ArchivoBaseDto {
  territorio: TerritorioDto;
  fuente: string;
}

export type EstadoPublicacion = 'exploratorio_no_aprobado' | 'diagnostico' | 'aprobado';

/** `manifest.json` de una versión. Sin `validacion` solo si es exploratorio y trae `reporte`. */
export interface ManifiestoDto {
  version_datos: string;
  generado: string;
  fuente: string;
  validacion?: { max_diferencia_pp: number; reporte: string };
  estado_publicacion?: EstadoPublicacion;
  entidades?: number;
  anios?: AnioEleccion[];
  umbral_rn05?: number;
  max_diferencia_pp?: number | null;
  /** Ruta relativa a la versión, normalmente `calidad.json`. */
  reporte?: string;
  /** Ruta relativa, normalmente `catalogos/entidades.json`. */
  catalogo_entidades?: string;
  /** Ruta relativa, normalmente `nacional.json`. */
  nacional?: string;
  particiones_faltantes?: [number, number][];
  limitaciones?: string[];
  topologia?: {
    /** `geo/entidades.topo.json`. */
    entidades?: string;
    /** Clave de entidad de 2 dígitos → `geo/<slug>.topo.json`. */
    por_entidad: Record<string, string>;
  };
}

export interface SerieNacionalDto extends ArchivoBaseDto {
  elecciones: CifrasEleccionDto[];
}

/** Elemento de `catalogos/entidades.json`. */
export interface EntidadDto {
  cve: number;
  nombre: string;
  /** Ruta relativa del archivo de la entidad: `entidad/<slug>.json`. */
  archivo?: string;
}

export interface ResumenMunicipioDto {
  cve: number;
  nombre: string;
  id_operativo?: string;
  /** Ruta relativa: `municipio/<slug-entidad>/<cvegeo>_<slug>.json`. */
  archivo?: string;
  cvegeo?: Cvegeo;
  cvegeo_candidato?: Cvegeo;
  identidad_verificada?: boolean;
  estado_resolucion?: EstadoResolucion;
  aliases_ine?: string[];
  /** RN-05: true si todas sus elecciones están suprimidas. */
  suprimido?: boolean;
  participacion?: Partial<Record<`${AnioEleccion}`, Proporcion>>;
}

/** W-09: arquetipo del municipio (k-medias, k = 5). */
export interface ArquetipoDto {
  id: 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
  nombre: string;
  nivel: number;
  efecto_presidencial: number;
  tendencia: number;
  volatilidad: number;
  tipicidad: Proporcion;
  rasgo: 'nivel' | 'efp' | 'tend' | 'vol';
}

/** Indicadores descriptivos de la entidad frente al país (sin clúster). */
export interface PerfilEstatalDto {
  metodologia: 'perfil_descriptivo_estatal_v1';
  nivel_pp: number;
  efecto_presidencial_pp: number;
  tendencia_pp_decada: number;
  volatilidad_pp: number;
  anios: AnioEleccion[];
  referencia: 'participacion_nacional_desde_conteos';
}

export interface DatosEntidadDto extends ArchivoBaseDto {
  elecciones: CifrasEleccionDto[];
  municipios: ResumenMunicipioDto[];
  /** W-09b: elecciones con voto esperado de 3 (2018, 2021, 2024) por grupo de edad. */
  votos_esperados_por_edad?: Record<GrupoEdad, number>;
  arquetipo?: ArquetipoDto;
  perfil_estatal?: PerfilEstatalDto;
}

export interface DatosMunicipioDto extends ArchivoBaseDto {
  /** RN-05: si es true, ninguna elección trae `participacion` y la UI muestra la entidad. */
  suprimido: boolean;
  identidad_verificada?: boolean;
  estado_resolucion?: EstadoResolucion;
  aliases_ine?: string[];
  /** Presente cuando la identidad no está verificada. */
  advertencia?: string;
  elecciones: CifrasEleccionDto[];
  /** `id_operativo` de los municipios colindantes de la misma entidad (W-04). */
  vecinos?: string[];
  arquetipo?: ArquetipoDto;
}

/** `calidad.json`: reporte de la versión (W-20, RF-24). Solo se tipan los campos que lee la app. */
export interface CalidadDto {
  modalidad: string;
  cobertura: Record<string, unknown>;
  oficial: { estado?: string; max_diferencia_pp?: number | null; [k: string]: unknown };
  geometria: Record<string, unknown>;
  integridad: Record<string, unknown>;
  advertencias?: string[];
  [k: string]: unknown;
}
