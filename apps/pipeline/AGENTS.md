
# REVOTO · Contexto para Agentes del Pipeline

> **Ámbito:** `apps/pipeline/` | **Proyecto:** REVOTO · MIZTEPOZ (Hackathon INE) | **Historia:** US-06 · Dataset Pipeline
> **Propósito:** Guía de referencia técnica y operativa para agentes de IA y colaboradores que modifiquen, prueben o mantengan el pipeline de datos.

---

## 1. Visión General y Arquitectura

REVOTO utiliza un pipeline **offline, reproducible y local en Python 3.12 + DuckDB**. Transforma el Parquet consolidado de fuentes electorales (INE), sociodemográficas (INEGI), proyecciones (CONAPO) y cartografía en el modelo analítico normalizado y en artefactos JSON para el frontend.

```text
Fuentes (INE, INEGI, CONAPO, Cartografía)
                   │
                   ▼
       Ingestión y Parquet Canónico
                   │
                   ▼
  Transformación / Mappings / Crosswalks Geo
                   │
                   ▼
  Modelo Analítico DuckDB (Vistas + Tablas)
                   │
                   ▼
   Validación (RF-23) y Privacidad (RN-05)
                   │
                   ▼
       Contrato JSON para Frontend (L4)

```

### Stack Tecnológico Principal

* **Core:** Python 3.12 (referencia) y DuckDB (SQL analítico y consultas Parquet).
* **Geo:** GeoPandas, Shapely, Pyogrio.
* **Procesamiento:** Polars / PyArrow.
* **Testing:** Pytest.
* ⚠️ **Restricción:** El pipeline es **100% offline y local**. **NO** se ejecuta en CI/CD con datos reales ni requiere infraestructura distribuida (Spark/Databricks).

---

## 2. Flujo de Ejecución del Pipeline

> **Nota arquitectónica:** Los scripts SQL de `revoto_pipeline/sql/` son invocados directamente por la CLI de Python (`ejecutar.py`). No asumas una ejecución SQL puramente secuencial.

| Paso / Comando | Componente / Script | Descripción y Regla |
| --- | --- | --- |
| **1. Ingestión INE** | `ingest-ine` / `aggregate-ine` | Ingesta y preserva granularidad de registros electorales. |
| **2. Canónico y Marts** | `build-canonical` / `build-marts` | Construcción de agregaciones preserving `LN`, `SV`, `NV`, `NS`. |
| **3. Fuentes Extra** | `build-inegi` / `build-conapo` | Carga Censo INEGI (2010, 2020) y proyecciones CONAPO. |
| **4. Capas Geo** | `build-geo-layers` / `build-crosswalk` | Genera capas de intersección y mappings territoriales por año. |
| **5. Integración** | `build-full-context` / `build-db` | Integra modelo dimensional e híbrido en DuckDB. |
| **6. Validación** | `validate --all` / `validar.sql` | Aplica **RF-23**: Falla si alguna diferencia vs. cifra oficial es $> 1\text{ pp}$. |
| **7. Exportación** | `export-web --all` | Genera JSON L4 para Frontend (sujeto a supresión **RN-05** y contratos). |

---

## 3. Comandos Rápidos de Desarrollo

Ejecuta siempre los comandos desde `apps/pipeline` con el entorno virtual activo:

```powershell
# Setup inicial
cd apps/pipeline
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Ejecución de Pruebas
python -m pytest -q
python -m compileall -q revoto_pipeline

# Pipeline Completo (Flujo Principal)
python -m revoto_pipeline ingest-ine --all
python -m revoto_pipeline build-marts --all
python -m revoto_pipeline build-full-context --all
python -m revoto_pipeline build-db
python -m revoto_pipeline validate --all
python -m revoto_pipeline export-web --all --integrado

```

---

## 4. Reglas y Restricciones Técnicas

### 4.1 Data e Integridad

* **Archivos Protegidos:** Nunca subir a Git datos reales (`data/`, `*.parquet`, `*.xlsx`, `*.shp`, `*.duckdb`). Todos están explícitamente en `.gitignore`.
* **Configuración Centralizada (`config.toml`):** Umbrales, rutas y parámetros viven en `config.toml`, **nunca** cableados en SQL/Python.
* Mientras `umbral_rn05 = "POR_DEFINIR"`, el pipeline detendrá la publicación a propósito.


* **Fórmula Oficial de Participación:** Usar estrictamente la regla contractual aprobada:

$$\text{Participación} = 100.0 \times \frac{\sum \text{SV}}{\text{NULLIF}(\sum \text{LN}, 0)}$$


* **Sustitución de marcadores:** Los marcadores `{{nombre}}` en SQL son reemplazados únicamente por `sql_utils.py` / `ejecutar.py` (solo acepta rutas y enteros).

### 4.2 Privacidad y Publicación (RN-05)

* **RN-05** controla la supresión de agregados con Lista Nominal reducida.
* **No enmascarar en Frontend:** Datos suprimidos por privacidad **NO** deben enviarse al frontend para ocultarse con CSS/JS; deben filtrarse desde la exportación backend.
* **Contratos Frontend (`packages/contracts/`):** La estructura JSON se define mediante TypeScript/JSON Schema en `packages/contracts`. Cualquier cambio de estructura debe realizarse en el mismo PR actualizando ambas partes.

---

## 5. Organización del Código

```text
apps/pipeline/
├── config.toml                     # Rutas, umbrales y parámetros de ejecución
├── revoto_pipeline/
│   ├── config.py                   # Lectura y validación de config.toml
│   ├── ejecutar.py                 # Orquestación de la CLI de comandos
│   ├── sql_utils.py                # Inyección segura de marcadores SQL
│   ├── transform/                  # Transformaciones INE, INEGI y CONAPO
│   ├── geo/                        # Crosswalks, capas geoespaciales y temporalidad
│   ├── model/                      # Modelo dimensional y carga en DuckDB
│   ├── export/                     # Generación de contratos y JSON para web
│   └── validation/                 # Scripts de validación vs cifras oficiales (RF-23)
└── tests/                          # Pruebas con datos sintéticos / fixtures

```

---

## 6. Estándares de Git, Commits y PRs

* **Ramas de trabajo:** `data/US-NN-slug` o `<tipo>/<ID>-<slug>` (ej. `data/US-06-pipeline-marts`).
* **Formato de Commits:**
```text
data(pipeline:US-06): agrega cálculo de marts para participación por edad

Se actualiza la consulta de agregación para incluir desgloses de edad RN-04.

Refs: US-06

```


* **Tipos permitidos:** `feat`, `fix`, `data`, `perf`, `refactor`, `style`, `test`, `docs`, `build`, `ci`, `chore`.
* **Entregables en PR:** Adjuntar captura o archivo del reporte generado en `apps/pipeline/reportes/`.

---

## 7. Directivas Específicas para Agentes de IA

1. **Pruebas sintéticas:** Toda regla de negocio nueva (RN) o cambio de SQL debe incluir su test correspondiente en `tests/` utilizando fixtures sintéticos pequeñitos.
2. **Cero Mocks destructivos:** No reemplaces lógica de negocio real por `mocks` o datos estáticos para "hacer pasar" una prueba.
3. **Autonomía Git restringida:** El agente **NO** debe hacer `commit`, `push`, `merge` o `rebase` en remoto sin confirmación explícita del usuario.
4. **Respeto a la compatibilidad:** Si modificas una regla de negocio utilizada también por la web (ej. `RN-01`, `RN-03`, `RN-04`), verifica y actualiza su réplica en `apps/web/src/domain/`.