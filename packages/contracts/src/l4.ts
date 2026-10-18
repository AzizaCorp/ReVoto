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
}

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
  validacion: { max_diferencia_pp: number; reporte: string };
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
  /** RN-05: true si la lista nominal no alcanza el umbral; entonces no trae cifras. */
  suprimido?: boolean;
  participacion?: Partial<Record<AnioEleccion, Proporcion>>;
}

export interface DatosEntidadDto extends ArchivoBaseDto {
  elecciones: CifrasEleccionDto[];
  municipios: ResumenMunicipioDto[];
}

export interface DatosMunicipioDto extends ArchivoBaseDto {
  /** RN-05: si es true, la UI muestra la entidad con la nota de CU-02 A2. */
  suprimido: boolean;
  elecciones: CifrasEleccionDto[];
}
