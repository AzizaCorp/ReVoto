-- L2 · Catálogos (SRS §8.3, RI-01 a RI-06).

-- RI-04 · Elecciones y su tipo (RN-03)
CREATE OR REPLACE TABLE dim_eleccion AS
SELECT * FROM (VALUES
    (2009, 'intermedia'), (2012, 'presidencial'), (2015, 'intermedia'),
    (2018, 'presidencial'), (2021, 'intermedia'), (2024, 'presidencial')
) t(id_eleccion, tipo);

-- RI-05 · Grupos de edad publicables (RN-04). La edad simple nunca se publica.
CREATE OR REPLACE TABLE dim_grupo_edad AS
SELECT * FROM (VALUES
    ('18-24', 18, 24), ('25-34', 25, 34), ('35-44', 35, 44), ('45-59', 45, 59), ('60+', 60, 110)
) t(grupo_edad, edad_min, edad_max);

-- RI-06 · Sexo. TODO(US-05/US-06): confirmar los códigos reales de la columna SEXO en la auditoría
-- de fuentes y ajustar los valores de `codigo`. Todo código fuera de esta tabla se trata con RN-06.
CREATE OR REPLACE TABLE dim_sexo AS
SELECT * FROM (VALUES ('H', 'H', 'Hombres'), ('M', 'M', 'Mujeres')) t(codigo, sexo, descripcion);

-- RI-01 / RI-02 / RI-03 · Entidades, municipios y secciones.
-- TODO(US-06): poblar nombres desde la fuente o desde el Marco Geoestadístico de INEGI.
CREATE OR REPLACE TABLE dim_entidad AS
SELECT DISTINCT TRY_CAST(EDOCVE AS TINYINT) AS cve_entidad, NULL::VARCHAR AS nombre
FROM stg_conteos;

CREATE OR REPLACE TABLE dim_municipio AS
SELECT DISTINCT TRY_CAST(EDOCVE AS TINYINT) AS cve_entidad,
       TRY_CAST(MPIOCVE AS SMALLINT) AS cve_municipio, NULL::VARCHAR AS nombre
FROM stg_conteos;
