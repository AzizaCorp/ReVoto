"""Stage selected ITER variables with explicit data-availability reporting."""
from __future__ import annotations
import os
from config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write
from revoto_pipeline.transform.inegi import (INDICATORS, IDENTITY, find_sex_pairs,
                               selected_indicators, inegi_select, sex_long_select)
from revoto_pipeline.validation.schemas import check_header, ITER_REQUIRED
from revoto_pipeline.validation.quality import save_report
from revoto_pipeline.validation.summary_polars import inegi_suppression_counts


def build_inegi(cfg: Settings, census: int) -> dict:
    folder = cfg.path('inegi_raw') / str(census)
    matches = sorted(folder.glob('*.csv'))
    if len(matches) != 1:
        raise FileNotFoundError(f'Se requiere exactamente un ITER CSV en {folder}; hay {len(matches)}')
    source = matches[0]
    columns = check_header(source, ITER_REQUIRED, encoding = cfg.encoding)
    pairs = find_sex_pairs(columns)
    out = cfg.path('inegi_staging') / f'censo={census}' / 'iter.parquet'
    long_out = cfg.path('inegi_staging') / f'censo={census}' / 'sexo_indicadores.parquet'
    con = connection(cfg)
    try:
        tmp = atomic_write(con, inegi_select(source, census, columns), out)
        levels = con.execute(f'''SELECT record_level, COUNT(*)
            FROM read_parquet('{sql_path(tmp)}') GROUP BY 1 ORDER BY 1''').fetchall()
        bad_keys = con.execute(f'''SELECT COUNT(*) FROM read_parquet('{sql_path(tmp)}')
            WHERE ENTIDAD IS NULL OR MUN IS NULL OR LOC IS NULL''').fetchone()[0]
        distinct_keys = con.execute(f'''SELECT COUNT(DISTINCT cvegeo)
            FROM read_parquet('{sql_path(tmp)}')''').fetchone()[0]
        total_rows = sum(count for _, count in levels)
        if distinct_keys != total_rows:
            raise ValueError(f'ITER: duplicados en clave geográfica: {total_rows} vs {distinct_keys}')
        if bad_keys:
            raise ValueError(f'ITER: {bad_keys} claves geográficas incompletas')
        os.replace(tmp, out)
        long_tmp = atomic_write(con, sex_long_select(out, pairs), long_out)
        os.replace(long_tmp, long_out)
        available = set(columns)
        report = {'censo': census, 'source': source.name, 'levels': dict(levels),
                  'suppression_selected': inegi_suppression_counts(out, selected_indicators(columns)),
                  'present_indicators': [c for c in selected_indicators(columns) if c in available],
                  'missing_indicators': [c for c in INDICATORS if c not in available],
                  'sex_pairs_observed': pairs,
                  'nota': 'Variables no publicadas no se estiman; * queda NULL con flag.'}
        save_report(cfg.path('reportes') / 'inegi' / f'censo={census}.json', report)
        return report
    finally:
        con.close()
