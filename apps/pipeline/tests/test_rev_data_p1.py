"""REV-DATA-07/08/09/10/11 synthetic, no official records."""
from dataclasses import replace
import pytest
from revoto_pipeline.model.indicators import INDICATOR_AGGREGATION, available_expression
from revoto_pipeline.model.marts import AGE_SQL, GRAINS, build_marts
from revoto_pipeline.config import CONFIG_FILE, load_config, sql_path


def test_registry_and_age_contract():
    assert {'municipio_sexo','municipio_edad'} <= GRAINS.keys()
    assert "BETWEEN 60 AND 110" in AGE_SQL
    assert 'POBTOT' in INDICATOR_AGGREGATION
    assert INDICATOR_AGGREGATION['VPH_INTER'].unit == 'viviendas'
    assert INDICATOR_AGGREGATION['GRAPROES'].weight == 'P_15YMAS'
    assert 'NULLIF' in available_expression('PORC_MUJERES', {'POBTOT','POBFEM'})
    assert available_expression('VPH_INTER', set()) == 'NULL::DOUBLE'


def test_demographic_marts_do_not_fanout(tmp_path):
    duckdb=pytest.importorskip('duckdb')
    from revoto_pipeline.sql_utils import copy_parquet
    cfg=load_config(CONFIG_FILE,tmp_path)
    cfg=replace(cfg,years=(2024,),reference={2024:2020},district_reference={2024:2023},umbral_rn05=5)
    target=cfg.path('processed')/'canonical'/'hecho_participacion'/'edo=30'/'anio=2024'/'hechos.parquet'
    con=duckdb.connect(':memory:')
    # CAMBIO: el fixture incluye DEL porque la configuración habilita distritos locales.
    copy_parquet(con,'''SELECT * FROM (VALUES
      (2024,30,1,101,0,20,10,8,2,0,1),
      (2024,30,1,101,1,60,20,10,10,0,1),
      (2024,30,1,101,9,40,30,20,10,0,1),
      (2024,30,1,101,0,115,40,30,10,0,1)
    ) t(AELEC,EDOCVE,MPIOCVE,SECCION,SEXO,EDAD,LN,SV,NV,NS,DEL)''',target)
    build_marts(cfg,30)
    base="data/processed/marts/{name}/edo=30/anio=2024/datos.parquet"
    def query(name,sql):
        path=tmp_path/base.format(name=name)
        return con.execute(f"{sql} FROM read_parquet('{sql_path(path)}')").fetchall()
    # General total retains anomalous sex+age. Each demographic slice excludes only its invalid dimension.
    assert query('municipio','SELECT SUM(LN)') == [(100,)]
    assert query('municipio_sexo','SELECT SUM(LN)') == [(70,)]
    assert query('municipio_edad','SELECT SUM(LN)') == [(60,)]
    assert query('municipio_sexo','SELECT COUNT(*)') == [(2,)]
    assert query('municipio_edad','SELECT COUNT(*)') == [(3,)]
    assert con.execute(f"SELECT COUNT(*),SUM(LN) FROM read_parquet('{sql_path(target)}')").fetchone()==(4,100)
    con.close()


def test_municipal_context_inegi_extra_indicators(tmp_path):
    duckdb=pytest.importorskip('duckdb')
    from revoto_pipeline.sql_utils import copy_parquet
    from revoto_pipeline.model.municipal_context import build_municipal_context
    cfg=load_config(CONFIG_FILE,tmp_path)
    cfg=replace(cfg,years=(2024,),reference={2024:2020},district_reference={2024:2023},
                integration=replace(cfg.integration,incluir_inegi=True,incluir_conapo=False))
    con=duckdb.connect(':memory:')
    source=cfg.path('processed')/'marts'/'municipio'/'edo=30'/'anio=2024'/'datos.parquet'
    copy_parquet(con,"SELECT 2024 AELEC,30 EDOCVE,1 MPIOCVE,100::BIGINT LN,60::BIGINT SV,40::BIGINT NV,0::BIGINT NS,60.0 participacion_pct",source)
    census=cfg.path('inegi_staging')/'censo=2020'/'iter.parquet'
    copy_parquet(con,"SELECT '300010000' cvegeo,'total_municipal' record_level,150::BIGINT POBTOT,80::BIGINT POBFEM,35::BIGINT PEA,25::BIGINT POCUPADA,20::BIGINT VPH_INTER",census)
    mapping=cfg.path('mapping_inegi_ine');mapping.parent.mkdir(parents=True,exist_ok=True)
    mapping.write_text('censo_ref,cvegeo_municipal_inegi,anio_eleccion,cve_ent_ine,cve_mpio_ine,status_match\n2020,300010000,2024,30,1,validado\n',encoding='utf-8')
    # CAMBIO: full_context requiere una identidad municipal explícita y verificada.
    cfg.path('mapping_municipal_historico').write_text(
        'anio_eleccion,cve_ent_ine,cve_mpio_ine,nombre_ine,cvegeo_canonico,nombre_canonico,tipo_equivalencia,equivalencia_verificada,censo_referencia,fuente_referencia,evidencia,observacion\n'
        '2024,30,1,MUNICIPIO SINTETICO,30001,MUNICIPIO SINTETICO,exacta,si,2020,ITER sintetico,codigo y nombre,\n')
    stats=build_municipal_context(cfg,30)
    dest=cfg.path('processed')/'full_context'/'edo=30'/'anio=2024'/'municipios.parquet'
    row=con.execute(f"SELECT inegi_pobtot,inegi_pea,inegi_pocupada,inegi_vph_inter,inegi_metodo FROM read_parquet('{sql_path(dest)}')").fetchone()
    assert row==(150,35,25,20,'iter_total_municipal')
    assert stats[2024]['rows']==1
    con.close()
