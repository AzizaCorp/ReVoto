-- RN-05 / RF-22 · Un agregado municipal bajo el umbral no se publica: la UI muestra la entidad
-- con la nota de CU-02 A2. El valor viene de pipeline/config.toml, nunca se escribe aquí.
UPDATE mart_participacion
SET suprimido = TRUE, participacion = NULL, voto_si = NULL, sin_dato = NULL
WHERE nivel = 'municipio' AND lista_nominal < {{umbral_rn05}};
