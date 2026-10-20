"""Regression integration: fictitious evidence and population, never INE official data."""
from __future__ import annotations
from dataclasses import replace

import pytest

duckdb = pytest.importorskip('duckdb')

from revoto_pipeline.config import CONFIG_FILE, load_config, sql_path
from revoto_pipeline.sql_utils import copy_parquet
from revoto_pipeline.model.municipal_context import build_municipal_context
from revoto_pipeline.model.marts import aggregation_sql
from tests.test_identidad_municipal_historica import write_mapping, sample_rows


def test_context_joins_to_stable_identity_in_both_sources(tmp_path):
    """2018 07-121 must be 07123; 2021 07-121 must be 07121."""
    cfg = load_config(CONFIG_FILE, tmp_path)
    cfg = replace(cfg, years=(2018,2021), reference={2018:2020,2021:2020},
                  district_reference={2018:2021,2021:2021})
    write_mapping(cfg.path('mapping_municipal_historico'),
                  [r for r in sample_rows() if r['anio_eleccion'] in (2018,2021)])
    conn = duckdb.connect(':memory:')
    try:
        for year, pairs in ((2018,[(121,1200,700),(122,800,300)]),
                            (2021,[(121,1300,650),(123,1400,800)])):
            table = ' UNION ALL '.join(
                f'SELECT {year}::INTEGER AELEC,7::INTEGER EDOCVE,'
                f'{mun}::INTEGER MPIOCVE,{ln}::BIGINT LN,{sv}::BIGINT SV,'
                f'{ln-sv}::BIGINT NV,0::BIGINT NS'
                for mun,ln,sv in pairs)
            copy_parquet(conn,table,
                cfg.path('processed')/'marts'/'municipio'/f'edo=07'/f'anio={year}'/'datos.parquet')
        census = cfg.path('inegi_staging')/'censo=2020'/'iter.parquet'
        copy_parquet(conn,"""SELECT '071210000' cvegeo, 'total_municipal' record_level,
            200::BIGINT POBTOT UNION ALL SELECT '071230000','total_municipal',300""",census)
        conapo = cfg.path('conapo_staging')/'poblacion_anual.parquet'
        copy_parquet(conn,"""SELECT * FROM (VALUES
            ('07121',2018,0,60),('07121',2018,1,60),
            ('07123',2018,0,200),('07123',2018,1,200),
            ('07121',2021,0,65),('07121',2021,1,65),
            ('07123',2021,0,215),('07123',2021,1,215)
            ) t(clave_municipal_raw,anio,sexo_ine,pob_total_num)""",conapo)
        report = build_municipal_context(cfg,7)
        assert report[2018]['rows'] == report[2021]['rows'] == 2
        for year,historic,expected_geo,expected_inegi,expected_conapo in (
            (2018,121,'07123',300,400),
            (2018,122,'07121',200,120),
            (2021,121,'07121',200,130),
            (2021,123,'07123',300,430),
        ):
            dest = cfg.path('processed')/'full_context'/f'edo=07'/f'anio={year}'/'municipios.parquet'
            actual = conn.execute(f'''SELECT cvegeo_canonico,inegi_pobtot,poblacion_conapo,
                MPIOCVE FROM read_parquet('{sql_path(dest)}') WHERE MPIOCVE={historic}''').fetchone()
            assert actual == (expected_geo,expected_inegi,expected_conapo,historic)
    finally:
        conn.close()


def test_context_missing_verification_fails_before_writing(tmp_path):
    cfg = load_config(CONFIG_FILE,tmp_path)
    cfg = replace(cfg,years=(2018,),reference={2018:2020},district_reference={2018:2021},
                  integration=replace(cfg.integration,incluir_inegi=False,incluir_conapo=False))
    mapping = sample_rows()
    mapping[0].update(cvegeo_canonico='',nombre_canonico='',
                      equivalencia_verificada='no',tipo_equivalencia='ambigua_no_verificada')
    write_mapping(cfg.path('mapping_municipal_historico'),mapping)
    con=duckdb.connect(':memory:')
    try:
        target=cfg.path('processed')/'marts'/'municipio'/'edo=07'/'anio=2018'/'datos.parquet'
        copy_parquet(con,'''SELECT 2018 AELEC,7 EDOCVE,121 MPIOCVE,
            100::BIGINT LN,45::BIGINT SV,55::BIGINT NV,0::BIGINT NS''',target)
        with pytest.raises(ValueError,match='no verificadas'):
            build_municipal_context(cfg,7)
        assert not (cfg.path('processed')/'full_context'/'edo=07'/'anio=2018'/'municipios.parquet').exists()
    finally:
        con.close()


def test_duckdb_mart_preserves_undefined_rate(tmp_path):
    con=duckdb.connect(':memory:')
    try:
        result = con.execute(aggregation_sql('''(SELECT * FROM (VALUES
            (2009,7,55,4026,0,0,4026),
            (2012,7,55,100,50,50,0)
            ) t(AELEC,EDOCVE,MPIOCVE,LN,SV,NV,NS))''',
            ('AELEC','EDOCVE','MPIOCVE'),rn05=50)).fetchall()
        rows = sorted(result)
        assert rows[0][-2:] == (None,'rate_undefined')
        assert rows[1][-2:] == (50.0,'available')
    finally:
        con.close()


def test_sql_dim_municipio_is_historic_by_election():
    """La misma clave 07-121 no debe colapsar Mezcalapa y El Parral."""
    from pathlib import Path
    schema = Path(__file__).resolve().parents[1]/'revoto_pipeline'/'sql'/'70_modelo_dimensional.sql'
    conn=duckdb.connect(':memory:')
    try:
        conn.execute('CREATE SCHEMA analytics')
        conn.execute('''CREATE VIEW analytics.hecho_participacion AS
            SELECT * FROM (VALUES
            (2018,7,'CHIAPAS',121,'Mezcalapa',1,'U',0,20,DATE '2018-07-01'),
            (2021,7,'CHIAPAS',121,'El Parral',1,'U',1,30,DATE '2021-06-06')
            ) t(AELEC,EDOCVE,EDONOM,MPIOCVE,MPIONOM,SECCION,TIPOSEC,SEXO,EDAD,FELECCION)''')
        conn.execute(schema.read_text(encoding='utf-8'))
        rows=conn.execute('''SELECT id_eleccion,cve_entidad,cve_municipio,nombre
            FROM analytics.dim_municipio ORDER BY id_eleccion''').fetchall()
        assert rows==[(2018,7,121,'Mezcalapa'),(2021,7,121,'El Parral')]
    finally:
        conn.close()
