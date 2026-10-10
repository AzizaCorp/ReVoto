"""Quality gates: failing counts are separate from non-blocking alerts."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any
from revoto_pipeline.config import sql_path


def ine_quality(con, parquet: Path, year: int, estado: int) -> dict[str, Any]:
    """All metrics come from SQL aggregation: no full-result materialization."""
    q = f"read_parquet('{sql_path(parquet)}')"
    metrics = {
        'rows': 'COUNT(*)',
        'wrong_year': f'COUNT(*) FILTER (WHERE AELEC IS NULL OR AELEC <> {year})',
        'wrong_state': f'COUNT(*) FILTER (WHERE EDOCVE IS NULL OR EDOCVE <> {estado})',
        'bad_key': 'COUNT(*) FILTER (WHERE MPIOCVE IS NULL OR SECCION IS NULL OR EDAD IS NULL OR FELECCION IS NULL)',
        'bad_counts': 'COUNT(*) FILTER (WHERE LN IS NULL OR SV IS NULL OR NV IS NULL OR NS IS NULL OR LN<0 OR SV<0 OR NV<0 OR NS<0)',
        'mismatch_ln': 'COUNT(*) FILTER (WHERE LN IS NOT NULL AND SV IS NOT NULL AND NV IS NOT NULL AND NS IS NOT NULL AND LN <> SV+NV+NS)',
        'unexpected_sex': 'COUNT(*) FILTER (WHERE SEXO IS NULL OR SEXO NOT IN (0,1))',
        'missing_def': 'COUNT(*) FILTER (WHERE missing_def)',
        'missing_del': 'COUNT(*) FILTER (WHERE missing_del)',
        'invalid_def_token': 'COUNT(*) FILTER (WHERE invalid_def_token)',
        'invalid_del_token': 'COUNT(*) FILTER (WHERE invalid_del_token)',
    }
    data = con.execute('SELECT '+ ', '.join(f'{expr} AS {key}' for key,expr in metrics.items()) + f' FROM {q}').fetchone()
    return dict(zip(metrics, data))


def assert_ine_quality(quality: dict) -> None:
    for key in ('rows', 'wrong_year', 'wrong_state', 'bad_key', 'bad_counts'):
        if (key == 'rows' and quality[key] <= 0) or (key != 'rows' and quality[key] > 0):
            raise ValueError(f'Falla validación INE: {key} = {quality[key]}')


def save_report(file: Path, payload: dict) -> None:
    file.parent.mkdir(parents = True, exist_ok = True)
    pending = file.with_suffix('.pending.json')
    pending.write_text(json.dumps(payload, indent = 2, ensure_ascii = False, default = str), encoding = 'utf-8')
    pending.replace(file)
