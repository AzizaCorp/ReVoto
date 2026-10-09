# Validación contra cifras oficiales (RF-23)

`cifras_oficiales.csv` contiene la participación oficial publicada por el INE, que el pipeline compara con la calculada.

| Columna | Tipo | Ejemplo |
| --- | --- | --- |
| `id_eleccion` | entero | `2024` |
| `nivel` | `nacional` o `entidad` | `entidad` |
| `cve_entidad` | entero, vacío en nacional | `14` |
| `participacion_pct` | porcentaje con 2 decimales | `61.20` |

Se llena en US-06 con la fuente citada en el diccionario de datos (US-07). Sin filas, la validación no compara nada: el reporte debe advertirlo.
