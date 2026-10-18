# Pipeline de datos

Ver `AGENTS.md` en esta carpeta para el flujo, las reglas y los comandos, y `docs/diseno/DIS-REVOTO-ARQUITECTURA-DESPLIEGUE-v0.3.md` §4 para el diseño completo.

## Antes de la primera corrida

1. Descarga `conteos_censales_master.parquet` del bucket de fuentes a `data/staging/` en la raíz del repo (la carpeta `data/` no se versiona).
2. Define `reglas.umbral_rn05` en `config.toml` con el valor de RN-05 del SRS.
3. Llena `revoto_pipeline/validacion/cifras_oficiales.csv` con las cifras oficiales publicadas (ver `revoto_pipeline/validacion/README.md`).
