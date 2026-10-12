"""Pure methodological and configuration tests for the US-06 refactor."""
from dataclasses import replace
from pathlib import Path
import pytest
from revoto_pipeline.config import CONFIG_FILE, load_config
from revoto_pipeline.model.indicators import available_expression
from revoto_pipeline.model.marts import aggregation_sql
from revoto_pipeline.model.reglas import coverage, participacion, publish_count, ratio, unique_mapping, weighted_mean


def test_original_ine_dimensions_are_kept():
    from revoto_pipeline.model.canonical import FIELDS
    assert {'AELEC','EDOCVE','MPIOCVE','SECCION','SEXO','EDAD','TIPOSEC','DEF','DEL','LN','SV','NV','NS'}<=set(FIELDS)


def test_ratio_of_counts_not_average_of_rates():
    assert participacion(91, 100, 0) == 91
    assert participacion(60, 100, 10) == pytest.approx(66.6666666667)
    assert ratio([(9,10),(1,100)])==pytest.approx(10/110)
    assert ratio([(0,0)]) is None
    assert ratio([(1,None)]) is None


def test_weighted_means_and_suppression():
    assert weighted_mean([(2.0,10),(4.0,30)])==pytest.approx(3.5)
    assert weighted_mean([(2.0,10),(None,5)]) is None
    assert weighted_mean([(2.0,0)]) is None
    assert 'P_15YMAS' in available_expression('GRAPROES', {'GRAPROES','P_15YMAS'})
    assert available_expression('GRAPROES',{'GRAPROES'})=='NULL::DOUBLE'


def test_missing_indicator_is_null_not_zero():
    assert available_expression('PEA',set())=='NULL::DOUBLE'
    s=available_expression('POBTOT',{'POBTOT'})
    assert 'COUNT(' in s and 'SUM(' in s and 'THEN' in s


def test_mapping_fanout_and_coverage():
    unique_mapping([{'municipio':'01'},{'municipio':'02'}],('municipio',))
    with pytest.raises(ValueError,match='fanout'):
        unique_mapping([{'municipio':'01'},{'municipio':'01'}],('municipio',))
    assert coverage(25,100)==.25
    assert coverage(101,100) is None
    assert coverage(0,None) is None


def test_rn05_suppression_never_zero():
    assert publish_count(2,4,5)=={'valor':None,'status':'suppressed'}
    assert publish_count(None,None,5)['status']=='unavailable'
    assert publish_count(0,5,5)['valor']==0


def test_summed_denominator_sql_and_no_avg():
    sql=aggregation_sql('test',('AELEC','SECCION'),rn05=5)
    assert 'SUM(LN)' in sql and 'SUM(SV)' in sql
    assert 'AVG(' not in sql
    assert 'SV/NULLIF(LN-NS, 0)' in sql
    assert 'SUM(NS)' in sql
    assert aggregation_sql('test',('AELEC',),rn05=None).find('umbral_no_definido')>=0


def test_configuration_variations(tmp_path):
    config=Path(CONFIG_FILE).read_text(encoding='utf-8')
    variants=(('true','true'),('true','false'),('false','true'),('false','false'))
    for a,b in variants:
        f=tmp_path/'setting.toml'
        f.write_text(config.replace('incluir_inegi = true',f'incluir_inegi = {a}')
                     .replace('incluir_conapo = true',f'incluir_conapo = {b}'),encoding='utf-8')
        cfg=load_config(f,tmp_path)
        assert cfg.integration.incluir_inegi==(a=='true')
        assert cfg.integration.incluir_conapo==(b=='true')
    f.write_text(config.replace('incluir_del = true','incluir_del = false'),encoding='utf-8')
    assert not load_config(f,tmp_path).incluir_del
    assert not load_config(f,tmp_path).del_distrito_verificado


def test_invalid_coverage_rejected(tmp_path):
    config=Path(CONFIG_FILE).read_text(encoding='utf-8')
    f=tmp_path/'settings.toml'
    f.write_text(config.replace('cobertura_minima_inegi = 0.80','cobertura_minima_inegi = 1.2'), encoding='utf-8')
    with pytest.raises(ValueError,match='cobertura_minima'):
        load_config(f,tmp_path)


def test_temporal_reference_fails_wrong_vintage(tmp_path):
    from revoto_pipeline.geo.temporal import resolve_reference
    cfg=load_config(CONFIG_FILE,tmp_path)
    assert resolve_reference(cfg,2009).referencia_territorial_historica
    assert not resolve_reference(cfg,2024).referencia_territorial_historica
    with pytest.raises(ValueError):
        resolve_reference(cfg,2009,cartografia=2023)
    with pytest.raises(ValueError):
        resolve_reference(cfg,2024,censo=2010)
