"""REV-DATA-12: public Python JSON must satisfy the exact shared L4 schema.
Requires the REV-DATA-01–06 L4 exporter to be integrated first.
"""
import pytest
pytest.importorskip('jsonschema')
from revoto_pipeline.export.contract import validate_payload


def test_l4_national_entity_municipio_and_manifest():
    election={'anio':2024,'tipo':'presidencial','participacion':0.6,'lista_nominal':100,
              'por_edad':{'18-24':0.4},'por_sexo':{'H':0.5,'M':0.7}}
    national={'territorio':{'nivel':'nacional','nombre':'Nacional'},'fuente':'INE','elecciones':[election]}
    state={'territorio':{'nivel':'entidad','cve':30,'cveEntidad':30,'nombre':'Veracruz'},
           'fuente':'INE','elecciones':[election], 'municipios':[{'cve':1,'nombre':'Ejemplo'}]}
    municipality={'territorio':{'nivel':'municipio','cve':1,'cveEntidad':30,'nombre':'Ejemplo'},
                  'fuente':'INE','suprimido':False,'elecciones':[election]}
    manifest={'version_datos':'20261012-abcdef0','generado':'2026-10-12T00:00:00Z',
              'fuente':'INE','validacion':{'max_diferencia_pp':0.5,'reporte':'20261012-abcdef0/validacion/reporte.json'}}
    for kind,document in [('nacional',national),('entidad',state),('municipio',municipality),('manifest',manifest)]:
        validate_payload(document, kind)
    bad=dict(election,participacion=60)
    with pytest.raises(ValueError):
        validate_payload(dict(national,elecciones=[bad]), 'nacional')
    with pytest.raises(ValueError):
        validate_payload(dict(municipality,suprimido=True), 'municipio')
