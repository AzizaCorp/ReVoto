-- L2 · Tabla de hechos RI-07 (SRS §8.4). Grano: elección × sección × sexo × edad simple.
-- TRY_CAST convierte sin abortar; los valores inválidos quedan en NULL y los marca 40_calidad.sql.
CREATE OR REPLACE TABLE hecho_participacion AS
SELECT
    TRY_CAST(AELEC   AS SMALLINT) AS id_eleccion,
    TRY_CAST(EDOCVE  AS TINYINT)  AS cve_entidad,
    TRY_CAST(MPIOCVE AS SMALLINT) AS cve_municipio,
    TRY_CAST(SECCION AS SMALLINT) AS cve_seccion,
    UPPER(TRIM(SEXO))             AS codigo_sexo,
    TRY_CAST(EDAD    AS SMALLINT) AS edad,
    TRY_CAST(LN      AS INTEGER)  AS lista_nominal,
    TRY_CAST(SV      AS INTEGER)  AS voto_si,
    TRY_CAST(NV      AS INTEGER)  AS voto_no,
    TRY_CAST(NS      AS INTEGER)  AS sin_dato,
    source_file                   AS archivo_origen,
    FALSE                         AS excluido,     -- RN-09
    TRUE                          AS sexo_valido   -- RN-06
FROM stg_conteos;
