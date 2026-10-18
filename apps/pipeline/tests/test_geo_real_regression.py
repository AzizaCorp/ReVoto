"""Regresión geoespacial de las fuentes reales recibidas para edo=03 y 22.

Los casos con limpieza nativa necesitan Shapely 2.2. La prueba de la
construcción de arcos se ejecuta también en 2.1 usando una cobertura de
precisión normalizada SOLO EN LA PRUEBA, sin sustituir la lógica productiva.
"""
from __future__ import annotations
import json
from pathlib import Path
import shapely
import pytest
from shapely.geometry import shape
from revoto_pipeline.export.topologia import (
    PreparedCoverage, prepare_coverage, vecinos_operativos,
    topologia_budget, validate_topology, _decode,
)

ROOT = Path(__file__).parent/'fixtures_geo'


def load(edo):
    feats = json.loads((ROOT/f'edo={edo}'/'municipios.geojson').read_text(encoding='utf-8'))['features']
    return feats, [shape(f['geometry']) for f in feats]


@pytest.mark.parametrize('edo,count', [('03',5),('22',18)])
def test_topo_real_con_cobertura_de_prueba_normalizada(edo,count):
    feats, originals = load(edo)
    normalized = list(shapely.set_precision(originals,1e-9))
    assert shapely.coverage_is_valid(normalized)
    ids = [f['properties']['cvegeo'] for f in feats]
    prepared = PreparedCoverage(ids,normalized,feats)
    graph = vecinos_operativos(feats, {k:k for k in ids}, prepared=prepared)
    assert len(graph)==count
    for key, neighbors in graph.items():
        assert key not in neighbors
        for other in neighbors:
            assert key in graph[other]
    report = {}
    blob = topologia_budget(feats,'municipios',300*1024,
                            quantization=100000,max_error_m=6500,
                            prepared=prepared,report_out=report)
    assert len(blob)<=307200
    topo = json.loads(blob)
    assert topo['type']=='Topology' and len(topo['arcs'])>0
    assert report['geometrias']==count and report['error_max_m']<=6500
    decoded = _decode(topo)
    assert {key for key,_ in decoded}==set(ids)
    assert all(not g.is_empty and g.is_valid for _,g in decoded)
    assert validate_topology(blob,feats,6500,prepared=prepared)['vecindades']==sum(map(len,graph.values()))//2


@pytest.mark.parametrize('edo,count', [('03',5),('22',18)])
@pytest.mark.skipif(not hasattr(shapely,'coverage_clean'),reason='Limpieza de cobertura nativa requiere Shapely 2.2+')
def test_geo_real_coverage_clean_nativa(edo,count):
    feats, originals = load(edo)
    assert not shapely.coverage_is_valid(originals)
    prepared = prepare_coverage(feats)
    assert len(prepared.codes)==count
    assert shapely.coverage_is_valid(prepared.polygons)
    assert all(g.is_valid and not g.is_empty for g in prepared.polygons)


def test_anillo_largo_no_hace_rotaciones_cuadraticas():
    """Anillo con una sola referencia repetida: caso O(N²) de ring_refs anterior."""
    import math
    from shapely.geometry import Polygon, mapping
    from revoto_pipeline.export.topologia import _topo
    n = 3000
    pts = [(-100 + math.cos(i*2*math.pi/n), 20 + math.sin(i*2*math.pi/n))
           for i in range(n)]
    feats = [{'type':'Feature','properties':{'cvegeo':'22001'},
              'geometry':mapping(Polygon(pts))}]
    topo = _topo(feats,'municipios',0)
    assert len(topo['objects']['municipios']['geometries'])==1
    assert len(_decode(topo))==1
