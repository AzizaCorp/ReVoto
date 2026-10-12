"""Independent JSON Schema validation of the proposed frontend v2 envelope."""
import json
from pathlib import Path
import pytest
from revoto_pipeline.export.contract import validate_payload

SCHEMA=Path(__file__).resolve().parents[1]/'revoto_pipeline'/'schemas'/'frontend_v2.schema.json'


def payload():
    return {'schema_version':2,'estado':'01','anio_eleccion':2024,'grano':'municipio',
            'fuentes':['INE'],
            'medidas':[{'publicacion':'suppressed','ln':None,'sv':None,
                        'nv':None,'ns':None,'participacion_pct':None}]}


def test_contract_and_suppression():
    v=payload()
    validate_payload(v)
    jsonschema=pytest.importorskip('jsonschema')
    jsonschema.validate(v,json.loads(SCHEMA.read_text(encoding='utf-8')))
    assert v['medidas'][0]['sv'] is None


def test_suppressed_cannot_expose_counts():
    v=payload()
    v['medidas'][0]['sv']=2
    with pytest.raises(ValueError,match='suprimida'):
        validate_payload(v)


def test_more_than_one_read_model_rejected():
    v=payload()
    v['contexto_municipal']=[]
    with pytest.raises(ValueError,match='único'):
        validate_payload(v)
