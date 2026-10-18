"""Immutable-grain INE facts from the already typed staging Parquet."""
from __future__ import annotations
import os
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write

FIELDS = ('AELEC','EDOCVE','EDONOM','MPIOCVE','MPIONOM','SECCION','TIPOSEC','DEF','DEL',
          'SEXO','EDAD','FELECCION','LN','SV','NV','NS','source_year','source_file',
          'missing_def','missing_del','invalid_def_token','invalid_del_token')


def build_canonical(cfg: Settings, estado: int) -> dict[int, int]:
    """Copy the original observational grain; do not collapse sex/age/section."""
    con = connection(cfg)
    results = {}
    try:
        for year in cfg.years:
            source = cfg.path('ine_staging') / f'edo={estado:02}' / f'anio={year}' / 'conteos.parquet'
            if not source.is_file():
                raise FileNotFoundError(source)
            src = f"read_parquet('{sql_path(source)}')"
            columns = {r[0] for r in con.execute(f'DESCRIBE SELECT * FROM {src}').fetchall()}
            missing = set(FIELDS) - columns
            if missing:
                raise ValueError(f'Staging INE incompleto: {sorted(missing)}')
            cols = ', '.join(f'"{c}"' for c in FIELDS)
            sql = f'SELECT {cols} FROM {src}'
            dest = cfg.path('processed') / 'canonical' / 'hecho_participacion' / f'edo={estado:02}' / f'anio={year}' / 'hechos.parquet'
            tmp = atomic_write(con,sql,dest)
            src_n = con.execute(f'SELECT COUNT(*) FROM {src}').fetchone()[0]
            out_n = con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(tmp)}')").fetchone()[0]
            if src_n != out_n:
                tmp.unlink(missing_ok=True)
                raise ValueError(f'Pérdida de observaciones: {src_n} → {out_n}')
            os.replace(tmp,dest)
            results[year]=out_n
        return results
    finally:
        con.close()
