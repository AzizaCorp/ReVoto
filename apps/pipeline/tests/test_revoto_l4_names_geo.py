"""Synthetic tests for source-derived display names, H/M, RN-03 and GeoJSON."""
from types import SimpleNamespace
import pytest
from shapely.geometry import Polygon, mapping
from revoto_pipeline.export.frontend import (_normalize_name, _one_name,
    _named_geojson, _election, _rate)
from revoto_pipeline.export.contract import validate_payload


def test_names_from_sources_and_normalized_variations():
    assert _normalize_name('  MÉXICO   ') == _normalize_name('mexico')
    assert _one_name(['VERACRUZ', 'Veracruz'], 'state') in ('VERACRUZ', 'Veracruz')
    assert _one_name(['XALAPA', 'Xalapa'], 'municipality') in ('XALAPA', 'Xalapa')
    with pytest.raises(ValueError, match='inconsistente'):
        _one_name(['Xalapa', 'Coatepec'], 'conflict')
    with pytest.raises(ValueError, match='ausente'):
        _one_name([], 'missing')


def test_election_outputs_explicit_type_and_H_M_only():
    base = {'LN': 100, 'SV': 60, 'NS': 0}
    row = _election(base, 2024, 5,
        {'18-24': {'LN': 50, 'SV': 20, 'NS': 0}},
        {'H': {'LN': 50, 'SV': 25, 'NS': 0}, 'M': {'LN': 50, 'SV': 35, 'NS': 0}})
    assert row['tipo'] == 'presidencial'
    assert row['participacion'] == .6
    assert row['por_sexo'] == {'H': .5, 'M': .7}
    assert row['por_edad']['18-24'] == .4
    assert _election(base, 2021, 5, {}, {})['tipo'] == 'intermedia'
    assert _rate({'LN': 3, 'SV': 1, 'NS': 0}, 5) is None
    dto = {'territorio':{'nivel':'municipio','cve':1,'cveEntidad':30,'nombre':'Xalapa'},
           'fuente':'INE', 'suprimido':False, 'elecciones':[row]}
    validate_payload(dto, 'municipio')


def geo(code: str):
    poly = Polygon([(-96,19),(-96,19.5),(-95.5,19.5),(-95.5,19),(-96,19)])
    return {'type':'FeatureCollection','features':[{'type':'Feature',
             'properties':{'cvegeo':code},'geometry':mapping(poly)}]}


def test_geojson_uses_real_names_and_provenance():
    cfg = SimpleNamespace(geo={'inegi_marco_anio':2024})
    payload = _named_geojson(geo('30087'),30,'municipios','Veracruz',
                             {87:'XALAPA'},cfg)
    feature = payload['features'][0]
    assert feature['properties'] == {'cvegeo':'30087','nombre':'XALAPA'}
    assert payload['metadata']['anio_marco_inegi'] == 2024
    with pytest.raises(ValueError, match='No hay nombre INE'):
        _named_geojson(geo('30087'),30,'municipios','Veracruz',{},cfg)
    with pytest.raises(ValueError, match='fuera del estado'):
        _named_geojson(geo('31087'),30,'municipios','Veracruz',{87:'XALAPA'},cfg)


def test_geojson_duplicate_rejected():
    cfg = SimpleNamespace(geo={'inegi_marco_anio':2024})
    source = geo('30087')
    source['features'] = source['features'] * 2
    with pytest.raises(ValueError, match='duplicado'):
        _named_geojson(source,30,'municipios','Veracruz',{87:'XALAPA'},cfg)
