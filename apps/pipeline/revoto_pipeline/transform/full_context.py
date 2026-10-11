"""Optional certified municipal context across INE, INEGI and CONAPO.

No individual-level causal inference: all INEGI/CONAPO fields are territorial.
"""
from __future__ import annotations
import csv
import os
from pathlib import Path
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write
from revoto_pipeline.geo.temporal import resolve_reference
from revoto_pipeline.validation.quality import save_report
from revoto_pipeline.transform.context import (CONAPO_REQUIRED_COLUMNS, INEGI_REQUIRED_COLUMNS, checked_mapping)
from revoto_pipeline.transform.inegi import INDICATORS

def _view_values(con, name: str, rows: list[tuple], schema: str) -> None:
    """Create small in-memory crosswalk from validated numeric/string literals."""
    literals = []
    for row in rows:
        parts = ["'"+v.replace("'","''")+"'" if isinstance(v,str) else str(int(v)) for v in row]
        literals.append('('+','.join(parts)+')')
    if not literals:
        raise ValueError(f'Mapping {name} no tiene registros validados')
    con.execute(f'CREATE OR REPLACE TEMP VIEW {name} AS SELECT * FROM '
                f'(VALUES {",".join(literals)}) AS m({schema})')

def validate_mapping_uniqueness(rows: list[dict], columns: tuple[str, ...]) -> None:
    """Reject mappings with duplicate join keys."""
    seen = set()
    for row in rows:
        key = tuple(str(row[col]).strip() for col in columns)
        if key in seen:
            raise ValueError(f"Mapping duplicado para {columns}: {key}")
        seen.add(key)

def build_full_context(cfg: Settings, estado: int) -> dict:
    """Territory-year grain; INEGI municipality totals join only once."""
    map_c = [r for r in checked_mapping(cfg.path('mapping_conapo_ine'), CONAPO_REQUIRED_COLUMNS)
             if r['status_match'] == 'validado']
    map_i = [r for r in checked_mapping(cfg.path('mapping_inegi_ine'), INEGI_REQUIRED_COLUMNS)
             if r['status_match'] == 'validado']
    validate_mapping_uniqueness(map_c, ('cve_ent_ine', 'cve_mpio_ine', 'anio'))
    validate_mapping_uniqueness(map_i, ('cve_ent_ine', 'cve_mpio_ine', 'anio_eleccion', 'censo_ref'))

    conapo = cfg.path('conapo_staging')/'poblacion_anual.parquet'
    if not conapo.exists():
        raise FileNotFoundError(conapo)
    shape_index = (cfg.path('geo_staging') / 'inegi' /
                       f'edo={estado:02}' / 'municipios_index.parquet')
    con = connection(cfg)
    results: dict[int, dict] = {}
    try:
        _view_values(con,'mc',[(r['clave_conapo'].strip(),int(r['cve_ent_ine']),int(r['cve_mpio_ine']),int(r['anio'])) for r in map_c],
                     'clave_conapo,edo,municipio,anio')
        _view_values(con,'mi',[(r['cvegeo_municipal_inegi'].strip(),int(r['censo_ref']),int(r['anio_eleccion']),
                                int(r['cve_ent_ine']),int(r['cve_mpio_ine'])) for r in map_i],
                     'cvegeo,censo,anio,edo,municipio')
        if shape_index.exists():
            geo_join = f"LEFT JOIN read_parquet('{sql_path(shape_index)}') g ON g.cvegeo=SUBSTR(z.cvegeo,1,5)"
            geo_matched = '(g.cvegeo IS NOT NULL)'
            marco_expr = f"{int(cfg.geo['inegi_marco_anio'])}"
        else:
            geo_join = ''
            geo_matched = 'FALSE'
            marco_expr = 'NULL::INTEGER'
            
        for year in cfg.years:
            refs = resolve_reference(cfg, year)
            census_year = refs.censo_ref
            municipality = cfg.path('processed') / 'ine' / f'edo={estado:02}' / f'anio={year}' / 'municipios.parquet'
            census = cfg.path('inegi_staging') / f'censo={census_year}' / 'iter.parquet'
            for required in (municipality, census):
                if not required.exists():
                    raise FileNotFoundError(f'Falta INE o INEGI: {required}')
            measures = ',\n'.join(f'x."{m}" AS inegi_{m.lower()}' for m in INDICATORS)
            sql = f'''WITH projected AS (
                SELECT m.edo, m.municipio, m.anio, m.clave_conapo,
                    SUM(cn.pob_total_num) AS pob_estimada,
                    SUM(cn.POB_00_011_num) AS pob_00_011,
                    SUM(cn.POB_012_29_num) AS pob_012_29,
                    SUM(cn.POB_30_59_num) AS pob_30_59,
                    SUM(cn.POB_60_mm_num) AS pob_60_mm,
                    COUNT(*) AS source_rows,
                    COUNT(*) FILTER (WHERE cn.sexo_ine = 0) AS male_rows,
                    COUNT(*) FILTER (WHERE cn.sexo_ine = 1) AS female_rows,
                    COUNT(*) AS source_rows,
                    COUNT(*) FILTER (WHERE cn.sexo_ine = 0) AS male_rows,
                    COUNT(*) FILTER (WHERE cn.sexo_ine = 1) AS female_rows,
                    COUNT(DISTINCT cn.sexo_ine) AS sex_count,
                    COUNT(cn.pob_total_num) AS valid_population_rows
                FROM mc m
                JOIN read_parquet('{sql_path(conapo)}') cn
                    ON TRY_CAST(cn.clave_municipal_raw AS INTEGER) =
                        TRY_CAST(m.clave_conapo AS INTEGER)
                    AND cn.anio = m.anio
                    AND cn.sexo_ine IN (0, 1)
                    WHERE m.edo={estado} AND m.anio={year}
                    GROUP BY m.edo, m.municipio, m.anio, m.clave_conapo
                )
                SELECT i.*, z.cvegeo AS cvegeo_municipal_inegi,
                SUBSTR(z.cvegeo,1,5) AS cvegeo_municipal_mapa,
                    CASE
                        WHEN p.sex_count = 2
                        AND p.source_rows = 2
                        AND p.male_rows = 1
                        AND p.female_rows = 1
                        AND p.valid_population_rows = 2
                        THEN p.pob_estimada
                        ELSE NULL
                    END AS poblacion_conapo,
                    CASE WHEN p.sex_count=2 THEN p.pob_00_011 ELSE NULL END AS conapo_pob_00_011,
                    CASE WHEN p.sex_count=2 THEN p.pob_012_29 ELSE NULL END AS conapo_pob_012_29,
                    CASE WHEN p.sex_count=2 THEN p.pob_30_59 ELSE NULL END AS conapo_pob_30_59,
                    CASE WHEN p.sex_count=2 THEN p.pob_60_mm ELSE NULL END AS conapo_pob_60_mm,
                    {year}::INTEGER AS conapo_ref,
                    {census_year}::INTEGER AS censo_ref,
                    {census_year - year}::INTEGER AS gap_censo_eleccion,
                    {refs.anio_cartografia}::INTEGER AS anio_cartografia_distrito_ref,
                    {str(refs.referencia_territorial_historica).upper()}::BOOLEAN AS referencia_retroactiva,
                    FALSE::BOOLEAN AS equivalencia_secciones_historicas_verificada,
                    COALESCE(
                        p.sex_count = 2
                        AND p.source_rows = 2
                        AND p.male_rows = 1
                        AND p.female_rows = 1
                        AND p.valid_population_rows = 2,
                        FALSE
                    ) AS conapo_matched,
                    (x.cvegeo IS NOT NULL) AS inegi_matched,
                    {geo_matched} AS geometria_municipal_disponible,
                    {marco_expr} AS anio_marco_inegi,
                    {measures}
                FROM read_parquet('{sql_path(municipality)}') i
                LEFT JOIN projected p ON i.EDOCVE=p.edo AND i.MPIOCVE=p.municipio AND i.AELEC=p.anio
                LEFT JOIN mi z ON z.edo=i.EDOCVE AND z.municipio=i.MPIOCVE
                    AND z.anio=i.AELEC AND z.censo={census_year}
                LEFT JOIN read_parquet('{sql_path(census)}') x
                    ON x.cvegeo=z.cvegeo AND x.record_level='total_municipal' 
                {geo_join}'''
            dest = cfg.path('processed') / 'full_context' / f'edo={estado:02}' / f'anio={year}' / 'municipios.parquet'
            tmp = atomic_write(con, sql, dest)
            n, absent_c, absent_i, geom = con.execute(f'''SELECT COUNT(*),
                COUNT(*) FILTER (WHERE NOT conapo_matched),
                COUNT(*) FILTER (WHERE NOT inegi_matched),
                COUNT(*) FILTER (WHERE geometria_municipal_disponible)
                FROM read_parquet('{sql_path(tmp)}')''').fetchone()
            before = con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(municipality)}')").fetchone()[0]
            if n != before:
                tmp.unlink(missing_ok = True)
                raise ValueError(f'Join INEGI/CONAPO produjo fanout: {n} != {before}, año {year}')
            os.replace(tmp,dest)
            results[year] = {'rows':n, 'missing_conapo':absent_c, 'missing_inegi':absent_i,
                             'municipios_con_geometria':geom, 'anio_cartografia_referencia':refs.anio_cartografia}
        save_report(cfg.path('reportes')/'full_context'/f'edo={estado:02}.json',results)
        return results
    finally:
        con.close()
