"""DTOs reales contra JSON Schema compartido de este overlay."""
from __future__ import annotations
from pathlib import Path
import json
import pytest
from jsonschema import Draft7Validator, RefResolver

SCHEMAS = Path(__file__).resolve().parents[3] / 'packages/contracts/schemas'


def validate(doc,kind):
    schemas={p.name:json.loads(p.read_text(encoding='utf-8')) for p in SCHEMAS.glob('*.schema.json')}
    schema=schemas[f'{kind}.schema.json']
    resolver=RefResolver(base_uri=SCHEMAS.as_uri()+'/',referrer=schema,
                        store={k:v for k,v in schemas.items()})
    problems=list(Draft7Validator(schema,resolver=resolver).iter_errors(doc))
    if problems: raise ValueError(problems[0].message)


def available():
    return {'anio':2024,'tipo':'presidencial','participacion':.55,'lista_nominal':100,
            'por_edad':{'18-24':.4},'por_sexo':{'H':.5,'M':.6}}


def municipality():
    return {'territorio':{'nivel':'municipio','cve':1,'cveEntidad':22,'nombre':'Ejemplo',
                         'id_operativo':'ine_22_001','cvegeo':'22001'},
            'fuente':'INE','suprimido':False,'identidad_verificada':True,
            'elecciones':[{'anio':2009,'tipo':'intermedia','suprimido':True,'estado_tasa':'suppressed'},available()],
            'vecinos':['ine_22_002']}


def test_municipio_parcial_valido():
    validate(municipality(),'municipio')


def test_strict_retrocompatible():
    m=municipality();m['territorio']={'nivel':'municipio','cve':1,'cveEntidad':22,'nombre':'Ejemplo'}
    m['elecciones']=[available()];m.pop('vecinos');m.pop('identidad_verificada')
    validate(m,'municipio')
    m['suprimido']=True
    with pytest.raises(ValueError): validate(m,'municipio')


def test_no_publicar_ln_suprimido():
    m=municipality();m['elecciones'][0]['lista_nominal']=10
    with pytest.raises(ValueError): validate(m,'municipio')


def test_calidad_exploratorio_vs_strict():
    exploratory={'version_datos':'20261016-abcdef0','generado':'2026-10-16T00:00:00Z',
                 'fuente':'INE','estado_publicacion':'exploratorio_no_aprobado','reporte':'calidad.json'}
    strict={'version_datos':'20261016-abcdef0','generado':'2026-10-16T00:00:00Z',
            'fuente':'INE','validacion':{'max_diferencia_pp':.5,'reporte':'val/reporte.json'}}
    validate(exploratory,'manifest');validate(strict,'manifest')
    with pytest.raises(ValueError):validate({**exploratory,'estado_publicacion':'aprobado'},'manifest')


def test_entidad_con_perfil_y_ruta():
    entity={'territorio':{'nivel':'entidad','cve':22,'cveEntidad':22,'nombre':'Querétaro'},
            'fuente':'INE','elecciones':[available()],
            'municipios':[{'cve':1,'nombre':'Ejemplo','id_operativo':'x','archivo':'municipio/queretaro/22001_ejemplo.json'}],
            'perfil_estatal':{'metodologia':'perfil_descriptivo_estatal_v1','nivel_pp':1,
                              'efecto_presidencial_pp':2,'tendencia_pp_decada':0,'volatilidad_pp':3,
                              'anios':[2009,2012,2015,2018,2021,2024],
                              'referencia':'participacion_nacional_desde_conteos'}}
    validate(entity,'entidad')
