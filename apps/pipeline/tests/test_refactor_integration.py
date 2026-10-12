"""Small, synthetic DuckDB end-to-end tests; no source electoral records required."""
from dataclasses import replace
import json
import pytest

duckdb=pytest.importorskip('duckdb')
from revoto_pipeline.config import load_config, CONFIG_FILE, sql_path
from revoto_pipeline.sql_utils import copy_parquet
from revoto_pipeline.model.canonical import build_canonical
from revoto_pipeline.model.marts import build_marts
from revoto_pipeline.model.database import build_database
from revoto_pipeline.model.contexto_inegi import build_contexto_inegi
from revoto_pipeline.model.municipal_context import build_municipal_context
from revoto_pipeline.export.frontend import export_web


def setup(tmp_path):
    cfg=load_config(CONFIG_FILE,root=tmp_path)
    return replace(cfg,years=(2024,),reference={2024:2020},
                   district_reference={2024:2023},umbral_rn05=5)


def put(con,cfg,rel,sql):
    dest=cfg.root/rel
    copy_parquet(con,sql,dest)
    return dest


def test_fact_marts_db_export_and_del_toggle(tmp_path):
    cfg=setup(tmp_path)
    cfg=replace(cfg,publication=replace(cfg.publication,permitir_contrato_v2=True,publicar_secciones=True,publicar_desgloses_territoriales=True))
    con=duckdb.connect(':memory:')
    source='''SELECT 2024::INTEGER AELEC,1::INTEGER EDOCVE,'Aguascalientes' EDONOM,
       1::INTEGER MPIOCVE,'Aguascalientes' MPIONOM,501::INTEGER SECCION,'U' TIPOSEC,
       2::INTEGER DEF,3::INTEGER DEL,0::TINYINT SEXO,20::SMALLINT EDAD,
       DATE '2024-06-02' FELECCION,10::BIGINT LN,9::BIGINT SV,1::BIGINT NV,0::BIGINT NS,
       2024::INTEGER source_year,'ejemplo.csv' source_file,FALSE missing_def,
       FALSE missing_del,FALSE invalid_def_token,FALSE invalid_del_token
       UNION ALL SELECT 2024,1,'Aguascalientes',1,'Aguascalientes',501,'U',2,3,1,60,
       DATE '2024-06-02',90,45,45,0,2024,'ejemplo.csv',FALSE,FALSE,FALSE,FALSE'''
    put(con,cfg,'data/staging/ine/edo=01/anio=2024/conteos.parquet',source)
    assert build_canonical(cfg,1)=={2024:2}
    build_marts(cfg,1)
    source_fact=cfg.path('processed')/'canonical/hecho_participacion/edo=01/anio=2024/hechos.parquet'
    assert con.execute(f"SELECT COUNT(DISTINCT SEXO),COUNT(DISTINCT EDAD) FROM read_parquet('{sql_path(source_fact)}')").fetchone()==(2,2)
    mart=cfg.path('processed')/'marts/municipio/edo=01/anio=2024/datos.parquet'
    assert con.execute(f"SELECT LN,SV,participacion_pct FROM read_parquet('{sql_path(mart)}')").fetchone()==(100,54,54.0)
    stats=build_database(cfg)
    assert stats['hecho_participacion']==2
    db=duckdb.connect(str(cfg.path('base')),read_only=True)
    assert db.execute('SELECT COUNT(*) FROM analytics.dim_seccion').fetchone()[0]==1
    db.close()
    exported=export_web(cfg,1)
    data=json.loads((cfg.path('salida')/'ine/edo=01/anio=2024/secciones-sexo.json').read_text())
    assert data['schema_version']==2
    assert len(data['medidas'])==2
    cfg_no_del=replace(cfg,incluir_del=False,del_distrito_verificado=False)
    build_marts(cfg_no_del,1)
    export_web(cfg_no_del,1)
    assert not (cfg.path('salida')/'ine/edo=01/anio=2024/distritos.json').exists()
    con.close()


def test_inegi_coverage_and_uncertainty(tmp_path):
    cfg=setup(tmp_path)
    con=duckdb.connect(':memory:')
    # The first locality is fully inside one reference section; the other is ambiguous.
    locality="""SELECT '010010001' cvegeo,'01' ENTIDAD,'localidad_regular' record_level,
      30::BIGINT POBTOT,20::BIGINT POBFEM,10::BIGINT POBMAS,25::BIGINT P_15YMAS,
      8.0::DOUBLE GRAPROES, 5::BIGINT PEA, 5::BIGINT P_18YMAS,
      4::BIGINT P_18A24,2::BIGINT P_60YMAS,4::BIGINT POCUPADA,
      1::BIGINT PDESOCUP,0::BIGINT P15YM_AN
      UNION ALL SELECT '010010002','01','localidad_regular',70,30,40,60,6.0,12,60,15,6,11,1,0
      UNION ALL SELECT '010010000','01','total_municipal',100,50,50,85,7.0,17,65,19,8,15,2,0"""
    put(con,cfg,'data/staging/inegi/censo=2020/iter.parquet',locality)
    bridge="""SELECT '010010001' cvegeo,'01' entidad,2024 anio_eleccion,2020 censo_ref,
          2023 anio_cartografia,501 seccion_referencia,3 distrito_local_referencia,
          'unico' status_seccion,'distrito_unico_contenido' status_distrito,
          'poligono_localidad_contenido' metodo_localidad,FALSE referencia_retroactiva,
          FALSE equivalencia_historica_verificada
          UNION ALL SELECT '010010002','01',2024,2020,2023,NULL,NULL,'ambiguo',
          'sin_seccion','punto_representativo_iter',FALSE,FALSE"""
    put(con,cfg,'data/staging/geo/crosswalk/edo=01/anio_eleccion=2024/localidad_seccion_distrito.parquet',bridge)
    report=build_contexto_inegi(cfg,1,2024)
    assert report['secciones']==1
    dst=cfg.path('processed')/'inegi/secciones/edo=01/anio=2024/contexto.parquet'
    s=con.execute(f"SELECT coverage_pct,quality_status,pobtot,localidades_ambiguas FROM read_parquet('{sql_path(dst)}')").fetchone()
    assert s==(.3,'insufficient_coverage',None,1)
    # Lowering explicitly configured threshold makes the census-locality count usable.
    cfg2=replace(cfg,integration=replace(cfg.integration,cobertura_minima_inegi=.2))
    build_contexto_inegi(cfg2,1,2024)
    s=con.execute(f"SELECT pobtot,graproes,porc_mujeres FROM read_parquet('{sql_path(dst)}')").fetchone()
    assert s[0]==30 and s[1]==8.0 and s[2]==pytest.approx(20/30)
    con.close()
