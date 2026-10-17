"""Generate municipal crosswalks between INE, CONAPO and INEGI.
"""

from __future__ import annotations

import csv
import re
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Any

import duckdb

from revoto_pipeline.config import sql_path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "data" / "mappings"

YEARS = (2009, 2012, 2015, 2018, 2021, 2024)

CENSUS_REFERENCE = {
    2009: 2010,
    2012: 2010,
    2015: 2010,
    2018: 2020,
    2021: 2020,
    2024: 2020,
}

VALIDATED = "validado"
PENDING = "pendiente_revision"


def normalize_name(value: object) -> str:
    """Normalize a municipality name for deterministic comparisons."""
    text = unicodedata.normalize("NFKD", str(value or "").upper())
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"\b(MUNICIPIO|MPIO|MUNICIPALIDAD|DELEGACION)\b", " ", text)
    text = re.sub(r"[^A-Z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def as_int(value: object) -> int | None:
    """Return an integer when the value represents one, otherwise None."""
    if value is None:
        return None

    text = str(value).strip()

    if not text:
        return None

    try:
        return int(float(text))
    except (TypeError, ValueError):
        return None


def normalized_conapo_code(value: object) -> str | None:
    """Normalize a CONAPO municipality code to ENT(2)+MUN(3)."""
    number = as_int(value)

    if number is None:
        return None

    return f"{number:05d}"


def query_parquet(path: Path, sql: str) -> list[tuple[Any, ...]]:
    """Execute a small DuckDB query against one Parquet file."""
    if not path.exists():
        raise FileNotFoundError(
            f"No existe {path}. Ejecuta primero la ingestión correspondiente."
        )

    with duckdb.connect() as con:
        con.execute(
            f"""
            CREATE VIEW src AS
            SELECT *
            FROM read_parquet('{sql_path(path)}')
            """
        )
        return con.execute(sql).fetchall()


def write_csv(
    path: Path,
    columns: list[str],
    rows: list[dict[str, Any]],
) -> None:
    """Write a CSV atomically using UTF-8 with BOM for Excel compatibility."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")

    with tmp.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(
            {column: row.get(column, "") for column in columns}
            for row in rows
        )

    tmp.replace(path)


def load_ine() -> tuple[
    dict[tuple[int, int, int], str],
    dict[tuple[int, int], dict[str, list[int]]],
]:
    """Load the municipal INE catalog from already-ingested Parquet files."""
    municipalities: dict[tuple[int, int, int], str] = {}
    names: dict[tuple[int, int], dict[str, list[int]]] = defaultdict(
        lambda: defaultdict(list)
    )

    for state in range(1, 33):
        for year in YEARS:
            path = (
                ROOT
                / "data"
                / "staging"
                / "ine"
                / f"edo={state:02d}"
                / f"anio={year}"
                / "conteos.parquet"
            )

            if not path.exists():
                continue

            rows = query_parquet(
                path,
                """
                SELECT
                    EDOCVE,
                    MPIOCVE,
                    MIN(MPIONOM) AS MPIONOM
                FROM src
                WHERE
                    EDOCVE IS NOT NULL
                    AND MPIOCVE IS NOT NULL
                    AND MPIONOM IS NOT NULL
                GROUP BY EDOCVE, MPIOCVE
                """,
            )

            for entity, municipality, name in rows:
                ent = as_int(entity)
                mun = as_int(municipality)

                if ent is None or mun is None:
                    continue

                key = (ent, mun, year)
                municipalities[key] = str(name)

                normalized = normalize_name(name)

                if mun not in names[(ent, year)][normalized]:
                    names[(ent, year)][normalized].append(mun)

    if not municipalities:
        raise RuntimeError(
            "No se encontraron Parquet INE. Ejecuta ingest-ine al menos "
            "para un estado antes de generate-mappings."
        )

    return municipalities, names


def resolve_ine_municipality(
    *,
    entity: int,
    year: int,
    candidate_municipality: int | None,
    source_name: object,
    ine: dict[tuple[int, int, int], str],
    name_index: dict[tuple[int, int], dict[str, list[int]]],
) -> dict[str, Any]:
    """Resolve one source municipality against the INE municipal catalog."""
    source_normalized = normalize_name(source_name)

    if candidate_municipality is not None:
        candidate_name = ine.get(
            (entity, candidate_municipality, year)
        )

        if (
            candidate_name is not None
            and normalize_name(candidate_name) == source_normalized
        ):
            return {
                "resolved": True,
                "municipality": candidate_municipality,
                "ine_name": candidate_name,
                "status": VALIDATED,
                "method": "codigo_nombre",
                "confidence": "alta",
                "observation": (
                    "Coinciden código municipal y nombre normalizado."
                ),
            }

    matches = name_index.get(
        (entity, year),
        {},
    ).get(source_normalized, [])

    if len(matches) == 1:
        municipality = matches[0]
        ine_name = ine[(entity, municipality, year)]

        if (
            candidate_municipality is not None
            and candidate_municipality != municipality
        ):
            observation = (
                f"Nombre único coincide con INE municipio {municipality}; "
                f"el código fuente sugería {candidate_municipality}."
            )
            method = "nombre_unico_codigo_distinto"
        else:
            observation = "Nombre normalizado coincide de forma única."
            method = "nombre_unico"

        # CAMBIO: un nombre único, aun sin conflicto aparente de clave, requiere
        # verificación documental; nunca es evidencia suficiente de identidad.
        return {
            "resolved": False,
            "municipality": municipality,
            "ine_name": ine_name,
            "status": PENDING,
            "method": method,
            "confidence": "baja",
            "observation": observation,
        }

    candidate_name = (
        ine.get((entity, candidate_municipality, year))
        if candidate_municipality is not None
        else None
    )

    if len(matches) > 1:
        observation = (
            "El nombre coincide con más de un municipio INE "
            f"({', '.join(map(str, matches))}). Requiere revisión."
        )
        method = "nombre_ambiguo"
    elif candidate_name is not None:
        observation = (
            f"El código apunta a '{candidate_name}', pero el nombre fuente "
            f"es '{source_name}'. No se encontró un match único por nombre."
        )
        method = "conflicto_codigo_nombre"
    else:
        observation = (
            "No existe coincidencia por código ni por nombre dentro de "
            "la misma entidad y año."
        )
        method = "sin_match"

    return {
        "resolved": False,
        "municipality": candidate_municipality,
        "ine_name": candidate_name or "",
        "status": PENDING,
        "method": method,
        "confidence": "baja",
        "observation": observation,
    }


def build_conapo_mapping(
    ine: dict[tuple[int, int, int], str],
    name_index: dict[tuple[int, int], dict[str, list[int]]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Build CONAPO → INE municipal crosswalk candidates."""
    path = (
        ROOT
        / "data"
        / "staging"
        / "conapo"
        / "poblacion_anual.parquet"
    )

    rows = query_parquet(
        path,
        """
        SELECT
            clave_municipal_raw,
            clave_entidad_raw,
            anio,
            MIN(NOM_MUN) AS NOM_MUN
        FROM src
        WHERE
            clave_municipal_raw IS NOT NULL
            AND clave_entidad_raw IS NOT NULL
            AND anio IS NOT NULL
        GROUP BY
            clave_municipal_raw,
            clave_entidad_raw,
            anio
        """,
    )

    mappings: list[dict[str, Any]] = []
    reviews: list[dict[str, Any]] = []
    seen: set[tuple[str, int]] = set()

    for raw_code, raw_entity, raw_year, source_name in rows:
        year = as_int(raw_year)
        entity = as_int(raw_entity)
        code = normalized_conapo_code(raw_code)

        if year not in YEARS or entity is None or code is None:
            continue

        key = (code, year)

        if key in seen:
            continue

        seen.add(key)

        candidate_municipality = int(code[-3:])

        result = resolve_ine_municipality(
            entity=entity,
            year=year,
            candidate_municipality=candidate_municipality,
            source_name=source_name,
            ine=ine,
            name_index=name_index,
        )

        reviews.append(
            {
                "fuente": "CONAPO",
                "anio": year,
                "cve_ent_ine": entity,
                "cve_mpio_ine_codigo": candidate_municipality,
                "cve_mpio_ine_resuelto": result["municipality"] or "",
                "nombre_ine": result["ine_name"],
                "nombre_fuente": source_name,
                "nombre_coincide": (
                    "si"
                    if normalize_name(result["ine_name"])
                    == normalize_name(source_name)
                    else "no"
                ),
                "codigo_fuente": code,
                "status_match": result["status"],
                "metodo_match": result["method"],
                "confianza": result["confidence"],
                "observacion": result["observation"],
            }
        )

        if not result["resolved"]:
            continue

        mappings.append(
            {
                "clave_conapo": code,
                "clave_ent_conapo": f"{entity:02d}",
                "cve_ent_ine": entity,
                "cve_mpio_ine": result["municipality"],
                "anio": year,
                "status_match": VALIDATED,
                "metodo_match": result["method"],
            }
        )

    mappings.sort(
        key=lambda row: (
            row["anio"],
            row["cve_ent_ine"],
            row["cve_mpio_ine"],
        )
    )

    return mappings, reviews


def build_inegi_mapping(
    ine: dict[tuple[int, int, int], str],
    name_index: dict[tuple[int, int], dict[str, list[int]]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Build INEGI ITER → INE municipal crosswalk candidates."""
    mappings: list[dict[str, Any]] = []
    reviews: list[dict[str, Any]] = []

    for census in (2010, 2020):
        path = (
            ROOT
            / "data"
            / "staging"
            / "inegi"
            / f"censo={census}"
            / "iter.parquet"
        )

        if not path.exists():
            continue

        rows = query_parquet(
            path,
            """
            SELECT
                cvegeo,
                MIN(NOM_MUN) AS NOM_MUN
            FROM src
            WHERE
                record_level = 'total_municipal'
                AND cvegeo IS NOT NULL
                AND NOM_MUN IS NOT NULL
            GROUP BY cvegeo
            """,
        )

        for raw_code, source_name in rows:
            code = str(raw_code).strip()

            if (
                len(code) != 9
                or not code.isdigit()
                or not code.endswith("0000")
            ):
                continue

            entity = int(code[:2])
            candidate_municipality = int(code[2:5])

            for year in YEARS:
                if CENSUS_REFERENCE[year] != census:
                    continue

                result = resolve_ine_municipality(
                    entity=entity,
                    year=year,
                    candidate_municipality=candidate_municipality,
                    source_name=source_name,
                    ine=ine,
                    name_index=name_index,
                )

                reviews.append(
                    {
                        "fuente": "INEGI",
                        "anio": year,
                        "cve_ent_ine": entity,
                        "cve_mpio_ine_codigo": candidate_municipality,
                        "cve_mpio_ine_resuelto": (
                            result["municipality"] or ""
                        ),
                        "nombre_ine": result["ine_name"],
                        "nombre_fuente": source_name,
                        "nombre_coincide": (
                            "si"
                            if normalize_name(result["ine_name"])
                            == normalize_name(source_name)
                            else "no"
                        ),
                        "codigo_fuente": code,
                        "status_match": result["status"],
                        "metodo_match": result["method"],
                        "confianza": result["confidence"],
                        "observacion": result["observation"],
                    }
                )

                if not result["resolved"]:
                    continue

                mappings.append(
                    {
                        "censo_ref": census,
                        "cvegeo_municipal_inegi": code,
                        "anio_eleccion": year,
                        "cve_ent_ine": entity,
                        "cve_mpio_ine": result["municipality"],
                        "status_match": VALIDATED,
                        "metodo_match": result["method"],
                    }
                )

    mappings.sort(
        key=lambda row: (
            row["anio_eleccion"],
            row["cve_ent_ine"],
            row["cve_mpio_ine"],
        )
    )

    return mappings, reviews


def print_summary(
    conapo: list[dict[str, Any]],
    inegi: list[dict[str, Any]],
    reviews: list[dict[str, Any]],
) -> None:
    """Print a compact quality summary."""
    pending = [
        row
        for row in reviews
        if row["status_match"] != VALIDATED
    ]

    corrected = [
        row
        for row in reviews
        if row["metodo_match"] == "nombre_unico_codigo_distinto"
    ]

    print()
    print("Mappings municipales REVOTO")
    print("-" * 42)
    print(f"CONAPO → INE validados : {len(conapo):,}")
    print(f"INEGI  → INE validados : {len(inegi):,}")
    print(f"Correcciones por nombre: {len(corrected):,}")
    print(f"Pendientes de revisión : {len(pending):,}")
    print(f"Salida                  : {OUT}")

    if pending:
        print()
        print(
            "ATENCIÓN: revision_mappings.csv contiene "
            f"{len(pending):,} casos no resueltos."
        )



## !GRANDE: integración de catálogo INE histórico + referencia ITER (sin matches por nombre).
from revoto_pipeline.config import load_config, Settings
from revoto_pipeline.model.identidad_municipal import (
    COLUMNS as IDENTITY_COLUMNS, code5, normalize_name as stable_name,
    load_identities, require_identities)
from revoto_pipeline.validation.municipios import audit_municipalities


def historic_records(cfg: Settings) -> tuple[list[tuple[int, int, int, str]], list[tuple[int, int]]]:
    """Usa canonical primero y staging sólo si falta una partición canónica."""
    records = []
    missing = []
    for ent in range(1, 33):
        for year in cfg.years:
            canonical = (cfg.path('processed')/'canonical'/'hecho_participacion'/
                         f'edo={ent:02}'/f'anio={year}'/'hechos.parquet')
            staging = cfg.path('ine_staging')/f'edo={ent:02}'/f'anio={year}'/'conteos.parquet'
            path = canonical if canonical.is_file() else staging
            if not path.is_file():
                missing.append((ent, year))
                continue
            data = query_parquet(path, """SELECT EDOCVE, MPIOCVE, MPIONOM FROM src
                WHERE MPIOCVE IS NOT NULL GROUP BY 1,2,3""")
            for e, m, name in data:
                if int(e) != ent or name is None or not str(name).strip():
                    raise ValueError(f'Claves/nombres municipales inválidos en {path}')
                records.append((year, ent, int(m), str(name).strip()))
    return records, missing


def audit_command(cfg: Settings) -> list[dict]:
    records, missing = historic_records(cfg)
    report = audit_municipalities(records, cfg.years)
    columns = ['anio_eleccion','cve_ent_ine','cve_mpio_ine','nombre_ine',
               'categorias','historial_clave','historial_nombre','requiere_revision',
               'dictamen','fuente_verificacion']
    destination = cfg.root/'data'/'quality'/'municipios_conflictos.csv'
    write_csv(destination, columns, report)
    print(f'AUDITORÍA {len(report)} observaciones; faltan {len(missing)} particiones; {destination}')
    return report


def _reference_catalog(cfg: Settings) -> dict[tuple[int, str], str]:
    """Clave municipal ITER 9 dígitos; no transforma nombres en IDs."""
    result: dict[tuple[int, str], str] = {}
    for census in sorted(set(cfg.reference.values())):
        path = cfg.path('inegi_staging')/f'censo={census}'/'iter.parquet'
        if not path.is_file():
            raise FileNotFoundError(f'Falta referencia municipal INEGI {census}: {path}')
        for raw, name in query_parquet(path, """SELECT cvegeo, MIN(NOM_MUN) FROM src
                WHERE record_level='total_municipal' AND cvegeo IS NOT NULL
                GROUP BY cvegeo"""):
            value = str(raw).strip()
            if len(value) != 9 or not value.isascii() or not value.isdigit() or not value.endswith('0000'):
                raise ValueError(f'CVEGEO ITER total municipal inválido: {value!r}')
            key = (census, code5(value))
            if key in result:
                raise ValueError(f'ITER municipal duplicado: {key}')
            result[key] = str(name or '').strip()
    return result


def _manual(path: Path) -> dict[tuple[int, int, int], dict]:
    if not path.is_file():
        return {}
    with path.open(encoding='utf-8-sig', newline='') as file:
        reader = csv.DictReader(file)
        if not set(IDENTITY_COLUMNS) <= set(reader.fieldnames or ()):
            raise ValueError(f'Dictámenes municipales sin columnas obligatorias: {path}')
        rows = {}
        for item in reader:
            k = tuple(int(item[n]) for n in ('anio_eleccion','cve_ent_ine','cve_mpio_ine'))
            if k in rows:
                raise ValueError(f'Dictamen manual duplicado: {k}')
            if item['equivalencia_verificada'].strip().lower() != 'si':
                raise ValueError(f'Dictamen manual sin verificación: {k}')
            if item['tipo_equivalencia'].strip() not in {'exacta','recodificacion','renombre'}:
                raise ValueError(f'Dictamen manual con tipo inválido: {k}')
            rows[k] = item
        return rows


## !GRANDE: descubrimiento auditable de candidatos, sin aprobar equivalencias por nombre.
CANDIDATE_COLUMNS = [
    'anio_eleccion','cve_ent_ine','cve_mpio_ine','nombre_ine','censo_referencia',
    'cvegeo_candidato','nombre_inegi','metodo_candidato','codigo_coincide',
    'nombre_coincide','candidatos_mismo_nombre','codigo_en_conflicto',
    'nombre_en_conflicto','evaluacion','equivalencia_verificada','fuente_referencia'
]


def discover_municipal_candidates(records: list[tuple[int,int,int,str]],
                                  conflicts: list[dict],
                                  catalog: dict[tuple[int,str],str],
                                  reference: dict[int,int]) -> list[dict]:
    """Discover possible matches from real ITER entries, never a verified identity.

    A candidate is only an aid for documentary review. Names are never joined
    to data and candidate CVEGEOS are never copied to publication mappings.
    """
    catalog_by_name = defaultdict(list)
    for (census, code), official in catalog.items():
        catalog_by_name[(census, int(code[:2]), stable_name(official))].append((code, official))
    for values in catalog_by_name.values():
        values.sort()
    flags = defaultdict(set)
    for item in conflicts:
        try:
            key = (int(item['anio_eleccion']), int(item['cve_ent_ine']),
                   int(item['cve_mpio_ine']))
        except (ValueError, TypeError, KeyError):
            continue
        flags[key].update(str(item.get('categorias','')).split('|'))
    sources = defaultdict(set)
    for year, ent, mun, name in records:
        sources[(year, ent, mun)].add(name)
    result = []
    for (year, ent, mun), names in sorted(sources.items()):
        census = reference[year]
        name = max(names, key=lambda n: (sum(ord(c)>127 for c in n),len(n),n))
        key = (year, ent, mun)
        code = f'{ent:02}{mun:03}'
        by_code = catalog.get((census,code))
        by_name = catalog_by_name.get((census,ent,stable_name(name)),[])
        candidates = {c:(n,'nombre_normalizado') for c,n in by_name}
        if by_code is not None:
            candidates[code] = (by_code,'codigo_y_nombre' if stable_name(name)==stable_name(by_code) else 'codigo_distinto_nombre')
        conflict = flags.get(key,set())
        territorial_alert = any(x.startswith(('A_','B_','E_','F_')) for x in conflict)
        spelling_alert = any(x.startswith('G_') for x in conflict)
        if not candidates:
            result.append(dict(anio_eleccion=year,cve_ent_ine=ent,cve_mpio_ine=mun,
                               nombre_ine=name,censo_referencia=census,cvegeo_candidato='',
                               nombre_inegi='',metodo_candidato='sin_candidato',codigo_coincide='no',
                               nombre_coincide='no',candidatos_mismo_nombre=0,
                               codigo_en_conflicto='si' if territorial_alert else 'no',
                               nombre_en_conflicto='si' if spelling_alert else 'no',
                               evaluacion='sin_candidato_catalogo',equivalencia_verificada='no',
                               fuente_referencia=f'INEGI ITER {census} (total_municipal)'))
        for candidate,(official,method) in sorted(candidates.items()):
            code_match = candidate == code
            name_match = stable_name(name) == stable_name(official)
            if territorial_alert:
                evaluation='revision_territorial_obligatoria'
            elif name_match and len(by_name)>1:
                evaluation='nombre_duplicado_catalogo'
            elif code_match and name_match:
                evaluation='concordancia_codigo_nombre_sujeta_a_reglas_actuales'
            elif name_match:
                evaluation='candidato_unico_nombre_requiere_evidencia' if len(by_name)==1 else 'nombre_duplicado_catalogo'
            else:
                evaluation='codigo_no_coincide_con_nombre'
            result.append(dict(anio_eleccion=year,cve_ent_ine=ent,cve_mpio_ine=mun,
                               nombre_ine=name,censo_referencia=census,cvegeo_candidato=candidate,
                               nombre_inegi=official,metodo_candidato=method,
                               codigo_coincide='si' if code_match else 'no',
                               nombre_coincide='si' if name_match else 'no',
                               candidatos_mismo_nombre=len(by_name),
                               codigo_en_conflicto='si' if territorial_alert else 'no',
                               nombre_en_conflicto='si' if spelling_alert else 'no',
                               evaluacion=evaluation,equivalencia_verificada='no',
                               fuente_referencia=f'INEGI ITER {census} (total_municipal)'))
    return result


def build_historic_mapping(cfg: Settings, records: list[tuple[int,int,int,str]],
                           conflicts: list[dict], catalog: dict[tuple[int,str],str]) -> list[dict]:
    """Auto-verifica sólo concordancia código+nombres ITER sin señales A/B/E/F."""
    manual_file = cfg.root/'data'/'mappings'/'municipios_historicos_revisados.csv'
    manual = _manual(manual_file)
    duplicates = defaultdict(set)
    for y,e,m,n in records:
        duplicates[(y,e,m)].add(stable_name(n))
    if any(len(v)>1 for v in duplicates.values()):
        raise ValueError('Un mismo MPIOCVE tiene dos nombres en una misma elección; auditar origen')
    flagged = {(r['anio_eleccion'],int(r['cve_ent_ine']),int(r['cve_mpio_ine']))
               for r in conflicts if r['cve_mpio_ine'] and
               any(f in r['categorias'] for f in ('A_','B_','E_','F_','nombres_distintos'))}
    mapping = []
    record_keys = {(y,e,m) for y,e,m,_ in records}
    if set(manual) - record_keys:
        raise ValueError(f'Dictámenes manuales sin municipio histórico: {sorted(set(manual)-record_keys)[:5]}')
    # CAMBIO: una misma clave con variantes de escritura del mismo año
    # sólo produce una fila, sin esconder variantes en la auditoría.
    sources = defaultdict(list)
    for y,e,m,n in records:
        sources[(y,e,m)].append(n)
    for (year, ent, mun), names in sorted(sources.items()):
        name = max(names, key=lambda n:(sum(ord(c)>127 for c in n),len(n),n))
        k = (year, ent, mun)
        census = cfg.reference[year]
        source = f'INEGI ITER {census} (total_municipal)'
        candidate = f'{ent:02}{mun:03}'
        official = catalog.get((census,candidate))
        exact = k not in flagged and official and stable_name(official) == stable_name(name)
        row = dict(zip(IDENTITY_COLUMNS, [year,ent,mun,name,'','',
                  'ambigua_no_verificada','no',census,source,'',
                  'Se requiere revisión documental; nunca asumir identidad por nombre.']))
        if exact:
            row.update(cvegeo_canonico=candidate,nombre_canonico=official,
                       tipo_equivalencia='exacta',equivalencia_verificada='si',
                       evidencia=f'INE {year} / ITER {census}: código y nombre coincidentes; '
                                 'sin señales A/B/E/F entre elecciones',observacion='')
        if k in manual:
            review = manual[k]
            if stable_name(review['nombre_ine']) != stable_name(name):
                raise ValueError(f'Dictamen manual ya no coincide con INE: {k}')
            code = code5(review['cvegeo_canonico'])
            # No usar fuente 2010 para demostrar una identidad 2020 ausente.
            if int(code[:2]) != ent or (census,code) not in catalog:
                raise ValueError(f'Dictamen municipal {k}: {code} no existe en ITER {census}')
            if stable_name(review['nombre_canonico']) != stable_name(catalog[(census,code)]):
                raise ValueError(f'Dictamen {k}: nombre canónico distinto al catálogo INEGI')
            if int(review['censo_referencia']) != census:
                raise ValueError(f'Dictamen {k}: censo_ref no coincide con configuración ({census})')
            if not review['evidencia'].strip() or not review['fuente_referencia'].strip():
                raise ValueError(f'Dictamen {k} carece de evidencia documental')
            row.update(review)
            # CAMBIO: siempre conservar nombres/claves reales y CVEGEO de 5 dígitos.
            row.update(anio_eleccion=year,cve_ent_ine=ent,cve_mpio_ine=mun,
                       nombre_ine=name,cvegeo_canonico=code,
                       nombre_canonico=catalog[(census,code)],
                       equivalencia_verificada='si',
                       tipo_equivalencia=review['tipo_equivalencia'].strip().lower(),
                       censo_referencia=census)
        mapping.append(row)
    output = cfg.path('mapping_municipal_historico')
    write_csv(output,list(IDENTITY_COLUMNS),mapping)
    # Relectura estricta: también detecta dos orígenes del mismo año → CVEGEO.
    load_identities(output)
    return mapping


def main(cfg: Settings | None = None) -> None:
    """Genera auditoría nacional, mapping histórico y legacy derivado de él."""
    cfg = cfg or load_config()
    records, missing = historic_records(cfg)
    conflicts = audit_command(cfg)
    if missing:
        raise ValueError(f'Faltan {len(missing)} particiones INE para mapping nacional: {missing[:8]}; '
                         'la auditoría CSV se guardó sin inventar municipios faltantes')
    catalog = _reference_catalog(cfg)
    # CAMBIO: diagnóstico separado; no modifica ni aprueba el mapping histórico.
    candidates = discover_municipal_candidates(records, conflicts, catalog, cfg.reference)
    candidate_path = cfg.root/'data'/'quality'/'municipios_candidatos_inegi.csv'
    write_csv(candidate_path, CANDIDATE_COLUMNS, candidates)
    print(f'CANDIDATOS INEGI: {len(candidates)} filas de revisión; {candidate_path}')
    mapped = build_historic_mapping(cfg, records, conflicts, catalog)
    verified = [r for r in mapped if r['equivalencia_verificada'] == 'si']
    inegi_rows = [{
        'censo_ref':r['censo_referencia'],
        'cvegeo_municipal_inegi':r['cvegeo_canonico']+'0000',
        'anio_eleccion':r['anio_eleccion'],'cve_ent_ine':r['cve_ent_ine'],
        'cve_mpio_ine':r['cve_mpio_ine'],'status_match':VALIDATED,
        'metodo_match':r['tipo_equivalencia']}
        for r in verified]
    write_csv(cfg.path('mapping_inegi_ine'),
              ['censo_ref','cvegeo_municipal_inegi','anio_eleccion',
               'cve_ent_ine','cve_mpio_ine','status_match','metodo_match'],inegi_rows)
    conapo = cfg.path('conapo_staging')/'poblacion_anual.parquet'
    conapo_keys = set()
    if cfg.integration.incluir_conapo:
        if not conapo.is_file():
            raise FileNotFoundError(conapo)
        conapo_keys = {(int(year), normalized_conapo_code(raw))
                       for year, raw in query_parquet(conapo, """SELECT DISTINCT anio, clave_municipal_raw
                           FROM src WHERE anio IS NOT NULL AND clave_municipal_raw IS NOT NULL""")}
    conapo_rows = [{
        'clave_conapo':r['cvegeo_canonico'],
        'clave_ent_conapo':f"{int(r['cve_ent_ine']):02}",
        'cve_ent_ine':r['cve_ent_ine'],'cve_mpio_ine':r['cve_mpio_ine'],
        'anio':r['anio_eleccion'],'status_match':VALIDATED,
        'metodo_match':r['tipo_equivalencia']}
        for r in verified if (int(r['anio_eleccion']),r['cvegeo_canonico']) in conapo_keys]
    write_csv(cfg.path('mapping_conapo_ine'),
              ['clave_conapo','clave_ent_conapo','cve_ent_ine','cve_mpio_ine',
               'anio','status_match','metodo_match'],conapo_rows)
    write_csv(OUT/'revision_mappings.csv',list(IDENTITY_COLUMNS),
              [r for r in mapped if r['equivalencia_verificada'] != 'si'])
    print(f'MAPPING HISTÓRICO: {len(verified)} verificados / '
          f'{len(mapped)-len(verified)} pendientes. Salida: {cfg.path("mapping_municipal_historico")}')


if __name__ == '__main__':
    main()
