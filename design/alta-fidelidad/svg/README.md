# SVG · Alta fidelidad ReVoto

Recursos vectoriales usados en el prototipo de alta fidelidad (canvas «ReVoto · Alta fidelidad»).

| Carpeta | Archivo | Uso |
|---|---|---|
| `logos/` | `revoto-horizontal-claro.svg` | Encabezado de pantallas claras (isotipo + palabra). **Propuesta**: aún no está en el manual de marca. |
| `logos/` | `revoto-horizontal-oscuro.svg` | Encabezado de la portada oscura (W-01). |
| `ilustracion/` | `rv-urna.svg` | Urna con boleta marcada (W-01, W-09). |
| `mapas/` | `mx-municipios-ejemplo.svg` | Coroplético municipal nacional (W-03). |
| `mapas/` | `mx-entidades-ejemplo.svg` | Coroplético por entidad. |
| `mapas/` | `mx-entidades-vacio.svg` | Mapa por entidad sin datos (estado de carga / sin dataset). |
| `mapas/` | `jalisco-municipios-ejemplo.svg` | Detalle municipal de ejemplo (W-04). |
| `mapas/` | `build_mapas.py` | Script que regenera los mapas. |

## Mapas

- Geometría: Marco Geoestadístico INEGI (`conjunto_de_datos/00ent`, `00mun`), proyección LCC ITRF2008, simplificada.
- **Los colores son de ejemplo** (ruido con semilla fija), no representan participación real. Al conectar el CSV final, el color de cada municipio debe salir del dataset, clasificado en 7 pasos de la paleta:
  `#fde3f0 #f9bcdb #f08cc0 #e05aa6 #b8358f #86297f #5d1b6d`.
- Peso: el mapa municipal pesa ~320 KB; en producción conviene TopoJSON + carga diferida para respetar RNF-01 (≤ 500 KB de carga inicial) y no incluirlo en la versión ligera.
