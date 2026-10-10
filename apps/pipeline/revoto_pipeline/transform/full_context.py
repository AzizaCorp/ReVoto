"""Optional certified municipal context across INE, INEGI and CONAPO.

No individual-level causal inference: all INEGI/CONAPO fields are territorial.
"""
from __future__ import annotations
import csv
import os
from pathlib import Path
from ..config import Settings, connection, sql_path
from ..sql_utils import atomic_write
from .context import checked_mapping
from .inegi import INDICATORS

MAPPING_FIELDS = {'censo_ref', 'cvegeo_municipal_inegi', 'anio_eleccion',
                  'cve_ent_ine', 'cve_mpio_ine', 'status_match'}


def checked_inegi_mapping(path: Path) -> list[dict[str,str]]:
    with path.open(encoding = 'utf-8-sig', newline = '') as src:
        reader = csv.DictReader(src)
        if set(reader.fieldnames or []) != MAPPING_FIELDS:
            raise ValueError(f'Crosswalk INEGI requiere {sorted(MAPPING_FIELDS)}')
        raw = list(reader)
    rows = [r for r in raw if r['status_match'].strip().lower() == 'validado']
    if not rows:
        raise ValueError('INEGI mapping sin correspondencias validadas')
    source, target = set(),set()
    for r in rows:
        key=(int(r['censo_ref']),r['cvegeo_municipal_inegi'].strip(),int(r['anio_eleccion']))
        end=(int(r['censo_ref']),int(r['cve_ent_ine']),int(r['cve_mpio_ine']),int(r['anio_eleccion']))
        if key in source or end in target or not key[1].endswith('0000'):
            raise ValueError(f'Mapping INEGI ambiguo/no municipal: {r}')
        source.add(key);target.add(end)
    return rows


def _view_values(con, name: str, rows: list[tuple], schema: str) -> None:
    """Create small in-memory crosswalk from validated numeric/string literals."""
    literals = []
    for row in rows:
        parts = ["'"+v.replace("'","''")+"'" if isinstance(v,str) else str(int(v)) for v in row]
        literals.append('('+','.join(parts)+')')
    con.execute(f'CREATE OR REPLACE TEMP VIEW {name} AS SELECT * FROM '
                f'(VALUES {",".join(literals)}) AS m({schema})')


def build_full_context(cfg: Settings, estado: int) -> dict:
    """Territory-year grain; INEGI municipality totals join only once."""
    map_c = checked_mapping(cfg.path('mapping_conapo_ine'))
    map_i = checked_inegi_mapping(cfg.root/'data'/'mappings'/'inegi_ine.csv')
    conapo = cfg.path('conapo_staging')/'poblacion_anual.parquet'
    if not conapo.exists():
        raise FileNotFoundError(conapo)
    con = connection(cfg)
    try:
        _view_values(con,'mc',[(r['clave_conapo'].strip(),int(r['cve_ent_ine']),int(r['cve_mpio_ine']),int(r['anio'])) for r in map_c],
                     'clave_conapo,edo,municipio,anio')
        _view_values(con,'mi',[(r['cvegeo_municipal_inegi'].strip(),int(r['censo_ref']),int(r['anio_eleccion']),
                                int(r['cve_ent_ine']),int(r['cve_mpio_ine'])) for r in map_i],
                     'cvegeo,censo,anio,edo,municipio')
        results = {}
        for year in cfg.years:
            ref = cfg.reference[year]
            municipality = cfg.path('processed')/'ine'/f'edo={estado:02}'/f'anio={year}'/'municipios.parquet'
            census = cfg.path('inegi_staging')/f'censo={ref}'/'iter.parquet'
            if not municipality.exists() or not census.exists():
                raise FileNotFoundError(f'Falta INE o INEGI: {municipality} / {census}')
            measures = ',\n'.join(f'x."{m}" AS inegi_{m.lower()}' for m in INDICATORS)
            sql = f'''WITH projected AS (
                 SELECT m.edo,m.municipio,m.anio,m.clave_conapo,
                  SUM(cn.pob_total_num) AS pob_estimada,
                  COUNT(DISTINCT cn.sexo_ine) AS sex_count
                 FROM mc m JOIN read_parquet('{sql_path(conapo)}') cn
                   ON cn.clave_municipal_raw=m.clave_conapo AND cn.anio=m.anio
                 WHERE m.edo={estado} AND m.anio={year}
                 GROUP BY m.edo,m.municipio,m.anio,m.clave_conapo
               )
               SELECT i.*, CASE WHEN p.sex_count=2 THEN p.pob_estimada ELSE NULL END
                   AS poblacion_conapo, {year}::INTEGER AS conapo_ref,
                   {ref}::INTEGER AS censo_ref,
                   {ref-year}::INTEGER AS gap_censo_eleccion,
                   (p.sex_count=2) AS conapo_matched,
                   (x.cvegeo IS NOT NULL) AS inegi_matched,
                   {measures}
               FROM read_parquet('{sql_path(municipality)}') i
               LEFT JOIN projected p ON i.EDOCVE=p.edo AND i.MPIOCVE=p.municipio AND i.AELEC=p.anio
               LEFT JOIN mi z ON z.edo=i.EDOCVE AND z.municipio=i.MPIOCVE
                   AND z.anio=i.AELEC AND z.censo={ref}
               LEFT JOIN read_parquet('{sql_path(census)}') x
                   ON x.cvegeo=z.cvegeo AND x.record_level='total_municipal' '''
            dest = cfg.path('processed')/'full_context'/f'edo={estado:02}'/f'anio={year}'/'municipios.parquet'
            tmp = atomic_write(con,sql,dest)
            n, absent_c, absent_i = con.execute(f'''SELECT COUNT(*),
                COUNT(*) FILTER (WHERE NOT COALESCE(conapo_matched,FALSE)),
                COUNT(*) FILTER (WHERE NOT COALESCE(inegi_matched,FALSE))
                FROM read_parquet('{sql_path(tmp)}')''').fetchone()
            before = con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(municipality)}')").fetchone()[0]
            if n != before:
                raise ValueError(f'Join INEGI/CONAPO produjo fanout: {n} != {before}')
            os.replace(tmp,dest)
            results[year] = {'rows':n, 'missing_conapo':absent_c, 'missing_inegi':absent_i}
        return results
    finally:
        con.close()
