-- Run after analytics.hecho_participacion is bound to the canonical Parquet view.
CREATE OR REPLACE TABLE analytics.dim_eleccion AS
 SELECT AELEC::INTEGER AS id_eleccion, MIN(FELECCION) AS fecha,
        'participacion_censal_ine'::VARCHAR AS tipo,
        CASE WHEN AELEC IN (2012,2018,2024) THEN 'presidencial'
             WHEN AELEC IN (2009,2015,2021) THEN 'intermedia'
             ELSE 'no_clasificada' END::VARCHAR AS tipo_eleccion
 FROM analytics.hecho_participacion GROUP BY AELEC;
CREATE OR REPLACE TABLE analytics.dim_entidad AS
 SELECT EDOCVE::INTEGER AS cve_entidad, MIN(EDONOM) AS nombre
 FROM analytics.hecho_participacion GROUP BY EDOCVE;
CREATE OR REPLACE TABLE analytics.dim_municipio AS
 SELECT AELEC::INTEGER AS id_eleccion, EDOCVE::INTEGER AS cve_entidad,
        MPIOCVE::INTEGER AS cve_municipio, MIN(MPIONOM) AS nombre
 FROM analytics.hecho_participacion GROUP BY AELEC,EDOCVE,MPIOCVE;
CREATE OR REPLACE TABLE analytics.dim_seccion AS
 SELECT AELEC::INTEGER AS id_eleccion, EDOCVE::INTEGER AS cve_entidad,
        MPIOCVE::INTEGER AS cve_municipio,SECCION::INTEGER AS cve_seccion,
        MIN(TIPOSEC) AS tipo_seccion
 FROM analytics.hecho_participacion
 GROUP BY AELEC,EDOCVE,MPIOCVE,SECCION;
CREATE OR REPLACE TABLE analytics.dim_sexo AS
 SELECT SEXO::TINYINT AS cve_sexo,
        CASE SEXO WHEN 0 THEN 'Hombres' WHEN 1 THEN 'Mujeres'
             ELSE 'No identificado / otro código de fuente' END AS nombre
 FROM analytics.hecho_participacion WHERE SEXO IS NOT NULL GROUP BY SEXO;
CREATE OR REPLACE TABLE analytics.dim_grupo_edad AS
 SELECT * FROM (VALUES ('18-24',18,24),('25-34',25,34),('35-44',35,44),
  ('45-59',45,59),('60+',60,110),('no_especificada',NULL::INTEGER,NULL::INTEGER)) t(grupo_edad,edad_min,edad_max);
-- No physical FK to external Parquet facts: use logical constraints + quality checks.
