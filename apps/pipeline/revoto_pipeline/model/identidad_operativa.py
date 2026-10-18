"""Resolución conservadora de identidad operativa municipal para el modo exploratorio.

La identidad electoral (serie INE) y la equivalencia territorial (CVEGEO) se
mantienen separadas. Las variaciones ortográficas pueden unir una serie
operativa, pero nunca convierten por sí solas una equivalencia en verificada.
"""
from __future__ import annotations

import re
import unicodedata
from collections import defaultdict
from difflib import SequenceMatcher
from typing import Iterable

RESOLUTION = (
    "equivalencia_verificada",
    "alias_historico_verificado",
    "candidato_inequivoco",
    "ambiguo",
    "sin_resolver",
)


def normalize_name(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value or "").strip().upper())
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"\bDR\.?\b", "DOCTOR", text)
    text = re.sub(r"\bGRAL\.?\b", "GENERAL", text)
    text = re.sub(r"\bDTO\.?\s*0*([0-9]+)\b", r"DISTRITO \1", text)
    text = re.sub(r"[^A-Z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def compact_name(value: object) -> str:
    return re.sub(r"[^A-Z0-9]", "", normalize_name(value))


def _damerau_levenshtein(a: str, b: str) -> int:
    """Distancia OSA: reconoce una transposición adyacente como un typo."""
    rows, cols = len(a) + 1, len(b) + 1
    d = [[0] * cols for _ in range(rows)]
    for i in range(rows): d[i][0] = i
    for j in range(cols): d[0][j] = j
    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[-1][-1]


def name_relation(a: object, b: object) -> tuple[str, float, int]:
    """Clasifica similitud textual; nunca declara equivalencia territorial."""
    na, nb = normalize_name(a), normalize_name(b)
    ca, cb = compact_name(a), compact_name(b)
    if na == nb:
        return "normalizado_exacto", 1.0, 0
    if ca == cb:
        return "formato_equivalente", 1.0, 0
    if not ca or not cb:
        return "distinto", 0.0, max(len(ca), len(cb))
    ratio = SequenceMatcher(None, ca, cb).ratio()
    distance = _damerau_levenshtein(ca, cb)
    longest = max(len(ca), len(cb))
    if longest >= 7 and distance <= max(1, int(longest * 0.12)) and ratio >= 0.86:
        return "variacion_ortografica_probable", ratio, distance
    return "distinto", ratio, distance


def _code(value: object) -> str:
    text = str(value or "").strip()
    if text.endswith(".0"):
        text = text[:-2]
    return text if len(text) == 5 and text.isdigit() else ""


def _yes(value: object) -> bool:
    return str(value or "").strip().lower() in {"si", "sí", "yes", "true", "1"}


## !GRANDE: identidad operativa por serie, separada de la equivalencia territorial.
def reconcile_operational_rows(rows: Iterable[dict]) -> list[dict]:
    """Reescribe identificadores operativos sin alterar ningún conteo electoral.

    Regla central:
    - mismo (entidad, MPIOCVE) puede formar una serie entre elecciones sólo si
      sus nombres son compatibles o existe evidencia territorial coherente;
    - una discontinuidad fuerte de nombre corta la serie;
    - un CVEGEO candidato único puede acompañar una serie exploratoria, pero
      sólo `equivalencia_verificada=si` lo vuelve publicable como verificado.
    """
    source = [dict(r) for r in rows]
    grouped: dict[tuple[int, int], list[dict]] = defaultdict(list)
    for row in source:
        grouped[(int(row["cve_ent_ine"]), int(row["cve_mpio_ine"]))].append(row)

    output: list[dict] = []
    for (ent, mun), group in sorted(grouped.items()):
        group.sort(key=lambda r: int(r["anio_eleccion"]))
        segments: list[list[dict]] = []
        current: list[dict] = []
        for row in group:
            if not current:
                current = [row]
                continue
            relation, _, _ = name_relation(current[-1].get("nombre_ine"), row.get("nombre_ine"))
            prev_codes = {_code(x.get("cvegeo_canonico")) or _code(x.get("cvegeo_candidato")) for x in current}
            prev_codes.discard("")
            this_code = _code(row.get("cvegeo_canonico")) or _code(row.get("cvegeo_candidato"))
            evidence_bridge = bool(this_code and (not prev_codes or prev_codes == {this_code}))
            if relation == "distinto" and not evidence_bridge:
                segments.append(current)
                current = [row]
            else:
                current.append(row)
        if current:
            segments.append(current)

        ambiguous_group = len(segments) > 1
        for segment_index, segment in enumerate(segments, 1):
            verified_codes = {_code(r.get("cvegeo_canonico")) for r in segment if _yes(r.get("equivalencia_verificada"))}
            verified_codes.discard("")
            candidate_codes = {_code(r.get("cvegeo_candidato")) for r in segment}
            candidate_codes.discard("")
            all_codes = verified_codes | candidate_codes
            if ambiguous_group:
                state = "ambiguo"
                uid = f"ine_segmento:{ent:02}:{mun:03}:{segment_index}"
                chosen = next(iter(all_codes), "") if len(all_codes) == 1 else ""
            elif len(all_codes) > 1:
                state = "ambiguo"
                uid = f"ine_segmento:{ent:02}:{mun:03}:{segment_index}"
                chosen = ""
            else:
                chosen = next(iter(all_codes), "")
                all_verified = bool(segment) and all(_yes(r.get("equivalencia_verificada")) for r in segment)
                if all_verified and chosen:
                    equivalences = {str(r.get("tipo_equivalencia", "")).strip().lower() for r in segment}
                    state = ("alias_historico_verificado" if "renombre" in equivalences
                             else "equivalencia_verificada")
                    uid = f"cvegeo:{chosen}"
                elif chosen:
                    state = "candidato_inequivoco"
                    uid = f"candidato_inegi:{chosen}"
                elif len(segment) >= 2 and not ambiguous_group:
                    state = "candidato_inequivoco"
                    uid = f"ine_serie:{ent:02}:{mun:03}"
                elif ambiguous_group:
                    state = "ambiguo"
                    uid = f"ine_segmento:{ent:02}:{mun:03}:{segment_index}"
                else:
                    state = "sin_resolver"
                    uid = f"ine_historico:{int(segment[0]['anio_eleccion'])}:{ent:02}:{mun:03}"

            aliases = sorted({str(r.get("nombre_ine") or "").strip() for r in segment if str(r.get("nombre_ine") or "").strip()})
            for row in segment:
                updated = dict(row)
                updated["identificador_operativo"] = uid
                updated["estado_resolucion"] = state
                updated["aliases_ine"] = " | ".join(aliases)
                if chosen:
                    updated["cvegeo_candidato"] = chosen
                if state != "equivalencia_verificada" and not _yes(updated.get("equivalencia_verificada")):
                    updated["equivalencia_verificada"] = "no"
                updated["confianza"] = {
                    "equivalencia_verificada": "verificada_existente",
                    "alias_historico_verificado": "verificada_alias",
                    "candidato_inequivoco": "candidato_inequivoco",
                    "ambiguo": "ambigua",
                    "sin_resolver": "sin_equivalencia",
                }[state]
                output.append(updated)
    return sorted(output, key=lambda r: (int(r["anio_eleccion"]), int(r["cve_ent_ine"]), int(r["cve_mpio_ine"])))
