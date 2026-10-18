"""Derivados electorales L3: arquetipos municipales y votos esperados por edad.

Se usa el modelo de centroides VALIDADO que acompañó al análisis original;
una corrida ordinaria infiere perfiles nuevos pero NO reentrena ni renumera K-means.
Fuentes: marts electorales agregados. Ningún identificador se adivina.
"""
from __future__ import annotations

import csv
import json
import math
import os
from pathlib import Path

import numpy as np

from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.model.publicacion_l4 import ARQUETIPOS, GRUPOS_EDAD, municipal_cvegeo

_PRESIDENCIALES = frozenset((2012, 2018, 2024))
_ESPERADOS = (2018, 2021, 2024)
_CAMPOS = ('nivel', 'efp', 'tend', 'vol')


def _mart(cfg: Settings, grano: str, edo: int, anio: int) -> Path:
    return cfg.path('processed') / 'marts' / grano / f'edo={edo:02}' / f'anio={anio}' / 'datos.parquet'


def _write_csv(path: Path, headers: list[str], rows: list[dict]) -> None:
    """Promueve el archivo por rename solo cuando los datos están completos."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix('.pending.csv')
    try:
        with tmp.open('w', newline='', encoding='utf-8-sig') as fh:
            writer = csv.DictWriter(fh, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def _model(path: Path) -> dict:
    if not path.is_file():
        raise FileNotFoundError(f'Falta modelo versionado de arquetipos: {path}')
    model = json.loads(path.read_text(encoding='utf-8'))
    if tuple(model.get('variables', [])) != _CAMPOS:
        raise ValueError('Modelo incompatible: variables o secuencia no coinciden con la metodología')
    if not isinstance(model.get('nombres'), list) or len(model['nombres']) != 5 or set(model['nombres']) != set(ARQUETIPOS):
        raise ValueError('El modelo debe tener exactamente los cinco nombres reconocidos por L4')
    for k, shape in (('clip_lo', (4,)), ('clip_hi', (4,)), ('media', (4,)),
                     ('escala', (4,)), ('centroides_z', (5, 4))):
        array = np.asarray(model[k], dtype=float)
        if array.shape != shape or not np.all(np.isfinite(array)):
            raise ValueError(f'Modelo arquetípico inválido: {k}')
    if any(x <= 0 for x in model['escala']):
        raise ValueError('Escala cero/negativa del modelo')
    return model


def _features(rows: list[tuple]) -> dict:
    """Mismos estimadores del script exploratorio feat.py, sin el CSV temporal.

    Tendencia: regresión rel ~ constante + ((año-2016.5)/7.5) + presidencial,
    convertida a puntos porcentuales por década. Volatilidad: std residual
    con ddof igual al número de parámetros (como en feat.py).
    """
    values = sorted(rows, key=lambda r: r[0])
    years = np.array([int(r[0]) for r in values], dtype=float)
    rel = np.array([float(r[1]) for r in values], dtype=float)
    pres = np.isin(years, list(_PRESIDENCIALES)).astype(float)
    n = len(years)
    if n < 5 or len(set(years)) != n or not np.any(pres) or np.all(pres):
        return {}
    t = (years - 2016.5) / 7.5
    X = np.column_stack((np.ones(n), t, pres))
    beta = np.linalg.lstsq(X, rel, rcond=None)[0]
    residual = rel - X @ beta
    result = {
        'nivel': float(rel.mean()),
        'efp': float(rel[pres == 1].mean() - rel[pres == 0].mean()),
        'tend': float(beta[1] * 10 / 7.5),
        'vol': float(np.std(residual, ddof=X.shape[1])),
    }
    return result if all(math.isfinite(x) for x in result.values()) else {}


def _predict(features: dict, model: dict) -> dict:
    values = np.asarray([features[k] for k in _CAMPOS], dtype=float)
    clipped = np.clip(values, model['clip_lo'], model['clip_hi'])
    z = (clipped - model['media']) / model['escala']
    centers = np.asarray(model['centroides_z'], dtype=float)
    distances = np.linalg.norm(centers - z, axis=1)
    idx = int(np.argmin(distances))
    nombre = model['nombres'][idx]
    return {
        'arquetipo': nombre, 'arq_id': idx, 'nivel': round(features['nivel'], 3),
        'efp': round(features['efp'], 3), 'tend': round(features['tend'], 3),
        'vol': round(features['vol'], 3),
        'tipicidad': round(1 / (1 + float(distances[idx])), 3),
        'rasgo': _CAMPOS[int(np.argmax(abs(z)))],
    }


def build_arquetipos(cfg: Settings) -> dict:
    """Calcula arquetipos con cobertura nacional completa 32 × seis elecciones.

    Requiere mappings revisados y el modelo entregado; genera el CSV que L4
    consume de forma directa. Nunca usa el índice k-means como ID del dominio.
    """
    if cfg.umbral_rn05 is None:
        raise ValueError('Definir umbral RN-05 antes de calcular arquetipos')
    estados = tuple(range(1, 33))
    paths = [_mart(cfg, 'municipio', edo, anio) for anio in cfg.years for edo in estados]
    missing = [p for p in paths if not p.is_file()]
    if missing or set(cfg.years) != {2009, 2012, 2015, 2018, 2021, 2024}:
        raise FileNotFoundError(f'Los arquetipos requieren los seis años y los 32 estados; faltantes: {missing[:4]}')
    modelo = _model(Path(__file__).resolve().parents[2] / 'docs' / 'arquetipos' / 'modelo_arquetipos.json')
    mapping, years = municipal_cvegeo(cfg, estados, include_years=True, by_year=True)
    con = connection(cfg)
    try:
        sources = ','.join("'" + sql_path(p) + "'" for p in paths)
        data = con.execute(f'''SELECT AELEC, EDOCVE, MPIOCVE, LN, SV, NS
            FROM read_parquet([{sources}], union_by_name=true, hive_partitioning=false)''').fetchall()
    finally:
        con.close()
    seen = set()
    nasional: dict[int, dict[str, float]] = {}
    grouped: dict[str, list[tuple[int, float]]] = {}
    counts = {a: {'ln': 0, 'sv': 0, 'ns': 0, 'states': set()} for a in cfg.years}
    for y, edo, mun, ln, sv, ns in data:
        key = int(edo), int(mun)
        row_key = (*key, int(y))
        if row_key in seen:
            raise ValueError(f'Mart municipal duplicado {row_key}')
        seen.add(row_key)
        if ln is None or sv is None or ns is None or ln < 0 or ns < 0 or not 0 <= sv <= ln - ns:
            raise ValueError(f'Conteos electorales inválidos {row_key}')
        stat = counts[int(y)]
        stat['states'].add(int(edo))
        stat['ln'] += ln; stat['sv'] += sv; stat['ns'] += ns
    for year, st in counts.items():
        if st['states'] != set(estados) or st['ln'] <= st['ns']:
            raise ValueError(f'Referencia nacional incompleta o inválida para {year}')
        nasional[year] = 100 * st['sv'] / (st['ln'] - st['ns'])
    for y, edo, mun, ln, sv, ns in data:
        key = (int(edo), int(mun))
        if ln < cfg.umbral_rn05 or ln <= ns:
            continue
        code = mapping.get((int(y), *key))
        if code is None:
            
            raise ValueError(f'Arquetipo: falta equivalencia municipal verificada para '
                             f'(año, entidad, MPIOCVE)=({y},{edo},{mun})')
        grouped.setdefault(code, []).append((int(y), 100 * sv / (ln - ns) - nasional[int(y)]))
    ref_year = max(cfg.years)
    reference = {code: (ent, mun) for (year, ent, mun), code in mapping.items()
                 if year == ref_year}
    rows = []
    ineligible = 0
    without_reference = 0
    for code, history in sorted(grouped.items()):
        features = _features(history)
        if not features:
            ineligible += 1
            continue
        if code not in reference:
            without_reference += 1
            continue
        edo, mun = reference[code]
        rows.append({'edo': edo, 'mun': mun, 'cvegeo': code,
                     **_predict(features, modelo)})
    columns = ['edo', 'mun', 'cvegeo', 'arquetipo', 'arq_id',
               'nivel', 'efp', 'tend', 'vol', 'tipicidad', 'rasgo']
    _write_csv(cfg.path('arquetipos_municipales'), columns, rows)
    return {'arquetipos_calculados': len(rows), 'municipios_historial_insuficiente': ineligible,
            'municipios_sin_clave_referencia': without_reference,
            'fuente_modelo': str(Path(__file__).resolve().parents[2] / 'docs/arquetipos/modelo_arquetipos.json'),
            'output': str(cfg.path('arquetipos_municipales'))}


def build_votos_esperados(cfg: Settings) -> dict:
    """E[Votos en 3 elecciones] = p_2018 + p_2021 + p_2024, por edad.

    Se omiten las entidades cuya serie de cinco grupos no sea publicable.
    """
    if cfg.umbral_rn05 is None:
        raise ValueError('Definir RN-05 para calcular votos esperados')
    files = [_mart(cfg, 'grupo_edad', edo, y) for edo in range(1, 33) for y in _ESPERADOS]
    missing = [path for path in files if not path.is_file()]
    if missing:
        raise FileNotFoundError(f'Faltan marts entidad × edad para votos esperados: {missing[:4]}')
    con = connection(cfg)
    try:
        paths = ','.join("'" + sql_path(p) + "'" for p in files)
        data = con.execute(f'''SELECT AELEC, EDOCVE, grupo_edad, LN, SV, NS
          FROM read_parquet([{paths}], union_by_name=true, hive_partitioning=false)''').fetchall()
    finally:
        con.close()
    by_key: dict[tuple[int, str], dict[int, float]] = {}
    for y, edo, group, ln, sv, ns in data:
        if group not in GRUPOS_EDAD:
            continue
        if ln is None or sv is None or ns is None or ln < cfg.umbral_rn05 or ln <= ns:
            continue
        p = sv / (ln - ns)
        if not 0 <= p <= 1:
            raise ValueError(f'Participación fuera de rango: {edo}/{y}/{group}')
        year_rates = by_key.setdefault((int(edo), str(group)), {})
        if int(y) in year_rates:
            raise ValueError(f'Duplicado entidad × edad × año: {edo}/{group}/{y}')
        year_rates[int(y)] = p
    output = []
    incomplete = []
    for edo in range(1, 33):
        values = {age: by_key.get((edo, age), {}) for age in GRUPOS_EDAD}
        if any(set(years) != set(_ESPERADOS) for years in values.values()):
            incomplete.append(edo)
            continue
        output.append({'edo': edo, **{age: round(sum(values[age].values()), 3) for age in GRUPOS_EDAD}})
    _write_csv(cfg.path('votos_esperados'), ['edo', *GRUPOS_EDAD], output)
    return {'entidades_completas': len(output), 'entidades_no_publicables': incomplete,
            'output': str(cfg.path('votos_esperados'))}
