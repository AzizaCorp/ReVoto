"""Small static JSON outputs: no electoral microdata delivered to the browser."""
from __future__ import annotations
import json
from pathlib import Path
from ..config import Settings, connection, sql_path


def export_web(cfg: Settings, estado: int) -> dict:
    """State/year municipality-level counts and weighted participation."""
    con = connection(cfg)
    exported: dict[int,int] = {}
    try:
        for year in cfg.years:
            parquet = cfg.path('processed')/'ine'/f'edo={estado:02}'/f'anio={year}'/'municipios.parquet'
            if not parquet.exists():
                raise FileNotFoundError(parquet)
            rows = con.execute(f'''SELECT MPIOCVE, LN, SV, NV, NS, participacion_pct
                FROM read_parquet('{sql_path(parquet)}') ORDER BY MPIOCVE''').fetchall()
            payload = {'fuente':'INE conteos censales','estado':f'{estado:02}',
                       'anio':year,'censo_ref':cfg.reference[year],
                       'gap_censo_eleccion':cfg.reference[year]-year,
                       'metodologia':'participacion_pct = 100 * SUM(SV) / SUM(LN)',
                       'municipios':[dict(zip(('municipio','ln','sv','nv','ns','participacion_pct'),r)) for r in rows]}
            dest = cfg.path('salida')/'ine'/f'edo={estado:02}'/f'anio={year}'/'municipios.json'
            dest.parent.mkdir(parents=True,exist_ok=True)
            pending = dest.with_suffix('.pending.json')
            pending.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'),allow_nan=False),encoding='utf-8')
            pending.replace(dest)
            exported[year] = len(rows)
        return exported
    finally:
        con.close()
