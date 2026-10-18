"""REV-DATA-01..06 regression tests; all figures are synthetic."""
from __future__ import annotations
import csv
import json
from dataclasses import replace
from pathlib import Path
import pytest

from revoto_pipeline.config import CONFIG_FILE, load_config
from revoto_pipeline.geo.temporal import inegi_geometry_reference
from revoto_pipeline.validation.quality import classify_context_result
from revoto_pipeline.export.contract import validate_payload
from revoto_pipeline.export.frontend import _rate, _assert_approved, export_web


def test_reference_is_not_retroactive_equivalence(tmp_path):
    cfg = load_config(CONFIG_FILE, tmp_path)
    ref = inegi_geometry_reference(cfg, 2024)
    assert ref.censo_ref == 2020
    assert ref.marco_inegi_anio == 2024
    assert not ref.poligono_compatible
    assert ref.razon == 'marco_inegi_distinto_del_censo'


@pytest.mark.parametrize(('eligible', 'rows', 'available', 'expected'), [
    (0, 0, 0, 'empty_expected'),
    (1, 0, 0, 'empty_unexpected'),
    (0, 1, 0, 'unexpected_rows'),
    (1, 1, 0, 'insufficient_coverage'),
    (3, 2, 1, 'available'),
])
def test_context_empty_status(eligible, rows, available, expected):
    assert classify_context_result(eligible, rows, available) == expected


def test_rn05_rate_and_percentage_scale():
    assert _rate({'LN': 100, 'SV': 60, 'NS': 10}, 50) == 0.667
    assert _rate({'LN': 40, 'SV': 32, 'NS': 0}, 50) is None
    assert _rate({'LN': 100, 'SV': 0, 'NS': 100}, 50) is None
    with pytest.raises(ValueError, match='fuera de rango'):
        _rate({'LN': 100, 'SV': 101, 'NS': 0}, 50)


def test_publication_approval_denies_partial_and_section(tmp_path):
    base = load_config(CONFIG_FILE, tmp_path)
    cfg = replace(base, umbral_rn05=50, publication=replace(base.publication,
                  contrato_l4_aprobado=False, umbral_rn05_aprobado=False))
    with pytest.raises(ValueError, match='aprobación'):
        _assert_approved(cfg, tuple(range(1,33)), False)
    cfg = replace(cfg, publication=replace(cfg.publication,
                                          contrato_l4_aprobado=True,
                                          umbral_rn05_aprobado=True))
    with pytest.raises(ValueError, match='32 estados'):
        _assert_approved(cfg, (30,), False)
    with pytest.raises(ValueError, match='RN-02'):
        _assert_approved(replace(cfg, publication=replace(cfg.publication, publicar_secciones=True)),
                         tuple(range(1,33)), False)


def test_l4_validator_rejects_v2_and_wrong_scale():
    dto = {'territorio': {'nivel':'municipio','cve':1,'cveEntidad':30,'nombre':'Ejemplo'},
           'fuente':'INE', 'suprimido':False, 'elecciones':[
               {'anio':2024, 'tipo':'presidencial', 'participacion':0.5,
                'lista_nominal':100, 'por_edad':{}, 'por_sexo':{}}]}
    validate_payload(dto, 'municipio')
    dto['elecciones'][0]['participacion'] = 50.0
    with pytest.raises(ValueError):
        validate_payload(dto, 'municipio')
    with pytest.raises(ValueError):
        validate_payload({'schema_version':2,'estado':'30','medidas':[]}, 'municipio')


def test_local_l4_dry_run_is_never_published(tmp_path):
    duckdb = pytest.importorskip('duckdb')
    from revoto_pipeline.sql_utils import copy_parquet
    cfg = replace(load_config(CONFIG_FILE, tmp_path), years=(2024,),
                  reference={2024:2020},district_reference={2024:2023},
                  umbral_rn05=50)
    (tmp_path/'budget.json').write_text(json.dumps({'entidad_kb':300,'municipio_kb':20}),encoding='utf-8')
    refs = cfg.path('oficiales')
    refs.parent.mkdir(parents=True,exist_ok=True)
    with refs.open('w',newline='',encoding='utf-8') as f:
        writer=csv.writer(f)
        writer.writerow(['anio_eleccion','cve_entidad','participacion_pct'])
        writer.writerow([2024,1,50])
    conn = duckdb.connect(':memory:')
    try:
        def put(path: Path, sql: str):
            copy_parquet(conn, sql, path)
        put(cfg.path('processed')/'marts/entidad/edo=01/anio=2024/datos.parquet',
            'SELECT 2024 AELEC, 1 EDOCVE, 200::BIGINT LN, 100::BIGINT SV, 100::BIGINT NV, 0::BIGINT NS')
        put(cfg.path('processed')/'marts/municipio/edo=01/anio=2024/datos.parquet',
            'SELECT 2024 AELEC, 1 EDOCVE, 1 MPIOCVE, 200::BIGINT LN, 100::BIGINT SV, 100::BIGINT NV, 0::BIGINT NS')
        put(cfg.path('processed')/'canonical/hecho_participacion/edo=01/anio=2024/hechos.parquet',
            """SELECT 2024 AELEC, 1 EDOCVE, 'Aguascalientes' EDONOM,
              1 MPIOCVE, 'Aguascalientes' MPIONOM, 0 SEXO, 20 EDAD,
              100::BIGINT LN, 60::BIGINT SV, 40::BIGINT NV, 0::BIGINT NS
              UNION ALL SELECT 2024,1,'Aguascalientes',1,'Aguascalientes',1,65,100,40,60,0""")
        identity = cfg.path('mapping_municipal_historico')
        identity.parent.mkdir(parents=True, exist_ok=True)
        identity.write_text(
            'anio_eleccion,cve_ent_ine,cve_mpio_ine,nombre_ine,cvegeo_canonico,nombre_canonico,tipo_equivalencia,equivalencia_verificada,censo_referencia,fuente_referencia,evidencia,observacion\n'
            '2024,1,1,Aguascalientes,01001,Aguascalientes,exacta,si,2020,ITER sintético,clave y nombre,\n',
            encoding='utf-8')
        report = export_web(cfg, 1, dry_run=True)
        assert report['estados'] == [1]
        assert report['max_diferencia_pp'] == 0
        assert not (cfg.path('salida')/'manifest.json').exists()
        with pytest.raises(ValueError, match='32 estados'):
            export_web(replace(cfg, publication=replace(cfg.publication,
                contrato_l4_aprobado=True,umbral_rn05_aprobado=True)),1)
    finally:
        conn.close()


def test_only_points_generate_explained_empty_context(tmp_path):
    duckdb = pytest.importorskip('duckdb')
    from revoto_pipeline.sql_utils import copy_parquet
    from revoto_pipeline.model.contexto_inegi import build_contexto_inegi
    cfg = replace(load_config(CONFIG_FILE, tmp_path),years=(2024,),
                  reference={2024:2020},district_reference={2024:2023})
    con = duckdb.connect(':memory:')
    try:
        census = cfg.path('inegi_staging')/'censo=2020/iter.parquet'
        copy_parquet(con, '''SELECT '300010001' cvegeo,'30' ENTIDAD,
            'localidad_regular' record_level,100::BIGINT POBTOT
            UNION ALL SELECT '300010000','30','total_municipal',100''', census)
        crosswalk = cfg.path('geo_staging')/'crosswalk/edo=30/anio_eleccion=2024/localidad_seccion_distrito.parquet'
        copy_parquet(con, """SELECT '300010001' cvegeo,'30' entidad,2024 anio_eleccion,
              2020 censo_ref,2023 anio_cartografia,FALSE referencia_retroactiva,
              FALSE equivalencia_historica_verificada,
              501 seccion_referencia,3 distrito_local_referencia,
              'unico' status_seccion,'distrito_unico_contenido' status_distrito,
              'punto_representativo_iter' metodo_localidad""", crosswalk)
        out=build_contexto_inegi(cfg,30,2024)
        assert out['secciones'] == 0
        assert out['distritos'] == 0
        assert out['diagnostico']['secciones']['estado'] == 'empty_expected'
        assert out['diagnostico']['localidades_espacialmente_unicas'] == 1
        assert out['diagnostico']['localidades_elegibles'] == 0
        assert (cfg.path('reportes')/'geo/edo=30_anio=2024_contexto_inegi.json').is_file()
    finally:
        con.close()
