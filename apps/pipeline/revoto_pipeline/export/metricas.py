"""Reglas electorales compartidas por exportación estricta y exploratoria.

Sólo deriva tasas desde conteos originales. No hace joins territoriales.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal

YEARS = (2009, 2012, 2015, 2018, 2021, 2024)
PRESIDENCIALES = frozenset({2012, 2018, 2024})
GRUPOS_EDAD = ('18-24', '25-34', '35-44', '45-59', '60+')
SEXO = ('H', 'M')
Status = Literal['available', 'suppressed', 'rate_undefined', 'unavailable', 'no_data']


@dataclass(frozen=True)
class Counts:
    ln: int
    sv: int
    ns: int
    nv: int | None = None


def counts(value: Mapping | tuple | list) -> Counts:
    """Validación antes de determinar supresión, incluso si el recurso no se publica."""
    if isinstance(value, Mapping):
        fields = [value.get(k) for k in ('LN', 'SV', 'NS')]
        nv = value.get('NV')
    else:
        if len(value) != 4:
            raise ValueError('Se requieren los conteos LN, SV, NV, NS')
        fields = [value[0], value[1], value[3]]
        nv = value[2]
    if any(x is None for x in fields):
        raise ValueError('Conteos LN, SV o NS faltantes')
    if any(type(x) is not int or x < 0 for x in fields) or (nv is not None and (type(nv) is not int or nv < 0)):
        raise ValueError('Conteos electorales deben ser enteros no negativos')
    ln, sv, ns = fields
    if ns > ln or sv > ln - ns or (nv is not None and nv > ln - sv - ns):
        raise ValueError('Conteos incompatibles: NS > LN o SV + NS + NV > LN')
    return Counts(ln=ln, sv=sv, ns=ns, nv=nv)


def status(value: Mapping | tuple | list | None, threshold: int) -> Status:
    if type(threshold) is not int or threshold < 1:
        raise ValueError('RN-05 requiere un umbral entero positivo')
    if value is None:
        return 'no_data'
    if isinstance(value, Mapping) and any(value.get(k) is None for k in ('LN', 'SV', 'NS')):
        return 'unavailable'
    c = counts(value)
    if c.ln < threshold:
        return 'suppressed'
    if c.ln == c.ns:
        return 'rate_undefined'
    return 'available'


def fraction(value: Mapping | tuple | list, threshold: int) -> float | None:
    if status(value, threshold) != 'available':
        return None
    c = counts(value)
    return round(c.sv / (c.ln - c.ns), 3)


def election(year: int, value: Mapping | tuple | list, threshold: int,
             ages: Mapping[str, Mapping | tuple | list] | None = None,
             sexes: Mapping[str, Mapping | tuple | list] | None = None,
             *, include_unavailable: bool = True) -> dict:
    if year not in YEARS:
        raise ValueError(f'Año fuera del contrato L4: {year}')
    kind = status(value, threshold)
    base = {'anio': year, 'tipo': 'presidencial' if year in PRESIDENCIALES else 'intermedia'}
    if kind != 'available':
        if not include_unavailable:
            raise ValueError(f'Elección no publicable: {year}/{kind}')
        return {**base, 'suprimido': kind == 'suppressed', 'estado_tasa': kind}
    c = counts(value)
    age = {k: v for k in GRUPOS_EDAD if k in (ages or {}) if (v := fraction(ages[k], threshold)) is not None}
    sex = {k: v for k in SEXO if k in (sexes or {}) if (v := fraction(sexes[k], threshold)) is not None}
    return {**base, 'participacion': fraction(value, threshold), 'lista_nominal': c.ln,
            'por_edad': age, 'por_sexo': sex}


def global_suppressed(periods: list[dict]) -> bool:
    """No oculta elecciones disponibles porque otra quedó suprimida."""
    return bool(periods) and all(x.get('estado_tasa') == 'suppressed' for x in periods)
