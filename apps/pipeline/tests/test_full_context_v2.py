"""Updated optional municipal context contract (supersedes triple-only expectations)."""
from dataclasses import replace
import pytest

duckdb=pytest.importorskip('duckdb')
from revoto_pipeline.config import load_config, CONFIG_FILE
from revoto_pipeline.sql_utils import copy_parquet
from revoto_pipeline.transform.full_context import build_full_context


def test_context_four_source_combinations(tmp_path):
    cfg=load_config(CONFIG_FILE,root=tmp_path)
    cfg=replace(cfg,years=(2024,),reference={2024:2020},district_reference={2024:2023})
    c=duckdb.connect(':memory:')
    def put(path,sql):
        copy_parquet(c,sql,path)
    p=cfg.path('processed')/'marts'/'municipio'/'edo=01'/'anio=2024'/'datos.parquet'
    put(p,'''SELECT 2024 AELEC,1 EDOCVE,1 MPIOCVE,100::BIGINT LN,76::BIGINT SV,
                 24::BIGINT NV,0::BIGINT NS,76.0 participacion_pct''')
    census=cfg.path('inegi_staging')/'censo=2020'/'iter.parquet'
    put(census,'''SELECT '010010000' cvegeo,'total_municipal' record_level,
               123::BIGINT POBTOT''')
    cn=cfg.path('conapo_staging')/'poblacion_anual.parquet'
    put(cn,'''SELECT '01001' clave_municipal_raw,2024 anio,0::TINYINT sexo_ine,
               50::BIGINT pob_total_num
               UNION ALL SELECT '01001',2024,1,50''')
    maps=tmp_path/'data'/'mappings'
    maps.mkdir(parents=True)
    (maps/'conapo_ine.csv').write_text(
        'clave_conapo,clave_ent_conapo,cve_ent_ine,cve_mpio_ine,anio,status_match\n'
        '01001,01,1,1,2024,validado\n')
    (maps/'inegi_ine.csv').write_text(
        'censo_ref,cvegeo_municipal_inegi,anio_eleccion,cve_ent_ine,cve_mpio_ine,status_match\n'
        '2020,010010000,2024,1,1,validado\n')
    
    (maps/'municipios_historicos.csv').write_text(
        'anio_eleccion,cve_ent_ine,cve_mpio_ine,nombre_ine,cvegeo_canonico,nombre_canonico,tipo_equivalencia,equivalencia_verificada,censo_referencia,fuente_referencia,evidencia,observacion\n'
        '2024,1,1,AGUASCALIENTES,01001,AGUASCALIENTES,exacta,si,2020,ITER sintetico,codigo y nombre,\n')
    for include_inegi,include_conapo in ((False,False),(True,False),(False,True),(True,True)):
        ci=replace(cfg,integration=replace(cfg.integration,
                   incluir_inegi=include_inegi,incluir_conapo=include_conapo))
        report=build_full_context(ci,1)
        assert report[2024]['rows']==1
        out=ci.path('processed')/'full_context'/'edo=01'/'anio=2024'/'municipios.parquet'
        row=c.execute(f"SELECT * FROM read_parquet('{out.as_posix()}')").fetchdf().iloc[0]
        assert ('inegi_pobtot' in row.index)==include_inegi
        assert ('poblacion_conapo' in row.index)==include_conapo
        if include_inegi: assert row['inegi_pobtot']==123
        if include_conapo: assert row['poblacion_conapo']==100
    c.close()
