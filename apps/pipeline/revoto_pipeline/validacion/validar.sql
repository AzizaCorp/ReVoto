-- RF-23 · Indicadores cuya diferencia contra la cifra oficial supera el máximo permitido.
-- Si regresa filas, el pipeline termina con error y no exporta.
SELECT m.id_eleccion, m.nivel, m.cve_entidad,
       ROUND(m.participacion * 100, 2)                              AS calculada,
       o.participacion_pct                                          AS oficial,
       ROUND(ABS(m.participacion * 100 - o.participacion_pct), 2)   AS diferencia_pp
FROM mart_participacion m
JOIN read_csv('{{ruta_oficiales}}', header = true) o
  ON o.id_eleccion = m.id_eleccion AND o.nivel = m.nivel
 AND o.cve_entidad IS NOT DISTINCT FROM m.cve_entidad
WHERE m.grupo_edad IS NULL AND m.sexo IS NULL AND m.cve_municipio IS NULL
  AND ABS(m.participacion * 100 - o.participacion_pct) > {{max_pp}}
ORDER BY diferencia_pp DESC;
