-- L3 · mart_participacion (RI-08). Niveles nacional, entidad y municipio (RN-02) con sus cortes.
-- Convención: grupo_edad / sexo en NULL = "todas las edades" / "ambos sexos".
CREATE OR REPLACE TABLE mart_participacion AS
SELECT
    h.id_eleccion,
    e.tipo,
    CASE WHEN GROUPING(h.cve_entidad) = 1 THEN 'nacional'
         WHEN GROUPING(h.cve_municipio) = 1 THEN 'entidad'
         ELSE 'municipio' END                                   AS nivel,
    h.cve_entidad,
    h.cve_municipio,
    g.grupo_edad,
    s.sexo,
    SUM(h.lista_nominal)                                        AS lista_nominal,
    SUM(h.voto_si)                                              AS voto_si,
    SUM(h.sin_dato)                                             AS sin_dato,
    SUM(h.voto_si) / NULLIF(SUM(h.lista_nominal) - SUM(h.sin_dato), 0) AS participacion, -- RN-01
    FALSE                                                       AS suprimido               -- 60_umbral
FROM hecho_participacion h
JOIN dim_eleccion e USING (id_eleccion)
JOIN dim_grupo_edad g ON h.edad BETWEEN g.edad_min AND g.edad_max   -- RN-04
LEFT JOIN dim_sexo s ON h.sexo_valido AND s.codigo = h.codigo_sexo  -- RN-06
WHERE NOT h.excluido                                                -- RN-09
GROUP BY GROUPING SETS (
    (h.id_eleccion, e.tipo),
    (h.id_eleccion, e.tipo, g.grupo_edad),
    (h.id_eleccion, e.tipo, s.sexo),
    (h.id_eleccion, e.tipo, h.cve_entidad),
    (h.id_eleccion, e.tipo, h.cve_entidad, g.grupo_edad),
    (h.id_eleccion, e.tipo, h.cve_entidad, s.sexo),
    (h.id_eleccion, e.tipo, h.cve_entidad, h.cve_municipio),
    (h.id_eleccion, e.tipo, h.cve_entidad, h.cve_municipio, g.grupo_edad),
    (h.id_eleccion, e.tipo, h.cve_entidad, h.cve_municipio, s.sexo)
)
-- RN-06: en los cortes por sexo se descarta el grupo de registros con sexo fuera de catálogo.
HAVING NOT (GROUPING(s.sexo) = 0 AND s.sexo IS NULL);
