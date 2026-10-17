"""Conversión cartográfica a TopoJSON (arcos compartidos) sin datos electorales.

Conserva fronteras adyacentes mediante simplificación de cobertura Shapely.
Almacena arcos compartidos y valida presupuesto de bytes antes de publicar.
"""
from __future__ import annotations

import json
from collections import defaultdict, deque
from typing import Any

from shapely import coverage_simplify
from shapely.geometry import shape


def vecinos_geometricos(features: list[dict], ine_por_cvegeo: dict[str,int]) -> dict[int,list[int]]:
    from shapely.strtree import STRtree
    polys = [shape(f['geometry']) for f in features]
    codes = [f['properties']['cvegeo'] for f in features]
    if len(set(codes)) != len(codes) or any(not p.is_valid or p.is_empty for p in polys):
        raise ValueError('Códigos o polígonos municipales inválidos para vecindad')
    tree = STRtree(polys)
    ret: dict[int,list[int]] = {}
    for i, poly in enumerate(polys):
        current = ine_por_cvegeo.get(codes[i])
        if current is None:
            continue
        near = set()
        for j in tree.query(poly, predicate='intersects'):
            j = int(j)
            other = ine_por_cvegeo.get(codes[j])
            if j != i and other is not None and other != current:
                # Compartir un único vértice no equivale a frontera colindante.
                if poly.boundary.intersection(polys[j].boundary).length > 1e-9:
                    near.add(other)
        ret[current] = sorted(near)
    return ret


def _topo(features: list[dict], object_name: str, tolerance: float) -> dict[str,Any]:
    polygons = [shape(feature['geometry']) for feature in features]
    if not polygons or any(p.is_empty or not p.is_valid or p.geom_type not in ('Polygon','MultiPolygon') for p in polygons):
        raise ValueError('Topología de entrada no válida')
    # Coverage simplification simplifica bordes compartidos conjuntamente.
    simplified = list(coverage_simplify(polygons, tolerance=tolerance, simplify_boundary=True)) if tolerance else polygons
    if any(p.is_empty or not p.is_valid or p.geom_type not in ('Polygon','MultiPolygon') for p in simplified):
        raise ValueError('Simplificación produjo geometrias inválidas')
    # Indexar segmentos orientados con su lista de propietarios para deduplicar
    # bordes compartidos y fusionar cadenas de segmentos de igual cobertura.
    owners: dict[tuple, set[int]] = defaultdict(set)
    adjacency: dict[tuple, set[tuple]] = defaultdict(set)
    geometries_rings = []

    def ring_points(coords):
        pts = [tuple(round(float(v), 6) for v in xy[:2]) for xy in coords]
        pts = [p for i,p in enumerate(pts) if not i or p != pts[i-1]]
        if pts[0] != pts[-1]:
            pts.append(pts[0])
        if len(set(pts[:-1])) < 3:
            raise ValueError('Anillo degenerado tras cuantizar coordenadas')
        return pts

    for owner, geom in enumerate(simplified):
        polylist = [geom] if geom.geom_type == 'Polygon' else list(geom.geoms)
        components = []
        for poly in polylist:
            rings = [ring_points(poly.exterior.coords)] + [ring_points(hole.coords) for hole in poly.interiors]
            for points in rings:
                for a,b in zip(points,points[1:]):
                    segment = tuple(sorted((a,b)))
                    owners[segment].add(owner)
                    adjacency[a].add(segment)
                    adjacency[b].add(segment)
            components.append(rings)
        geometries_rings.append(components)

    # Una cadena puede continuar si el nodo tiene grado 2 y los dos bordes
    # pertenecen al mismo conjunto de polígonos. Esto reduce fuertemente el
    # costo respecto a un arco de dos vértices por segmento sin romper vecindad.
    arcs: list[list[list[float]]] = []
    edge_refs: dict[tuple, int] = {}
    unseen = set(owners)
    while unseen:
        seed = min(unseen)
        owner_set = owners[seed]
        unseen.remove(seed)
        sequence = deque([seed[0],seed[1]])
        def extend(forward: bool):
            while True:
                at = sequence[-1] if forward else sequence[0]
                if len(adjacency[at]) != 2:
                    break
                options = [edge for edge in adjacency[at] if edge in unseen and owners[edge] == owner_set]
                if len(options) != 1:
                    break
                edge = options[0]
                unseen.remove(edge)
                nxt = edge[0] if edge[1] == at else edge[1]
                if forward:
                    sequence.append(nxt)
                else:
                    sequence.appendleft(nxt)
        extend(True)
        extend(False)
        sequence = list(sequence)
        idx = len(arcs)
        arcs.append([list(point) for point in sequence])
        for a,b in zip(sequence,sequence[1:]):
            edge_refs[(a,b)] = idx
            edge_refs[(b,a)] = ~idx

    def encode_ring(points):
        refs = [edge_refs[(a,b)] for a,b in zip(points,points[1:])]
        if not refs:
            raise ValueError('Anillo cartográfico sin arcos')
        if len(set(refs)) > 1:
            for _ in range(len(refs)):
                if refs[0] != refs[-1]:
                    break
                refs = refs[1:] + refs[:1]
        compact = [ref for i,ref in enumerate(refs) if i == 0 or ref != refs[i-1]]
        if len(compact) > 1 and compact[0] == compact[-1]:
            compact.pop()
        return compact

    geometries = []
    for feature, geom, components in zip(features,simplified,geometries_rings):
        encoded = [[encode_ring(r) for r in rings] for rings in components]
        geometries.append({'type':geom.geom_type, 'arcs':encoded[0] if geom.geom_type == 'Polygon' else encoded,
                           'properties':dict(feature['properties'])})
    return {'type':'Topology','objects':{object_name:{'type':'GeometryCollection','geometries':geometries}},
            'arcs':arcs}


def topologia_budget(features: list[dict], name: str, limit_bytes: int,
                      initial_tolerance: float = 0.002) -> bytes:
    if not 0 <= initial_tolerance <= .05:
        raise ValueError('Tolerancia de simplificación no permitida')
    attempts = list(dict.fromkeys([initial_tolerance, .003, .005, .008, .012, .02, .035, .05]))
    for tolerance in attempts:
        if tolerance < initial_tolerance:
            continue
        topology = _topo(features, name, tolerance)
        content = json.dumps(topology,ensure_ascii=False,allow_nan=False,separators=(',',':')).encode('utf-8')
        if len(content) <= limit_bytes:
            return content
    raise ValueError(f'TopoJSON {name}: no satisface ≤{limit_bytes} bytes sin una simplificación cartográfica adicional revisada')
