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

        return {
            "resolved": True,
            "municipality": municipality,
            "ine_name": ine_name,
            "status": VALIDATED,
            "method": method,
            "confidence": "alta",
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


def main() -> None:
    """Generate all municipal mapping files."""
    ine, name_index = load_ine()

    conapo_rows, conapo_review = build_conapo_mapping(
        ine,
        name_index,
    )

    inegi_rows, inegi_review = build_inegi_mapping(
        ine,
        name_index,
    )

    review_rows = conapo_review + inegi_review

    review_rows.sort(
        key=lambda row: (
            row["fuente"],
            row["anio"],
            row["cve_ent_ine"],
            str(row["codigo_fuente"]),
        )
    )

    write_csv(
        OUT / "conapo_ine.csv",
        [
            "clave_conapo",
            "clave_ent_conapo",
            "cve_ent_ine",
            "cve_mpio_ine",
            "anio",
            "status_match",
            "metodo_match",
        ],
        conapo_rows,
    )

    write_csv(
        OUT / "inegi_ine.csv",
        [
            "censo_ref",
            "cvegeo_municipal_inegi",
            "anio_eleccion",
            "cve_ent_ine",
            "cve_mpio_ine",
            "status_match",
            "metodo_match",
        ],
        inegi_rows,
    )

    write_csv(
        OUT / "revision_mappings.csv",
        [
            "fuente",
            "anio",
            "cve_ent_ine",
            "cve_mpio_ine_codigo",
            "cve_mpio_ine_resuelto",
            "nombre_ine",
            "nombre_fuente",
            "nombre_coincide",
            "codigo_fuente",
            "status_match",
            "metodo_match",
            "confianza",
            "observacion",
        ],
        review_rows,
    )

    print_summary(
        conapo_rows,
        inegi_rows,
        review_rows,
    )


if __name__ == "__main__":
    main()