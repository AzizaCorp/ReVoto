-- L1 · Vista sobre el parquet consolidado. No transforma nada: es la entrada de todo el pipeline.
CREATE OR REPLACE VIEW stg_conteos AS
SELECT * FROM read_parquet('{{ruta_staging}}');
