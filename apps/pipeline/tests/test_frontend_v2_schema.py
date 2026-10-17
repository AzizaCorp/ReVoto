"""The former frontend_v2 schema must NOT be accepted by the L4 publisher."""
import pytest
from revoto_pipeline.export.contract import validate_payload


def test_v2_payload_is_not_an_l4_resource():
    legacy = {'schema_version':2,'estado':'01','anio_eleccion':2024,
              'grano':'municipio','fuentes':['INE'],'medidas':[]}
    with pytest.raises(ValueError):
        validate_payload(legacy,'municipio')


def test_l4_has_no_section_level():
    payload = {'territorio': {'nivel':'seccion','cve':1,'nombre':'Sección'},
               'fuente':'INE','elecciones':[],'suprimido':False}
    with pytest.raises(ValueError):
        validate_payload(payload,'municipio')
