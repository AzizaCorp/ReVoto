"""Fixtures cuadrangulares sintéticos para vecindad, arcos y cuantización."""
from __future__ import annotations
import json
import pytest
from shapely.geometry import Polygon, box, mapping
from revoto_pipeline.export.topologia import (
    vecinos_operativos, vecinos_geometricos, topologia_budget,
    validate_topology, _polygons, _decode,
)


def feats():
    polygons=[box(-100,20,-99,21),box(-99,20,-98,21),box(-98,21,-97,22)]
    return [{'type':'Feature','properties':{'cvegeo':f'0100{i}'},'geometry':mapping(p)}
            for i,p in enumerate(polygons,1)]


def test_lado_no_vertice_y_simetria():
    graph=vecinos_operativos(feats(),{'01001':'a','01002':'b','01003':'c'})
    assert graph=={'a':['b'],'b':['a'],'c':[]}
    assert vecinos_geometricos(feats(),{'01001':1,'01002':2,'01003':3}) == {1:[2],2:[1],3:[]}


def test_sin_clave_verificada_no_se_adjudica_vecindad():
    assert vecinos_operativos(feats(),{'01001':'a'})=={'a':[]}
    with pytest.raises(ValueError,match='duplicado'):
        vecinos_operativos(feats(),{'01001':'id','01002':'id'})


def test_geometria_autointersectada_no_pasa_sin_reparacion_segura():
    bad=feats()
    bad[0]['geometry']=mapping(Polygon([(-100,20),(-99,21),(-100,21),(-99,20)]))
    with pytest.raises(ValueError): _polygons(bad,repair=False)
    with pytest.raises(ValueError): _polygons(bad,repair=True)


def test_codigo_duplicado_o_de_otro_estado():
    f=feats();f[1]['properties']['cvegeo']='01001'
    with pytest.raises(ValueError,match='duplicado'): vecinos_operativos(f,{})
    f=feats();f[2]['properties']['cvegeo']='02003'
    assert vecinos_operativos(f,{'01001':'a','01002':'b','02003':'c'}) == {'a':['b'],'b':['a'],'c':[]}


def test_topojson_compartido_y_valido():
    features=feats()
    raw=topologia_budget(features,'municipios',300*1024,
                        initial_tolerance=0,quantization=1_000_000,max_error_m=300)
    parsed=json.loads(raw)
    assert parsed['type']=='Topology' and 'transform' in parsed
    assert len(parsed['objects']['municipios']['geometries'])==3
    info=validate_topology(raw,features,300)
    assert info['geometrias']==3 and info['vecindades']==1
    assert [x[0] for x in _decode(parsed)] == ['01001','01002','01003']
    geometries=parsed['objects']['municipios']['geometries']
    def arc_ids(geometry):
        return {a if a>=0 else ~a for ring in geometry['arcs'] for a in ring}
    assert arc_ids(geometries[0]) & arc_ids(geometries[1])


def test_presupuesto_falla_sin_fabricar_topologia():
    with pytest.raises(ValueError, match='no cumple'):
        topologia_budget(feats(),'municipios',5,max_error_m=300)


def test_cuantizacion_degenerada_falla():
    with pytest.raises(ValueError,match='Cuantización'):
        topologia_budget(feats(),'municipios',300000,quantization=10)
