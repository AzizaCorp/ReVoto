# Pipeline de Datos

Pipeline local para INE, INEGI, CONAPO y geografía electoral del proyecto **ReVoto**.

Ver `AGENTS.md` en esta carpeta para el flujo, las reglas y los comandos, y `docs/diseno/DIS-REVOTO-ARQUITECTURA-DESPLIEGUE-v0.3.md` §4 para el diseño completo.

## ⚙️ ¿Qué hace el pipeline?

- **INE**: CSV → Parquet particionado (`edo`, `anio`) → indicadores municipales ponderados (sin eliminar DEF/DEL vacíos).
- **INEGI**: ITER 2010/2020 → Parquet; supresiones `*` como NULL con banderas, no como ceros.
- **CONAPO**: tabla anual municipal por sexo. La población proyectada **no es lista nominal**.
- **`build-full-context`**: un registro por municipio-año-electoral; mezcla únicamente cifras oficiales y referencias municipales **validadas**.
- **`build-geo-layers`**: lee `00ent.shp`, `00mun.shp`, `00l.shp` y opcionalmente `00lpr.shp`; crea el índice municipal y GeoJSON reducido para mapa por entidad.
- **`build-crosswalk`**: ITER localidad → sección 2021/2023 → distrito local 2021/2023. Usa polígono de localidad **solo si está completamente dentro** de una sección; en otro caso usa punto representativo del ITER o `00lpr`. Si el punto cae en dos secciones, devuelve `ambiguo` y ninguna asignación. Para sección → distrito requiere contención geográfica completa. **No reasigna votos históricos.**
- **`export-web --integrado`**: publica INE + CONAPO + INEGI a nivel municipio. El GeoJSON por municipio se une en frontend con `cvegeo_municipal_mapa` (5 dígitos).

---

## 📖 Glosario

| Sigla | Significado |
|-------|-------------|
| **LN** | Lista Nominal |
| **SV** | Sufragios Válidos |
| **NV** | Votos Nulos |
| **NS** | No Sufragaron |
| **DEF / DEL** | Votos por partido definido / delegado (según esquema INE) |
| **ITER** | Inventario Nacional de Viviendas (INEGI) |
| **Marco Geoestadístico** | Capas oficiales del INEGI (`00ent`, `00mun`, `00l`, `00lpr`) |
| **SHP** | Shapefile (`.shp` + `.dbf` + `.shx` + `.prj`) |
| **CVEGEO** | Clave geoestadística del INEGI |

---

## 🗂️ Rutas del repositorio

```text
ReVoto/
├── apps/pipeline/                         # código y config.toml
├── apps/web/public/data/                  # JSON/GeoJSON generados
└── data/
    ├── mappings/
    │   ├── conapo_ine.csv                 # COMPLETAR con claves validadas
    │   └── inegi_ine.csv                  # COMPLETAR con claves validadas
    └── raw/
        ├── conapo/pobproy_ggrupos.csv
        ├── conteos_censales/{2009,2012,2015,2018,2021,2024}/*.csv
        ├── inegi/2010/ITER_NALCSV10.csv
        ├── inegi/2020/ITER_NALCSV20.csv
        └── geografia/
            ├── inegi/00ent.shp
            ├── inegi/00mun.shp
            ├── inegi/00l.shp
            ├── inegi/00lpr.shp          # opcional
            ├── secciones/2021/**/*.shp
            ├── secciones/2023/**/*.shp
            ├── distritos-locales/2021/**/*.shp
            └── distritos-locales/2023/**/*.shp
```

Cada SHP debe ir acompañado de sus archivos `.dbf`, `.shx` y `.prj`.

Configura `inegi_marco_anio = 2010` o `2020` **solo tras verificar la edición real de tus SHPs INEGI**. Con el valor predeterminado `0` (sin confirmar), se leen y publican `00ent`/`00mun`, pero el crosswalk no aplica polígonos `00l` ni puntos `00lpr` como equivalentes a un censo.

Las carpetas electorales aceptan un solo `.shp` para la entidad o capa. Si hay varios, configurá los nombres precisos con `secciones_archivo` y `distritos_locales_archivo` en `config.toml`. Los nombres admiten patrones como `"{edo02}.shp"` para archivos estatales. Por defecto no se asumen; configuralos explícitamente si hay ambigüedad.

---

## 📥 Fuentes de Datos

Los archivos en `data/` **no se versionan** por tamaño y licencias. Descargar según la tabla:

| Carpeta destino | Contenido | Fuente | Notas |
|-----------------|-----------|--------|-------|
| `data/raw/conteos_censales/{año}/*.csv` | Conteos INE | [INE](https://portal.ine.mx/transparencia/datos-abiertos/visualizacion-datos/conteos-censales-participacion/) | Un CSV por estado contenido en una carpeta por su elección |
| `data/raw/inegi/2010/ITER_NALCSV10.csv` | ITER 2010 | [INEGI](https://www.inegi.org.mx/programas/ccpv/2010/#microdatos) | Codificación `utf-8-sig` |
| `data/raw/inegi/2020/ITER_NALCSV20.csv` | ITER 2020 | [INEGI](https://www.inegi.org.mx/programas/ccpv/2020/#microdatos) | Ídem |
| `data/raw/conapo/pobproy_ggrupos.csv` | Proyecciones CONAPO | [CONAPO](https://www.datos.gob.mx/dataset/proyecciones-de-poblacion) | CSV RFC 4180 |
| `data/raw/geografia/inegi/*.shp` + `.dbf/.shx/.prj` | Marco Geoestadístico | [INEGI](https://www.inegi.org.mx/app/biblioteca/ficha.html?upc=794551163061) | Verificar `inegi_marco_anio` |
| `data/raw/geografia/secciones/{2021,2023}/*.shp` | Cartografía seccional | [INE](https://pautas.ine.mx/transparencia/mapas/index.html) | Estatales |
| `data/raw/geografia/distritos-locales/{2021,2023}/*.shp` | Cartografía distrital | [INE](https://pautas.ine.mx/transparencia/mapas/index.html) | Estatales |

---

## 🛠️ Setup (una sola vez)

```powershell
# 1. Entorno virtual (desde ReVoto/apps/pipeline)
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

# Alternativa si no tenés py launcher:
# python -m venv .venv

# 2. Verificar instalación — deben pasar 21 tests
python -m pytest -q
```

Después:

3. **Descargar las fuentes** según la tabla de §Fuentes de datos.
4. **Editar `config.toml`**:
   - `reglas.umbral_rn05` con el valor de RN-05 del SRS.
   - `inegi_marco_anio` (solo tras verificar la edición del Marco Geoestadístico).
   - `secciones_archivo` y `distritos_locales_archivo` si hay ambigüedad de SHPs.
5. **Completar** `revoto_pipeline/validacion/cifras_oficiales.csv` (ver `revoto_pipeline/validacion/README.md`).
6. **Validar los mappings municipales**:

   ```powershell
   python -m revoto_pipeline generate-mappings
   # revisar data/mappings/revision_mappings.csv
   # editar data/mappings/conapo_ine.csv y data/mappings/inegi_ine.csv
   # cambiar status_match a 'validado' solo en filas verificadas manualmente
   ```

   > **Sin al menos una fila con `status_match='validado'`, `build-full-context` falla.**

---

## Selección temporal

| Elección | Censo ITER | Cartografía de referencia (sección / distrito local) |
|---:|---:|---:|
| 2009 | 2010 | 2021 |
| 2012 | 2010 | 2021 |
| 2015 | 2010 | 2021 |
| 2018 | 2020 | 2021 |
| 2021 | 2020 | 2021 |
| 2024 | 2020 | 2023 |

La **geografía de referencia** no representa necesariamente la división administrativa o electoral original de la elección. **Nunca** transformar ni sumar votos por distrito de referencia sin un crosswalk histórico válido entre secciones para la fecha correspondiente. Las salidas `localidad_seccion_distrito.parquet` no contienen `LN`, `SV`, `NV` ni `NS`.

---

## Ejecución incremental (estado 01)

```powershell
# 1. INE
python -m revoto_pipeline ingest-ine --estado 01
python -m revoto_pipeline aggregate-ine --estado 01
python -m revoto_pipeline validate --estado 01

# 2. Fuentes externas
python -m revoto_pipeline build-inegi --censo 2010
python -m revoto_pipeline build-inegi --censo 2020
python -m revoto_pipeline build-conapo

# 3. Geografía INEGI
python -m revoto_pipeline build-geo-layers --estado 01

# 4. Crosswalk geográfico (por año electoral)
python -m revoto_pipeline build-crosswalk --estado 01 --anio 2009
python -m revoto_pipeline build-crosswalk --estado 01 --anio 2024

# 5. Contexto integrado (requiere mappings validados)
python -m revoto_pipeline build-full-context --estado 01

# 6. Exportación al frontend
python -m revoto_pipeline export-web --estado 01 --integrado
```

### Orquestación completa

```powershell
# Solo cuando fuentes, mappings y cifras oficiales estén listos
python -m revoto_pipeline run-integrated --estado 01
```

**No corras `--all` hasta haber verificado el estado 01 end-to-end.** El pipeline procesa 32 estados × 6 elecciones; un error de validación de mappings es silencioso hasta `build-full-context`, donde los conteos por estado lo delatan. Validar en un estado primero reduce el tiempo de iteración de horas a minutos.

```powershell
# Mucho después, con el estado 01 verificado:
python -m revoto_pipeline run-integrated --all
```

---

## Ejemplo mínimo: de cero a JSON para Aguascalientes

```powershell
# Setup
python -m revoto_pipeline ingest-ine --estado 01
python -m revoto_pipeline aggregate-ine --estado 01
python -m revoto_pipeline validate --estado 01

# Fuentes externas
python -m revoto_pipeline build-inegi --censo 2010
python -m revoto_pipeline build-inegi --censo 2020
python -m revoto_pipeline build-conapo

# Geografía
python -m revoto_pipeline build-geo-layers --estado 01

# Mappings (una vez por estado)
python -m revoto_pipeline generate-mappings
# editar data/mappings/*.csv y marcar filas como 'validado'

# Contexto y exportación
python -m revoto_pipeline build-full-context --estado 01
python -m revoto_pipeline export-web --estado 01 --integrado

# Resultado:
# apps/web/public/data/integrado/edo=01/anio=2024/municipios.json
```

---

## Outputs

```text
data/staging/geo/inegi/edo=01/municipios_index.parquet

data/staging/geo/crosswalk/edo=01/anio_eleccion=2024/localidad_seccion_distrito.parquet

data/processed/full_context/edo=01/anio=2024/municipios.parquet

apps/web/public/data/ine/edo=01/anio=2024/municipios.json
apps/web/public/data/integrado/edo=01/anio=2024/municipios.json
apps/web/public/data/geometria/edo=01/entidades.geojson
apps/web/public/data/geometria/edo=01/municipios.geojson
```

`cvegeo_municipal_inegi` (9 dígitos: entidad + municipio + localidad=0000) procede del ITER. `cvegeo_municipal_mapa` (5 dígitos) enlaza el municipio del mapa `00mun`. El cruce municipal usa correspondencias acreditadas, no nombre ni proximidad espacial.

### Reportes de auditoría

Además de los parquet y JSON, el pipeline genera reportes JSON con conteos y estatus por etapa:

```text
apps/pipeline/reportes/
├── full_context/edo=01.json
├── geo/edo=01_censo=2020_eleccion=2024.json
├── inegi/censo=2010.json
├── inegi/censo=2020.json
└── ...
```

Estos reportes son la **auditoría del pipeline**: cuántas filas se procesaron, cuántas quedaron sin match, cuántas geometrías se repararon.

Para inspeccionar los flags de un año se usa `data/staging/geo/crosswalk/edo=01/anio_eleccion=2024/localidad_seccion_distrito.parquet`. Si un SHP tiene campos inesperados, la etapa falla indicando las columnas observadas: requiere ajustar un alias del módulo geoespacial en vez de elegir una columna incorrecta.

---

## Reglas metodológicas esenciales

1. `00l` es capa de **localidades amanzanadas**; no es una cobertura total de las localidades del ITER. `00lpr` puede contener puntos rurales; si no lo tenés, se continúa con las coordenadas del ITER. `00l` y `00lpr` solo se toman como fuente de asignación al comprobar la edición del Marco Geoestadístico en `inegi_marco_anio`.
2. El punto representativo de una localidad **no prueba** que toda su población esté en una sección. Las intersecciones marcadas como únicas son asignaciones geográficas de referencia, **no datos electorales por localidad**.
3. Puntos sobre bordes, polígonos que atraviesan secciones, geometrías inválidas y secciones no contenidas en un único distrito **no se fuerzan a correspondencias**.
4. El cotejo de años de cartografía se hace en `geo/temporal.py`; no se admite sobreescribir con otra versión mediante `--cartografia` de forma silenciosa.
5. CONAPO e INEGI se agregan por municipio desde totales municipales y categorías por sexo oficialmente observadas; **no se multiplican** indicadores por la distribución de mujeres/hombres del INE.
6. **No se ha confirmado el esquema interno de los SHPs originales ni se han corrido con los datos reales.** Los tests de geometría usan polígonos sintéticos.