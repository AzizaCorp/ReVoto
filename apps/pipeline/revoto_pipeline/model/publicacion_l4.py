"""Fuentes auxiliares L4. Nunca se inventan equivalencias INE/INEGI ni analíticos.

Las rutas son configurables y la falta de una fuente *opcional* se informa;
una fuente presente con columnas/llaves incorrectas es un error bloqueante.
"""
from __future__ import annotations

import csv
import math
from collections import defaultdict
from pathlib import Path

from revoto_pipeline.config import Settings
from revoto_pipeline.model.identidad_municipal import load_identities

GRUPOS_EDAD = ('18-24', '25-34', '35-44', '45-59', '60+')
# IDs estables del dominio; NO dependen del arq_id asignado por KMeans.
ARQUETIPOS = {
    'Siempre presente': 'A1',
    'En ascenso': 'A2',
    'Bajando el ritmo': 'A3',
    'De elección grande': 'A4',
    'Montaña rusa': 'A5',
}


def _csv(path: Path, required: set[str]) -> list[dict[str, str]]:
    with path.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f'{path.name}: columnas faltantes: {sorted(missing)}')
        return list(reader)


def _int(value: object, label: str) -> int:
    try:
        val = int(str(value).strip())
    except (ValueError, TypeError) as exc:
        raise ValueError(f'{label} no es entero: {value!r}') from exc
    return val


def _number(value: object, label: str, *, low: float | None = None,
            high: float | None = None) -> float:
    try:
        val = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f'{label} inválido: {value!r}') from exc
    if not math.isfinite(val) or (low is not None and val < low) or (high is not None and val > high):
        raise ValueError(f'{label} fuera de intervalo: {value!r}')
    return val


def _municipal_inegi_five(value: object, label: str) -> str:
    """Convierte únicamente el total municipal ITER de 9 dígitos a CVEGEO 5.

    Una clave no terminada en 0000 identifica otra granularidad y se rechaza.
    """
    code = str(value).strip()
    if len(code) == 9 and code.isascii() and code.isdecimal() and code.endswith('0000'):
        code = code[:5]
    if len(code) != 5 or not code.isascii() or not code.isdecimal():
        raise ValueError(f'{label} no representa un municipio INEGI: {value!r}')
    return code


def municipal_cvegeo(cfg: Settings, states: tuple[int, ...], *,
                     include_years: bool = False, by_year: bool = False):
    """Retiene API previa pero NO consulta mappings INEGI→INE inseguros."""
    identities = load_identities(cfg.path('mapping_municipal_historico'),
                                years=set(cfg.years), states=set(states))
    if not identities:
        raise ValueError(f'Sin mapping municipal histórico verificado para {states}')
    temporal = {key: i.cvegeo for key, i in identities.items()}
    reference_year = max(cfg.years)
    result = temporal if by_year else {
        (ent, mun):i.cvegeo for (year, ent, mun),i in identities.items()
        if year == reference_year}
    if not result:
        raise ValueError(f'Sin mapping municipal validado para {reference_year}')
    years = {(ent,mun,year) for year,ent,mun in temporal}
    return (result, years) if include_years else result


def arquetipos_csv(cfg: Settings, *, missing_ok: bool = True) -> dict[tuple[int,int], dict]:
    path = cfg.path('arquetipos_municipales')
    if not path.is_file():
        if missing_ok:
            return {}
        raise FileNotFoundError(f'Falta arquetipos_municipales.csv: {path}')
    rows = _csv(path, {'edo','mun','arquetipo','nivel','efp','tend','vol','tipicidad','rasgo','cvegeo'})
    result: dict[tuple[int,int], dict] = {}
    for r in rows:
        key = (_int(r['edo'], 'edo arquetipo'), _int(r['mun'], 'mun arquetipo'))
        if key in result:
            raise ValueError(f'Arquetipo municipal duplicado: {key}')
        name = r['arquetipo'].strip()
        if name == 'Historial corto':
            continue  # Sin historial suficiente; nunca adjudicarle A1–A5.
        if name not in ARQUETIPOS:
            raise ValueError(f'Arquetipo no reconocido: {name!r}')
        obj = {'id':ARQUETIPOS[name], 'nombre':name,
               'nivel':round(_number(r['nivel'], 'nivel'), 3),
               'efecto_presidencial':round(_number(r['efp'], 'efp'), 3),
               'tendencia':round(_number(r['tend'], 'tendencia'), 3),
               'volatilidad':round(_number(r['vol'], 'volatilidad', low=0), 3),
               'tipicidad':round(_number(r['tipicidad'], 'tipicidad', low=0, high=1), 3),
               'rasgo':r['rasgo'].strip()}
        if obj['rasgo'] not in {'nivel','efp','tend','vol'}:
            raise ValueError(f'Rasgo arquetípico inválido: {obj["rasgo"]}')
        code = _municipal_inegi_five(r['cvegeo'], 'CVEGEO arquetipo')
        if int(code[:2]) != key[0]:
            raise ValueError(f'CVEGEO arquetipo fuera de entidad para {key}')
        obj['_cvegeo'] = code
        result[key] = obj
    return result


def votos_esperados_csv(cfg: Settings, *, missing_ok: bool = True) -> dict[int, dict[str,float]]:
    """CSV ancho (edo y cinco grupos) o largo (edo,grupo_edad,votos_de_3)."""
    path = cfg.path('votos_esperados')
    if not path.is_file():
        if missing_ok:
            return {}
        raise FileNotFoundError(f'Falta esperado_por_entidad_edad.csv: {path}')
    with path.open(encoding='utf-8-sig',newline='') as stream:
        reader = csv.DictReader(stream)
        cols = set(reader.fieldnames or [])
        data = list(reader)
    if not data or 'edo' not in cols:
        raise ValueError(f'{path.name}: requiere columnas edo y valores de grupos de edad')
    long = {'grupo_edad','votos_de_3'}.issubset(cols)
    if not long and not set(GRUPOS_EDAD).issubset(cols):
        raise ValueError(f'{path.name}: faltan columnas de edad {GRUPOS_EDAD}')
    result: dict[int, dict[str,float]] = defaultdict(dict)
    for r in data:
        edo = _int(r['edo'], 'edo votos esperados')
        if not 1 <= edo <= 32:
            raise ValueError(f'Clave de entidad esperados fuera de rango: {edo}')
        pairs = ((r['grupo_edad'],r['votos_de_3']),) if long else ((g,r[g]) for g in GRUPOS_EDAD)
        for age, val in pairs:
            if age not in GRUPOS_EDAD or age in result[edo]:
                raise ValueError(f'Grupo de edad duplicado/desconocido: {edo}/{age}')
            result[edo][age] = round(_number(val, 'votos_de_3', low=0, high=3), 3)
    for edo, values in result.items():
        if set(values) != set(GRUPOS_EDAD):
            raise ValueError(f'Esperados incompletos para entidad {edo}: {sorted(values)}')
    return dict(result)


def check_analytic_key(archetypes: dict, mapping: dict) -> None:
    for key, archetype in archetypes.items():
        if key not in mapping or archetype['_cvegeo'] != mapping[key]:
            raise ValueError(f'Arquetipo y mapping INEGI no concuerdan: {key}')
