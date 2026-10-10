"""Validated municipality-year bridge: NEVER join INE and CONAPO by name."""
from __future__ import annotations
import csv
import os
from pathlib import Path
from ..config import Settings, connection, sql_path
from ..sql_utils import atomic_write

EXPECTED = ('clave_conapo','clave_ent_conapo','cve_ent_ine','cve_mpio_ine','anio','status_match')


def checked_mapping(path: Path) -> list[dict[str,str]]:
    with path.open(encoding='utf-8-sig',newline='') as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ValueError(f'Mapping vacío: {path}; completar solo con correspondencias verificadas.')
    if set(rows[0]) != set(EXPECTED):
        raise ValueError(f'Encabezados de crosswalk requeridos: {EXPECTED}')
    valid = [r for r in rows if r['status_match'].strip().lower() == 'validado']
    if not valid:
        raise ValueError('No hay correspondencias con status_match=validado')
    keys, targets = set(), set()
    for row in valid:
        identity = (row['clave_conapo'].strip(), int(row['anio']))
        target = (int(row['cve_ent_ine']), int(row['cve_mpio_ine']), int(row['anio']))
        if identity in keys or target in targets:
            raise ValueError(f'Crosswalk no uno-a-uno: {row}')
        keys.add(identity); targets.add(target)
    return valid


def build_context(cfg: Settings, estado: int) -> dict:
    """Municipal INE+CONAPO join only for explicitly validated mapping rows."""
    rows = checked_mapping(cfg.path('mapping_conapo_ine'))
    annual = cfg.path('conapo_staging')/'poblacion_anual.parquet'
    if not annual.exists():
        raise FileNotFoundError(annual)
    con = connection(cfg)
    try:
        # Register tiny mapping via VALUES, without Pandas/large cross-source DataFrames.
        vals = ','.join('('+','.join(["'"+r['clave_conapo'].strip().replace("'","''")+"'",
             str(int(r['cve_ent_ine'])), str(int(r['cve_mpio_ine'])), str(int(r['anio']))])+')'
             for r in rows)
        con.execute(f'''CREATE OR REPLACE TEMP VIEW approved_map AS
            SELECT * FROM (VALUES {vals}) AS m(clave_conapo,cve_ent_ine,cve_mpio_ine,anio)''')
        quality: dict = {'estado': f'{estado:02}', 'elections': {}}
        for year in cfg.years:
            ine = cfg.path('processed')/'ine'/f'edo={estado:02}'/f'anio={year}'/'municipios_sexo.parquet'
            if not ine.exists():
                raise FileNotFoundError(ine)
            sql = f'''SELECT i.*, c.pob_total_num AS poblacion_conapo,
                  c.POB_00_011_num AS POB_00_011, c.POB_012_29_num AS POB_012_29,
                  c.POB_30_59_num AS POB_30_59, c.POB_60_mm_num AS POB_60_mm,
                  {year}::INTEGER AS conapo_ref,
                  {cfg.reference[year]}::INTEGER AS censo_ref,
                  {cfg.reference[year]-year}::INTEGER AS gap_censo_eleccion,
                  (c.clave_municipal_raw IS NOT NULL) AS conapo_matched
                FROM read_parquet('{sql_path(ine)}') i
                LEFT JOIN approved_map m ON i.EDOCVE=m.cve_ent_ine
                    AND i.MPIOCVE=m.cve_mpio_ine AND i.AELEC=m.anio
                LEFT JOIN read_parquet('{sql_path(annual)}') c
                    ON c.clave_municipal_raw=m.clave_conapo
                    AND c.anio=i.AELEC AND c.sexo_ine=i.SEXO'''
            dest = cfg.path('processed')/'contexto'/f'edo={estado:02}'/f'anio={year}'/'municipios_sexo.parquet'
            tmp = atomic_write(con, sql, dest)
            n, missing = con.execute(f'''SELECT COUNT(*), COUNT(*) FILTER (WHERE NOT conapo_matched)
                FROM read_parquet('{sql_path(tmp)}')''').fetchone()
            orig = con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(ine)}')").fetchone()[0]
            if n != orig:
                raise ValueError(f'Fanout en unión CONAPO: {n} contra {orig}')
            os.replace(tmp, dest)
            quality['elections'][year] = {'total_rows': n, 'unmatched': missing}
        return quality
    finally:
        con.close()
