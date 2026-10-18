# REVOTO · Pipeline local de datos (refactor US-06)

> **Estado:** entrega de refactor aplicada al commit `d7084a3b3df1706330bc3847b6a69e6a5e890886` mediante `tools/reconstruir_pipeline.py`. Este directorio dentro del ZIP contiene **todos los archivos modificados/nuevos**, no los 47 originales. Ejecuta el reconstruidor desde la raíz del ZIP para generar la carpeta completa `apps/pipeline/`. No cambia GitHub.

## 1. Propósito

Construir un catálogo analítico electoral reproducible, preservando la granularidad original del Conteo Censal de Participación Ciudadana (INE), sin imputar datos censales por sección ni mezclar proyecciones municipales CONAPO con observaciones seccionales. El procesamiento es local (Python, DuckDB, Parquet, Polars en módulos existentes, GeoPandas/Shapely para GIS).

## 2. Arquitectura

```text
INE CSV ───────────→ data/staging/ine/.../conteos.parquet
                         ├──→ data/processed/canonical/hecho_participacion/...
                         │         └──→ data/processed/marts/{municipio,seccion,sexo,...}/...
                         └──→ agregados municipales legacy (compatibilidad)
INEGI ITER CSV ────→ data/staging/inegi/censo=AAAA/iter.parquet
                                     ↘
cartografía INEGI/INE → crosswalk localidad→sección→distrito de referencia
                                     ↘
                            contexto_inegi por sección/distrito
CONAPO CSV ──────────→ data/staging/conapo/poblacion_anual.parquet
                         └──→ integración MUNICIPAL opcional
Parquet y crosswalks ──→ data/revoto.duckdb (dimensiones pequeñas + vistas)
Marts ────────────────→ JSON especializados por edo=XX/anio=AAAA
GeoJSON ──────────────→ capa espacial independiente existente
```

**Los números originales se conservan; los contextos son otras entidades semánticas.** `SV`, `LN`, `NV`, `NS` solo se agregan a partir de conteos. `DEF`/`DEL` son códigos candidatos de distritos: nunca se suman.

## 3. Estructura y responsabilidades

- `ingest/`: CSV → staging Parquet; se conservan los módulos existentes.
- `transform/`: selectores tipados, clasificación ITER, carga validada de mapping y alias antiguos.
- `geo/`: lectura y reparación de geometrías, crosswalk, control temporal; reutiliza módulos existentes.
- `model/canonical.py`: copia tipada fiel de cada observación INE, sin agrupar.
- `model/marts.py`: marts de participación por entidad, municipio, sección, sexo, edad, combinaciones; condicionalmente distrito `DEL` verificado.
- `model/contexto_inegi.py`: localidad ITER asignable → contexto territorial de referencia, cobertura y NULL por incertidumbre.
- `model/municipal_context.py`: integración opcional INEGI/CONAPO exclusivamente municipal.
- `model/indicators.py`: contratos de suma, razón y media ponderada.
- `model/database.py`: DuckDB persistente con dimensiones, vistas y agregación nacional real.
- `sql/70_modelo_dimensional.sql`: DDL dimensional activo. Los scripts SQL 10–60 se conservan solo en `docs/legacy_sql/` durante reconstrucción.
- `export/frontend.py`: read models JSON con controles RN-05, RN-02 y opt-in a contrato v2.
- `tests/`: pruebas previas y pruebas nuevas, sintéticas.
- `reportes/`: validaciones locales; datos reales no se versionan.

## 4. Fuentes

- INE CCPC: años 2009, 2012, 2015, 2018, 2021, 2024, por entidad y elecciones.
- INEGI ITER: 2010 y 2020, registros `localidad_regular` distintos de agregados municipales.
- CONAPO: proyecciones anuales municipales desglosadas por sexo.
- Marco geoestadístico INEGI y secciones/distritos locales DERFE (según disponibilidad y referencia).
- Mapping municipal aprobado manualmente: `data/mappings/inegi_ine.csv`, `data/mappings/conapo_ine.csv`.

## 5. Instalación

```bash
cd apps/pipeline
python -m venv .venv
# En Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
python -m pytest -q
```

El paquete apunta a Python 3.12+ (usa `tomllib`). Las rutas de `config.toml` son relativas a la **raíz del monorepo**, independientemente del directorio del proceso.

## 6. Ejecución paso a paso

El pipeline de REVOTO permite procesar una entidad federativa individual mediante `--estado XX` o las **32 entidades federativas** mediante `--all`.

Todos los comandos deben ejecutarse desde `apps/pipeline/`, con el entorno virtual activado y las dependencias instaladas.

### 6.1. Procesamiento del INE para todos los estados

Esta etapa transforma los CSV originales del INE en Parquet, construye la fuente canónica y genera los marts electorales conservando la granularidad disponible.

```bash
python -m revoto_pipeline ingest-ine --all
python -m revoto_pipeline aggregate-ine --all
python -m revoto_pipeline build-canonical --all
python -m revoto_pipeline build-marts --all
```

**Resultados principales:**
- Staging Parquet del INE por entidad y elección.
- Agregados municipales originales.
- Hechos canónicos con sección, sexo, edad y conteos electorales.
- Marts de participación por territorio y dimensiones demográficas.

Los porcentajes de participación se calculan a partir de conteos agregados, no mediante promedios de tasas.

### 6.2. Preparación de fuentes sociodemográficas (opcional)

INEGI y CONAPO pueden habilitarse independientemente mediante la configuración de integración.

```bash
# INEGI: censos de referencia
python -m revoto_pipeline build-inegi --censo 2010
python -m revoto_pipeline build-inegi --censo 2020

# CONAPO: proyecciones municipales anuales
python -m revoto_pipeline build-conapo

# Generación de propuestas de correspondencia territorial
python -m revoto_pipeline generate-mappings
```

Estos comandos se ejecutan una sola vez por fuente o censo, no por estado.

**Importante:** los mappings generados deben revisarse y validarse antes de utilizarse para integrar fuentes.

### 6.3. Construcción geoespacial de las 32 entidades

Primero se preparan las capas geográficas.

```bash
python -m revoto_pipeline build-geo-layers --all
```

Después se generan los crosswalks de localidad a sección y distrito local, especificando el año electoral.

Por ejemplo, para 2024:

```bash
python -m revoto_pipeline build-crosswalk --all --anio 2024
python -m revoto_pipeline build-inegi-secciones --all --anio 2024
```

El flag `--all` procesa las 32 entidades, pero **no implica automáticamente todos los años electorales**.

Para procesar todos los años configurados desde PowerShell:

```powershell
$years = @(2009, 2012, 2015, 2018, 2021, 2024)

foreach ($year in $years) {
    python -m revoto_pipeline build-crosswalk --all --anio $year
    python -m revoto_pipeline build-inegi-secciones --all --anio $year
}
```

Las asignaciones territoriales deben respetar la cartografía de referencia configurada. Un crosswalk retrospectivo no demuestra equivalencia histórica entre secciones o distritos.

Los resultados INEGI seccionales representan contexto territorial de referencia y deben conservar sus indicadores de cobertura, método y ambigüedad.

### 6.4. Construcción del contexto integrado

Una vez preparados los Parquet y mappings necesarios:

```bash
python -m revoto_pipeline build-full-context --all
```

Este comando construye el contexto municipal utilizando las fuentes habilitadas en `config.toml`.

CONAPO conserva su granularidad municipal y anual. INEGI conserva sus referencias censales. Ninguna de estas fuentes debe interpretarse como una medición individual de los electores.

### 6.5. Construcción de la base analítica DuckDB

Después de generar los datasets que se desee incorporar al catálogo:

```bash
python -m revoto_pipeline build-db
```

**Este comando se ejecuta una sola vez**, porque construye o actualiza el catálogo analítico persistente de los Parquet disponibles.

El comando histórico `catalog` continúa funcionando como alias:

```bash
python -m revoto_pipeline catalog
```

La base resultante se ubica en la ruta configurada, normalmente `data/revoto.duckdb`.

### 6.6. Validación

Para verificar los datos electorales de las 32 entidades:

```bash
python -m revoto_pipeline validate --all
```

Para ejecutar los tests automatizados:

```bash
python -m pytest -q
```

Se recomienda revisar los reportes de calidad y los indicadores de cobertura antes de publicar resultados.

### 6.7. Exportación para frontend

La publicación debe realizarse únicamente cuando estén aprobados el umbral RN-05, las reglas de privacidad y el contrato de datos correspondiente.

```bash
# Exportación INE
python -m revoto_pipeline export-web --all

# Exportación integrada
python -m revoto_pipeline export-web --all --integrado
```

La exportación integrada requiere tener disponibles los datasets de contexto necesarios.

Los outputs JSON deben conservar metadatos de fuente, año electoral, referencia territorial, disponibilidad y supresión cuando corresponda.

**Advertencia:** la publicación seccional y el contrato v2 requieren aprobación explícita debido a las restricciones vigentes del frontend y RN-02. Ejecutar `--all` no omite estos controles.

### 6.8. Ejecución para una sola entidad

Para desarrollo, debugging o pruebas controladas puede utilizarse `--estado`.

Ejemplo con Aguascalientes:

```bash
python -m revoto_pipeline ingest-ine --estado 01
python -m revoto_pipeline aggregate-ine --estado 01
python -m revoto_pipeline build-canonical --estado 01
python -m revoto_pipeline build-marts --estado 01
```

La construcción de DuckDB sigue siendo global y no requiere `--estado`.

### 6.9. Consideraciones operativas

- El procesamiento de las 32 entidades puede requerir tiempo y espacio considerable en disco.
- Se recomienda ejecutar primero una entidad para validar entradas, configuración y dependencias.
- La ingestión nacional requiere que todos los archivos originales esperados estén disponibles.
- Los crosswalks necesitan cartografía electoral y geográfica compatible.
- La asignación geoespacial ambigua no debe resolverse mediante imputaciones arbitrarias.
- Los valores suprimidos de INEGI no deben convertirse en cero.
- Las proyecciones de CONAPO no equivalen a la lista nominal electoral.
- El catálogo DuckDB puede reconstruirse después de actualizar los Parquet.
- Para ejecutar comandos individuales, los pasos de ingestión, transformación y validación deben respetar el orden de dependencias.

## 7. Outputs y granos

| Ruta/vista | Grano | Nota |
|---|---|---|
| `staging/ine/edo=XX/anio=AAAA/conteos.parquet` | grano fuente INE | 100% observaciones, anomalías reportadas |
| `canonical/hecho_participacion/edo=XX/anio=AAAA/hechos.parquet` | elección × entidad × municipio × sección × sexo × edad (*más filas si así vino la fuente*) | conserva `TIPOSEC`, `DEF`, `DEL`, `FELECCION` y conteos |
| `marts/municipio/.../datos.parquet` | entidad × municipio × elección | `SUM(SV)/SUM(LN)` |
| `marts/seccion/.../datos.parquet` | entidad × municipio × sección × elección | conservar aunque publicación RN-02 apagada |
| `marts/seccion_sexo`, `marts/seccion_edad` | grano anterior × desagregación | se agregan desde hechos, no descomposición estimada |
| `marts/distrito_local/...` | elección × entidad × `DEL` | solo con `del_distrito_verificado=true` |
| `inegi/secciones/.../contexto.parquet` | cartografía referencia × municipio × sección | localidad asignable + cobertura municipal |
| `inegi/distritos/.../contexto.parquet` | cartografía referencia × distrito local | **suma de localidades asignables, NO total distrital** |
| `full_context/edo=XX/anio=AAAA/municipios.parquet` | municipio × año | INE + opcionales INEGI/CONAPO |
| `data/revoto.duckdb` | catálogo vistas + dimensiones | lecturas externas a Parquet, no materializa hechos |
| `apps/web/public/data/{ine,integrado}/edo=XX/anio=AAAA/` | un JSON por read model | v2 requiere adopción por frontend |

## 8. DuckDB, modelo relacional y consultas

Las dimensiones `dim_eleccion`, `dim_entidad`, `dim_municipio`, `dim_seccion`, `dim_sexo`, `dim_grupo_edad` son tablas pequeñas. `revoto.hecho_participacion` es vista Parquet; `revoto.mart_participacion_nacional` agrega los estados presentes, incluye `entidades_disponibles` y **no publica tasa nacional** hasta que estén las 32 entidades. Los demás `mart_participacion_*`, `mart_contexto_*` y `bridge_*` son vistas externas opcionales. Las referencias FK sobre views externas son **lógicas**, no restricciones físicas del motor. Los Parquet no deben moverse sin reconstruir DB.

```sql
SELECT AELEC, SUM(SV)*1.0/NULLIF(SUM(LN),0) AS tasa
FROM revoto.hecho_participacion
GROUP BY AELEC ORDER BY AELEC;

SELECT cve_entidad,cve_municipio,nombre FROM revoto.dim_municipio
WHERE cve_entidad=1;

SELECT * FROM revoto.mart_participacion_nacional ORDER BY AELEC;
```

Ver claves naturales y relaciones completas en `ARQUITECTURA.md`.

## 9. Metodología INEGI → sección y distrito

Separa registros ITER regulares de totales (nacional, entidad, municipio). Se acepta **por defecto** únicamente `status_seccion='unico'` junto con `metodo_localidad='poligono_localidad_contenido'`. El punto representativo ITER no prueba que una localidad entera corresponda a una sección; puede autorizarse excepcionalmente con `permitir_localidades_por_punto=true`, **con incertidumbre documentada**. El crosswalk original solo usa el polígono local cuando su año coincide con el censo: si el SHP es 2024 y la población ITER es de 2020, los indicadores seccionales quedan sin asignaciones fuertes hasta aportar geometría compatible o aceptar una aproximación explícita.

Variables de conteo: SUM únicamente si ninguna localidad asignada tiene `NULL`/`*` en la variable. Porcentaje: razón de sumas. `GRAPROES`: media ponderada por población de 15+ **solo si el campo está disponible**, sujeto a verificar su definición con el diccionario oficial. Nunca asumir POBTOT como peso.

Cobertura: población asignada mediante localidad elegible / **POBTOT municipal en el censo** (no la suma de secciones), con flag si falta denominador; `cobertura_minima_inegi=0.80`. En secciones de municipio con cobertura insuficiente, los indicadores son NULL, pero cobertura, número de localidades y calidad permanecen disponibles. En distritos, al no existir denominador censal distrital fiable, las cifras son *subtotales de localidades asignadas*, no estimaciones de población distrital total.

**No** se asignan votos históricos a cartografía moderna usando esos crosswalks. Una sección de 2009 en referencia 2021 no es su sección histórica demostrada.

## 10. CONAPO

`incluir_conapo` e `incluir_inegi` funcionan por separado (combinaciones INE / +INEGI / +CONAPO / +ambas). CONAPO solo se une a municipio × **año electoral** mediante mapping validado y proyección anual; requiere exactamente un registro por sexo válido y año, no promedia ni duplica. No existe estimación CONAPO seccional. Si un join introduce fanout, aborta sin reemplazar el archivo final.

## 11. Temporalidad

2009–2021 → distritación de referencia 2021; 2024 → 2023. Las fechas censales se resuelven de `referencia_censal`. Los resultados contienen `referencia_retroactiva`; no debe entenderse `equivalencia_historica_verificada=true` sin crosswalk validado. `DEL` pertenece a la observación INE y solo puede convertirse a dimensión distrital cuando su semántica por elección sea oficialmente corroborada.

## 12. DEL y DEF

`[ine] incluir_del=false` impide publicar/crear marts territoriales asociados a `DEL`, **sin borrar DEL del staging y fact**. `del_distrito_verificado=false` mantiene apagados los marts distritales aunque `incluir_del=true`. `DEF` es identificador de distrito federal y sigue en canonical como evidencia; no recibe tratamiento de medida sumable.

## 13. RN-05, RN-02 y contratos de frontend: bloqueantes

**Incompatibilidad histórica existente detectada:** `packages/contracts/src/l4.ts` y `apps/web/src/domain/participacion/participacion.ts` definen participación como `SV/(LN-NS)`, mientras el requisito actual de esta refactorización pide `SV/LN`. También restringen `NivelTerritorial` a nacional/entidad/municipio (RN-02), no sección; definen grupos `18-24`, `25-34`, `35-44`, `45-59`, `60+`, y DTOs L4 diferentes a este JSON especializado **v2**.

Se prioriza en **este pipeline** la fórmula solicitada `SUM(SV)/SUM(LN)` y se conservan grupos etarios existentes. No se modifica `packages/contracts` ni la app web porque el alcance se centró en `apps/pipeline` y no se quiere hacer cambios remotos. Antes del despliegue, debe acordarse cuál regla RN-01 queda vigente y generar/migrar DTOs, validadores, adaptadores y pruebas frontend. Los JSON especializados tienen contrato `schema_version=2` y requieren `publicacion.permitir_contrato_v2=true`; esquema propio `revoto_pipeline/schemas/frontend_v2.schema.json`, validación ligera en `export/contract.py`.

`publicar_secciones=false`, `publicar_distritos=false`, `publicar_desgloses_territoriales=false` por defecto: evita violar el contrato RN-02 y posibles ataques por diferencia de cohortes. RN-05 se define en configuración, pero **un umbral de lista nominal no es garantía suficiente de privacidad para todos los cruces**, en especial sección × sexo × edad y contexto de localidades. Requiere revisión antes de activar. Valores suprimidos son `null`, nunca cero.

## 14. JSON y GeoJSON

Los read models contienen `schema_version`, `estado`, `anio_eleccion`, `grano`, `fuentes`, `referencias` y `medidas`, con `publication_status` para datos suprimidos. Ejemplo generado: `.../municipios.json`, `.../secciones.json` (solo con aprobación), `.../secciones-sexo.json` (también aprobación de desglose), `.../municipios-contexto.json`. Los contextos territoriales INEGI permanecen en archivos independientes con `no_reasignar_votos=true`. Los GeoJSON no se incrustan en JSON estadísticos para reducir peso.

## 15. Tests

`python -m pytest -q tests/test_refactor_unit.py tests/test_refactor_integration.py` + suite original. Hay pruebas metodológicas puras y pruebas DuckDB con dos filas sintéticas para conservación, ponderación, DB, cobertura, supresión y formatos. **No es equivalente a validación real** de todos los años/entidades: hace falta probar archivos reales con sus esquemas y cifras oficiales.

## 16. Troubleshooting

- `RN-05 POR_DEFINIR`: acordar umbral aprobado y documentar decisión.
- `Contrato v2 requiere opt-in`: actualizar contratos/adaptadores UI y activar `permitir_contrato_v2` tras aprobación.
- `build-crosswalk requiere --anio`: especificar elección, no solo cartografía.
- `Crosswalk con fanout`: revisar localidades duplicadas o mappings validados repetidos.
- Cobertura 0/NULL en INEGI 2020: no confundir cartografía INEGI 2024 con 2020; verificar correspondencia geométrica.
- Vista DuckDB rota: cambiar rutas de Parquet requiere volver a ejecutar `build-db`.
- `ModuleNotFoundError`: instalar `requirements.txt` en el entorno correcto.
- Comparabilidad 2009 vs 2024: verificar sección, distritación y denominador antes de construir narrativa histórica.
