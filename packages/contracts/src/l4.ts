// Contrato de datos L4 · DIS-REVOTO-ARQUITECTURA-DESPLIEGUE §5.
// Son DTOs: la forma exacta de los JSON que escribe apps/pipeline y que lee
// apps/web/src/infrastructure. NO es el modelo de dominio: el adaptador los traduce.
// Un cambio incompatible es un BREAKING CHANGE y se refleja en schemas/*.schema.json en el mismo PR.

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

export interface TerritorioDto {
  nivel: NivelTerritorial;
  /** Clave INE. Ausente en el nivel nacional. */
  cve?: number;
  cveEntidad?: number;
  nombre: string;
  /** Solo en municipios: nombre de su entidad. */
  nombreEntidad?: string;
}

/** Clave geoestadística INEGI del municipio (5 dígitos). No coincide siempre con la clave INE. */
export type Cvegeo = string;

/** Cifras de una elección para un territorio. */
export interface CifrasEleccionDto {
  anio: AnioEleccion;
  tipo: TipoEleccion;
  /** RN-01: SV / (LN − NS). */
  participacion: Proporcion;
  lista_nominal: number;
  por_edad: Partial<Record<GrupoEdad, Proporcion>>;
  por_sexo: Partial<Record<Sexo, Proporcion>>;
}

/** Metadatos comunes a todo archivo: ninguna cifra sin territorio, periodo y fuente (RN-10). */
export interface ArchivoBaseDto {
  territorio: TerritorioDto;
  fuente: string;
}

export interface ManifiestoDto {
  version_datos: string;
  generado: string;
  fuente: string;
  /** `max_diferencia_pp` es null mientras no haya cifras oficiales para comparar (RF-23). */
  validacion: { max_diferencia_pp: number | null; reporte: string };
}

export interface SerieNacionalDto extends ArchivoBaseDto {
  elecciones: CifrasEleccionDto[];
}

export interface EntidadDto {
  cve: number;
  nombre: string;
}

export interface ResumenMunicipioDto {
  cve: number;
  nombre: string;
  cvegeo?: Cvegeo;
  /** RN-05: true si la lista nominal no alcanza el umbral; entonces no trae cifras. */
  suprimido?: boolean;
  participacion?: Partial<Record<AnioEleccion, Proporcion>>;
}

export interface DatosEntidadDto extends ArchivoBaseDto {
  elecciones: CifrasEleccionDto[];
  /** W-09b: elecciones con voto esperadas (de 3: 2018, 2021 y 2024) por grupo de edad. */
  votos_esperados_por_edad?: Partial<Record<GrupoEdad, number>>;
  municipios: ResumenMunicipioDto[];
}

/** W-09: arquetipo municipal (k-medias, k = 5). Ausente con menos de 5 elecciones. */
export interface ArquetipoDto {
  id: 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
  nombre: string;
  /** Puntos contra el nacional. */
  nivel: number;
  efecto_presidencial: number;
  /** Puntos por década. */
  tendencia: number;
  volatilidad: number;
  /** 1 = centro del grupo. */
  tipicidad: number;
  rasgo: 'nivel' | 'efp' | 'tend' | 'vol';
}

export interface DatosMunicipioDto extends ArchivoBaseDto {
  /** RN-05: si es true, la UI muestra la entidad con la nota de CU-02 A2. */
  suprimido: boolean;
  elecciones: CifrasEleccionDto[];
  cvegeo?: Cvegeo;
  /** W-04: claves INE de los municipios colindantes de la misma entidad. */
  vecinos?: number[];
  arquetipo?: ArquetipoDto;
}

/** W-20: reporte de calidad de la versión de datos (`<version>/calidad.json`). */
export interface CalidadDto {
  fuente: string;
  origen: string;
  reglas: {
    id: string;
    descripcion: string;
    resultado: 'aprobada' | 'fallida' | 'pendiente';
    detalle: string;
  }[];
}

/**
 * TopoJSON proyectado (Lambert conforme cónica para México, metros): geo/entidades.topo.json,
 * geo/<cve>.topo.json y geo/municipios.topo.json. Un solo objeto; arcos cuantizados y delta-codificados.
 */
export interface TopologiaDto {
  type: 'Topology';
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: Record<
    string,
    {
      type: 'GeometryCollection';
      geometries: {
        type: 'Polygon' | 'MultiPolygon' | null;
        arcs?: number[][] | number[][][];
        properties: { cvegeo?: string; cve?: number; nombre?: string };
      }[];
    }
  >;
}

/** W-03: cvegeo → [nombre, entidad, participación por año en el orden de `anios`]. */
export interface MapaParticipacionDto {
  fuente: string;
  anios: AnioEleccion[];
  municipios: Record<Cvegeo, [string, number, (Proporcion | null)[]]>;
}
