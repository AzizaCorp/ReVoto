"""End-to-end small synthetic triple join, enabled when DuckDB is installed."""
from pathlib import Path
import pytest

duckdb = pytest.importorskip('duckdb')
from revoto_pipeline.config import load_config, CONFIG_FILE
from revoto_pipeline.sql_utils import copy_parquet
from revoto_pipeline.transform.full_context import build_full_context
from revoto_pipeline.transform.inegi import INDICATORS
from revoto_pipeline.export.frontend import export_web
import json


def test_full_context_with_validated_geo_index(tmp_path):
    cfg = load_config(CONFIG_FILE,root=tmp_path)
    mapping = tmp_path/'data'/'mappings'
    mapping.mkdir(parents=True)
    (mapping/'conapo_ine.csv').write_text(
        'clave_conapo,clave_ent_conapo,cve_ent_ine,cve_mpio_ine,anio,status_match\n' +
        ''.join(f'01001,01,1,1,{y},validado\n' for y in cfg.years),encoding='utf-8')
    (mapping/'inegi_ine.csv').write_text(
        'censo_ref,cvegeo_municipal_inegi,anio_eleccion,cve_ent_ine,cve_mpio_ine,status_match\n'+
        ''.join(f'{cfg.reference[y]},010010000,{y},1,1,validado\n' for y in cfg.years),encoding='utf-8')
    con=duckdb.connect(':memory:')
    geo = cfg.path('geo_staging')/'inegi'/'edo=01'/'municipios_index.parquet'
    copy_parquet(con,"SELECT '01001'::VARCHAR AS cvegeo",geo)
    for y in cfg.years:
        dst=cfg.path('processed')/'ine'/'edo=01'/f'anio={y}'/'municipios.parquet'
        copy_parquet(con,f'SELECT {y}::INTEGER AS AELEC, 1::INTEGER AS EDOCVE, '
                         '1::INTEGER AS MPIOCVE, 100::BIGINT AS LN, '
                         '76::BIGINT AS SV, 24::BIGINT AS NV, 0::BIGINT AS NS, '
                         '76.0::DOUBLE AS participacion_pct',dst)
    for year in (2010,2020):
        dst=cfg.path('inegi_staging')/f'censo={year}'/'iter.parquet'
        fields=', '.join(f'123::BIGINT AS "{ind}"' for ind in INDICATORS)
        copy_parquet(con,"SELECT '010010000'::VARCHAR AS cvegeo, "
                        f"'total_municipal'::VARCHAR AS record_level, {fields}",dst)
    all_rows=[]
    for y in cfg.years:
        for sex in (0,1):
            all_rows.append(f"SELECT '01001'::VARCHAR AS clave_municipal_raw, {y}::INTEGER AS anio, "
                            f"{sex}::TINYINT AS sexo_ine, 50::BIGINT AS pob_total_num, "
                            "5::BIGINT AS POB_00_011_num,5::BIGINT AS POB_012_29_num, "
                            "15::BIGINT AS POB_30_59_num,25::BIGINT AS POB_60_mm_num")
    dst=cfg.path('conapo_staging')/'poblacion_anual.parquet'
    copy_parquet(con,' UNION ALL '.join(all_rows),dst)
    con.close()
    report=build_full_context(cfg,1)
    assert len(report)==6
    assert all(r['rows']==1 and r['missing_conapo']==0 and
               r['missing_inegi']==0 and r['municipios_con_geometria']==1
               for r in report.values())
    exported=export_web(cfg,1,integrado=True)
    assert set(exported)==set(cfg.years)
    payload=json.loads((cfg.path('salida')/'integrado'/'edo=01'/'anio=2024'/'municipios.json').read_text())
    assert payload['referencias']['cartografia_distrito_local']==2023
    municipality=payload['municipios'][0]
    assert municipality['cvegeo_municipal_inegi']=='010010000'
    assert municipality['cvegeo_municipal_mapa']=='01001'
    assert municipality['conapo']['poblacion_estimada']==100
    assert municipality['inegi']['indicadores']['pobtot']==123
    assert municipality['geografia']['municipio_geo_disponible']
    assert municipality['ine']['participacion_pct']==76.0
