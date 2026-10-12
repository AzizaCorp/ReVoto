"""Pure methodological helpers; no DB or filesystem dependency."""
from __future__ import annotations
from collections import Counter
from collections.abc import Iterable


def participacion(sv: int | None, ln: int | None, ns: int | None,) -> float | None:
    if sv is None or ln is None or ns is None:
        return None
    denominador = ln - ns
    return 100 * sv / denominador if denominador > 0 else None

def weighted_mean(pairs: Iterable[tuple[float | None, int | None]]) -> float | None:
    rows = list(pairs)
    if not rows or any(v is None or w is None or w < 0 for v, w in rows):
        return None
    weights = sum(w for _, w in rows)
    return sum(v*w for v,w in rows)/weights if weights > 0 else None


def ratio(pairs: Iterable[tuple[int | None, int | None]]) -> float | None:
    rows = list(pairs)
    if not rows or any(n is None or d is None or d < 0 for n,d in rows):
        return None
    d = sum(d for _,d in rows)
    return sum(n for n,_ in rows)/d if d>0 else None


def coverage(assigned: int | None, population: int | None) -> float | None:
    if assigned is None or population is None or population <= 0 or assigned < 0 or assigned > population:
        return None
    return assigned/population


def unique_mapping(rows: Iterable[dict], columns: tuple[str,...]) -> None:
    keys = [tuple(str(r[k]) for k in columns) for r in rows]
    duplicates = [k for k,v in Counter(keys).items() if v>1]
    if duplicates:
        raise ValueError(f'Crosswalk con fanout/duplicados: {duplicates[:5]}')


def publish_count(value: int | None, ln: int | None, rn05: int) -> dict:
    """Suppression stays NULL and is never silently represented as zero."""
    if ln is None:
        return {'valor':None,'status':'unavailable'}
    if ln < rn05:
        return {'valor':None,'status':'suppressed'}
    return {'valor':value,'status':'available' if value is not None else 'unavailable'}
