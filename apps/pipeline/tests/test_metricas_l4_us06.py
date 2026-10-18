"""Reglas RN-01/03/04/05/06 con datos SINTÉTICOS, nunca cifras oficiales."""
from __future__ import annotations
import pytest
from revoto_pipeline.export.metricas import counts, status, fraction, election, global_suppressed
from revoto_pipeline.model.perfiles_estatales import perfil_estatal


def test_tasa_contable_y_redondeo():
    assert fraction([400,279,101,20], 50) == .734
    assert election(2024, [400,279,101,20], 50)['tipo'] == 'presidencial'
    assert election(2021, [100,50,50,0], 50)['tipo'] == 'intermedia'


def test_supresion_periodo_no_desactiva_otros():
    d = [election(2009, [10,5,5,0], 50), election(2012,[100,60,40,0],50)]
    assert d[0] == {'anio':2009,'tipo':'intermedia','suprimido':True,'estado_tasa':'suppressed'}
    assert d[1]['participacion'] == .6
    assert not global_suppressed(d)
    assert global_suppressed([d[0]])


def test_indefinida_sin_llenarla_con_cero():
    d = election(2015,[60,0,0,60],50)
    assert d['estado_tasa']=='rate_undefined' and 'participacion' not in d
    assert status(None,50)=='no_data'
    assert status({'LN':60,'SV':None,'NS':0},50)=='unavailable'


def test_rechazos_de_conteos():
    for data in ([50,60,0,0], [50,-1,0,0], [50,20,40,0], [49,0,0,60]):
        with pytest.raises(ValueError): counts(data)
    with pytest.raises(ValueError): fraction([50,10,40,0],0)
    with pytest.raises(ValueError): election(2010,[100,20,80,0],50)


def test_sexo_y_edad_only_catalog():
    d = election(2024,[200,120,80,0],5, ages={
        '18-24':[50,20,30,0], '17':[100,60,40,0],
    }, sexes={'H':[100,70,30,0],'M':[100,50,50,0],'X':[30,15,15,0]})
    assert d['por_edad']=={'18-24': .4}
    assert d['por_sexo']=={'H':.7,'M':.5}


def test_perfil_descriptivo_no_adjudica_cluster():
    from revoto_pipeline.export.metricas import YEARS
    state={y:[1000,400+i*50,600-i*50,0] for i,y in enumerate(YEARS)}
    nat={y:[100000,50000,50000,0] for y in YEARS}
    p=perfil_estatal(state,nat)
    assert p is not None and p['metodologia']=='perfil_descriptivo_estatal_v1'
    assert 'id' not in p and 'arquetipo' not in p
    assert p['volatilidad_pp']>=0
    assert perfil_estatal({2024:state[2024]},nat) is None
    assert perfil_estatal({y:[100,0,0,100] for y in YEARS},nat) is None
