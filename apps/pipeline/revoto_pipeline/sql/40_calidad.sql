-- Reglas de calidad (RN-06, RN-09) y bitácora RI-09 / RF-24.

-- RN-09 · Edad fuera de 18–110: se excluye de todo cálculo.
UPDATE hecho_participacion SET excluido = TRUE
WHERE edad IS NULL OR edad NOT BETWEEN 18 AND 110;

-- RN-06 · Sexo fuera de catálogo: cuenta en los totales, pero no en el desglose por sexo.
UPDATE hecho_participacion SET sexo_valido = FALSE
WHERE codigo_sexo IS NULL OR codigo_sexo NOT IN (SELECT codigo FROM dim_sexo);

CREATE OR REPLACE TABLE registro_calidad AS
SELECT 'RN-09' AS regla, 'Edad fuera de 18–110: excluida del cálculo' AS descripcion,
       COUNT(*) AS registros, COALESCE(SUM(lista_nominal), 0) AS lista_nominal
FROM hecho_participacion WHERE excluido
UNION ALL
SELECT 'RN-06', 'Sexo fuera de catálogo: excluido solo del desglose por sexo',
       COUNT(*), COALESCE(SUM(lista_nominal), 0)
FROM hecho_participacion WHERE NOT sexo_valido AND NOT excluido;
