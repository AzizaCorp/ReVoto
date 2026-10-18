-- Ejecutar después de `python -m revoto_pipeline catalog`
-- Desde DuckDB con ATTACH 'data/revoto.duckdb' AS revoto;
-- Se suman conteos originales, NO promedios de tasas.
SELECT AELEC, EDOCVE,
       SUM(LN) AS lista_nominal,
       SUM(SV) AS marcas_de_voto,
       CASE WHEN SUM(LN) > 0 THEN 100.0 * SUM(SV) / SUM(LN) END
           AS participacion_pct
FROM revoto.ine_conteos
WHERE EDOCVE = 1
GROUP BY AELEC, EDOCVE
ORDER BY AELEC;
