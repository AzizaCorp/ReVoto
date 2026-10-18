"""Punto de entrada único (RNF-16): `python -m revoto_pipeline` desde apps/pipeline.

Ejecuta los SQL de pipeline/sql en orden, valida contra cifras oficiales (RF-23) y,
solo si todo pasa, exporta el contrato L4 y verifica su peso. Termina con código 1 ante
cualquier falla, sin tocar apps/web/public/data.
"""

from revoto_pipeline.ejecutar import main

if __name__ == "__main__":
    main()
