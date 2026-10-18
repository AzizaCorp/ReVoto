"""TopoJSON de cobertura con arcos compartidos y vecindad verificada.

Basado en el algoritmo existente de US-06: simplificación conjunta, no individual.
El CRS publicado es EPSG:4326; las distancias de diagnóstico se miden en metros.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from collections import defaultdict, deque
from copy import deepcopy

from shapely import coverage_is_valid, coverage_simplify, make_valid
from shapely.geometry import shape, Polygon, MultiPolygon
import shapely
from shapely.ops import transform
from shapely.strtree import STRtree
from pyproj import Transformer

def _projector(polygons=None):
    if polygons:
        west = min(g.bounds[0] for g in polygons)
        east = max(g.bounds[2] for g in polygons)
        south = min(g.bounds[1] for g in polygons)
        north = max(g.bounds[3] for g in polygons)
        lon, lat = (west + east) / 2, (south + north) / 2
    else:
        lon, lat = -102.0, 23.0
    target = f'+proj=aeqd +lat_0={lat} +lon_0={lon} +datum=WGS84 +units=m +no_defs'
    return Transformer.from_crs('EPSG:4326', target, always_xy=True).transform


def _polygons(features: list[dict], *, repair: bool = True):
    geometries, codes, seen_codes = [], [], set()
    for feature in features:
        code = feature.get('properties', {}).get('cvegeo')
        if not isinstance(code, str) or len(code) not in (2, 5) or not code.isascii() or not code.isdecimal():
            raise ValueError(f'CVEGEO geográfico inválido: {code!r}')
        if code in seen_codes:
            raise ValueError(f'CVEGEO geográfico duplicado: {code}')
        geom = shape(feature['geometry'])
        if geom.is_empty:
            raise ValueError(f'Geometría vacía {code}')
        if not geom.is_valid:
            if not repair:
                raise ValueError(f'Geometría inválida {code}')
            fixed = make_valid(geom)
            if fixed.geom_type not in ('Polygon', 'MultiPolygon') or not fixed.is_valid or fixed.is_empty:
                raise ValueError(f'Reparación no poligonal o inválida {code}')
            if abs(fixed.area - geom.area) > max(1e-10, geom.area * 1e-5):
                raise ValueError(f'Reparación modifica área en exceso {code}')
            geom = fixed
        if geom.geom_type not in ('Polygon', 'MultiPolygon'):
            raise ValueError(f'Tipo geométrico no soportado: {code}')
        if not (-180 <= geom.bounds[0] <= geom.bounds[2] <= 180 and
                -90 <= geom.bounds[1] <= geom.bounds[3] <= 90):
            raise ValueError(f'Coordenadas fuera de EPSG:4326: {code}')
        geometries.append(geom)
        codes.append(code)
        seen_codes.add(code)
    if not geometries:
        raise ValueError('No hay geometrías')
    if not coverage_is_valid(geometries):
        from shapely import coverage_clean
        cleaned = list(coverage_clean(geometries))
        if len(cleaned) != len(geometries):
            raise ValueError('coverage_clean cambió el número de territorios')
        if any(g.is_empty or not g.is_valid or g.geom_type not in ('Polygon', 'MultiPolygon')
               for g in cleaned) or not coverage_is_valid(cleaned):
            raise ValueError('coverage_clean no produjo una cobertura válida')
        projector = _projector(geometries)
        for code, before, after in zip(codes, geometries, cleaned):
            original_m = transform(projector, before)
            repaired_m = transform(projector, after)
            max_shift_allowed_m = 1.0
            edge_a, edge_b = original_m.boundary, repaired_m.boundary
            bounded = (edge_a.buffer(max_shift_allowed_m, quad_segs=2).covers(edge_b)
                       and edge_b.buffer(max_shift_allowed_m, quad_segs=2).covers(edge_a))
            area_pct = (100 * abs(original_m.area - repaired_m.area) / original_m.area
                        if original_m.area > 0 else float('inf'))
            if not bounded or area_pct > 0.001:
                raise ValueError(
                    f'CVEGEO {code}: limpieza excede tolerancias o no puede '
                    f'certificarse con desplazamiento ≤{max_shift_allowed_m} m; '
                    f'cambio_area={area_pct:.9f}%'
                )
        geometries = cleaned
    return codes, geometries


@dataclass
class PreparedCoverage:
    codes: list[str]
    polygons: list
    features: list[dict]
    _adjacency_cache: dict[str, list[str]] | None = field(default=None, repr=False)

    def adjacency(self) -> dict[str, list[str]]:
        if self._adjacency_cache is None:
            self._adjacency_cache = _adjacency(self.codes, self.polygons)
        return self._adjacency_cache


def prepare_coverage(features: list[dict], *, repair: bool = True) -> PreparedCoverage:
    codes, polygons = _polygons(features, repair=repair)
    return PreparedCoverage(codes, polygons, features)


def _adjacency(codes: list[str], polygons, *, min_shared_m: float = 0.01) -> dict[str, list[str]]:
    projector = _projector(polygons)
    projected = [transform(projector, p) for p in polygons]
    tree = STRtree(projected)
    out = {code: set() for code in codes}
    for i, a in enumerate(projected):
        for raw_j in tree.query(a, predicate='intersects'):
            j = int(raw_j)
            if j <= i:
                continue
            if codes[i][:2] != codes[j][:2]:
                continue
            length = a.boundary.intersection(projected[j].boundary).length
            if length > min_shared_m:
                out[codes[i]].add(codes[j])
                out[codes[j]].add(codes[i])
    return {c: sorted(v) for c, v in out.items()}


def vecinos_geometricos(features: list[dict], ine_por_cvegeo: dict[str, int],
                        *, prepared: PreparedCoverage | None = None) -> dict[int, list[int]]:
    coverage = prepared or prepare_coverage(features)
    codes = coverage.codes
    if any(len(c) != 5 for c in codes):
        raise ValueError('Se requieren geometrías municipales CVEGEO de cinco caracteres')
    adj = coverage.adjacency()
    seen = set()
    for code, ident in ine_por_cvegeo.items():
        if code in codes:
            if type(ident) is not int or ident < 1 or ident in seen:
                raise ValueError('Identificador municipal INE ambiguo en misma entidad')
            seen.add(ident)
    return {ine_por_cvegeo[k]: sorted(ine_por_cvegeo[v] for v in neigh if v in ine_por_cvegeo)
            for k, neigh in adj.items() if k in ine_por_cvegeo}


def vecinos_operativos(features: list[dict], id_por_cvegeo: dict[str, str],
                       *, prepared: PreparedCoverage | None = None) -> dict[str, list[str]]:
    coverage = prepared or prepare_coverage(features)
    codes = coverage.codes
    if any(len(c) != 5 for c in codes):
        raise ValueError('La vecindad requiere municipios CVEGEO')
    if len(set(id_por_cvegeo.values())) != len(id_por_cvegeo):
        raise ValueError('Identificador operativo duplicado')
    graph = coverage.adjacency()
    result = {id_por_cvegeo[c]: sorted(id_por_cvegeo[n] for n in graph[c] if n in id_por_cvegeo)
              for c in graph if c in id_por_cvegeo}
    for a, targets in result.items():
        for b in targets:
            if a not in result[b]:
                raise ValueError(f'Vecindad asimétrica: {a}/{b}')
    return result


def _topo(features: list[dict], object_name: str, tolerance: float,
          *, prepared: PreparedCoverage | None = None, progress=None) -> dict:
    start = time.monotonic()
    coverage = prepared or prepare_coverage(features)
    codes, original = coverage.codes, coverage.polygons
    simp = list(coverage_simplify(original, tolerance=tolerance, simplify_boundary=True)) if tolerance else original
    if len(simp) != len(original) or any(not x.is_valid or x.is_empty or
                                        x.geom_type not in ('Polygon','MultiPolygon') for x in simp) or not coverage_is_valid(simp):
        raise ValueError('Simplificación de cobertura no válida')
    if progress is not None:
        progress(f"simplificación conjunta terminada en {time.monotonic()-start:.2f}s; "
                 f"vértices={sum(shapely.get_num_coordinates(g) for g in simp):,}")
    stage = time.monotonic()
    owners, adjacency = defaultdict(set), defaultdict(set)
    geom_rings = []

    def points_of_ring(coords):
        pts = [tuple(round(float(v), 6) for v in xy[:2]) for xy in coords]
        pts = [p for i, p in enumerate(pts) if i == 0 or p != pts[i-1]]
        if pts[0] != pts[-1]:
            pts.append(pts[0])
        if len(set(pts[:-1])) < 3:
            raise ValueError('Anillo degenerado después de ajustar precisión')
        return pts

    for owner, geom in enumerate(simp):
        components = []
        for p in ([geom] if isinstance(geom, Polygon) else list(geom.geoms)):
            rings = [points_of_ring(p.exterior.coords)] + [points_of_ring(r.coords) for r in p.interiors]
            for pts in rings:
                for a, b in zip(pts, pts[1:]):
                    segment = tuple(sorted((a, b)))
                    if segment[0] == segment[1]:
                        raise ValueError('Segmento de longitud cero')
                    owners[segment].add(owner)
                    adjacency[a].add(segment)
                    adjacency[b].add(segment)
            components.append(rings)
        geom_rings.append(components)

    if progress is not None:
        progress(f"segmentos indexados={len(owners):,}; construcción={time.monotonic()-stage:.2f}s")
    stage = time.monotonic()
    arcs, edge_refs = [], {}
    unseen = set(owners)
    for seed in sorted(owners):
        if seed not in unseen:
            continue
        ownerset = owners[seed]
        unseen.remove(seed)
        sequence = deque([seed[0], seed[1]])
        for forward in (True, False):
            while True:
                p = sequence[-1] if forward else sequence[0]
                if len(adjacency[p]) != 2:
                    break
                options = [e for e in adjacency[p] if e in unseen and owners[e] == ownerset]
                if len(options) != 1:
                    break
                e = options[0]
                unseen.remove(e)
                q = e[0] if e[1] == p else e[1]
                if forward:
                    sequence.append(q)
                else:
                    sequence.appendleft(q)
        idx = len(arcs)
        line = list(sequence)
        arcs.append([list(p) for p in line])
        for a, b in zip(line, line[1:]):
            edge_refs[a, b] = idx
            edge_refs[b, a] = ~idx

    def ring_refs(pts):
        refs = [edge_refs[a, b] for a, b in zip(pts, pts[1:])]
        if len(refs) > 1 and refs[0] == refs[-1]:
            cut = next((i for i in range(1, len(refs)) if refs[i] != refs[0]), None)
            if cut is not None:
                refs = refs[cut:] + refs[:cut]
        compact = [v for i, v in enumerate(refs) if i == 0 or refs[i-1] != v]
        if len(compact) > 1 and compact[0] == compact[-1]:
            compact.pop()
        return compact

    if progress is not None:
        progress(f"arcos compartidos={len(arcs):,}; construcción={time.monotonic()-stage:.2f}s")
    stage = time.monotonic()
    geometries = []
    for code, feature, geom, components in zip(codes, features, simp, geom_rings):
        encoded = [[ring_refs(p) for p in rings] for rings in components]
        geometries.append({'type': geom.geom_type,
                           'arcs': encoded[0] if geom.geom_type == 'Polygon' else encoded,
                           'properties': dict(feature['properties']), 'id': code})
    if progress is not None:
        progress(f'codificación de anillos={time.monotonic()-stage:.2f}s')
    return {'type': 'Topology', 'objects': {object_name: {'type': 'GeometryCollection', 'geometries': geometries}},
            'arcs': arcs, 'bbox': list(_bounds(original))}


def _bounds(geoms):
    return (min(g.bounds[0] for g in geoms), min(g.bounds[1] for g in geoms),
            max(g.bounds[2] for g in geoms), max(g.bounds[3] for g in geoms))


def _quantize(topology: dict, q: int) -> dict:
    if type(q) is not int or not 1000 <= q <= 10_000_000:
        raise ValueError('Cuantización fuera de rango [1000, 10000000]')
    b = topology['bbox']
    dx, dy = (b[2] - b[0]) / (q - 1), (b[3] - b[1]) / (q - 1)
    if dx <= 0 or dy <= 0:
        raise ValueError('BBox degenerada para cuantización')
    result = dict(topology)
    result['transform'] = {'scale': [dx, dy], 'translate': b[:2]}
    quantized = []
    for arc in result['arcs']:
        points = [(round((x-b[0])/dx), round((y-b[1])/dy)) for x, y in arc]
        if len(set(points)) < 2:
            raise ValueError('La cuantización colapsó un arco')
        previous = (0, 0)
        deltas = []
        for pt in points:
            deltas.append([pt[0]-previous[0], pt[1]-previous[1]])
            previous = pt
        quantized.append(deltas)
    result['arcs'] = quantized
    return result


def _decode(topo: dict):
    """Decodificador de verificación: maneja arcos compartidos y referencias negativas."""
    factor = topo.get('transform')
    decoded = []
    for arc in topo['arcs']:
        x, y, line = 0, 0, []
        for a, b in arc:
            if factor:
                x += a; y += b
                line.append((x*factor['scale'][0] + factor['translate'][0],
                             y*factor['scale'][1] + factor['translate'][1]))
            else:
                line.append((a, b))
        decoded.append(line)

    def ring(refs):
        coords = []
        for n in refs:
            part = decoded[n] if n >= 0 else list(reversed(decoded[~n]))
            coords.extend(part if not coords else part[1:])
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        return coords

    result = []
    for obj in topo['objects'].values():
        for f in obj['geometries']:
            comps = [f['arcs']] if f['type'] == 'Polygon' else f['arcs']
            polys = [Polygon(ring(c[0]), [ring(hole) for hole in c[1:]]) for c in comps]
            geom = polys[0] if f['type'] == 'Polygon' else MultiPolygon(polys)
            result.append((f['properties']['cvegeo'], geom))
    return result


def validate_topology(content: bytes, features: list[dict], max_error_m: float,
                      *, prepared: PreparedCoverage | None = None, progress=None) -> dict:
    started = time.monotonic()
    topo = json.loads(content)
    if topo.get('type') != 'Topology' or 'arcs' not in topo or not topo.get('objects'):
        raise ValueError('El archivo no es TopoJSON válido')
    coverage = prepared or prepare_coverage(features)
    codes, original = coverage.codes, coverage.polygons
    decoded = _decode(topo)
    if len(decoded) != len(codes) or set(k for k,_ in decoded) != set(codes):
        raise ValueError('TopoJSON pierde o duplica municipios')
    after = dict(decoded)
    if any(not x.is_valid or x.is_empty for x in after.values()):
        raise ValueError('TopoJSON contiene polígonos inválidos tras cuantizar')
    projected = _projector(original)
    max_error = max(transform(projected, g).hausdorff_distance(transform(projected, after[c]))
                    for c, g in zip(codes, original))
    if max_error > max_error_m:
        raise ValueError(f'Error geométrico {max_error:.1f} m > {max_error_m} m')
    adj_old = coverage.adjacency()
    adj_new = _adjacency(codes, [after[c] for c in codes])
    if adj_old != adj_new:
        raise ValueError('La topología cambió las adyacencias municipales')
    if progress is not None:
        progress(f'validación topológica en {time.monotonic()-started:.2f}s')
    return {'geometrias': len(codes), 'error_max_m': round(max_error, 3),
            'arcos': len(topo['arcs']), 'vecindades': sum(map(len, adj_new.values())) // 2}


def topologia_budget(features: list[dict], name: str, limit_bytes: int,
                     initial_tolerance: float = 0.002, *, quantization: int = 100000,
                     max_error_m: float = 6500, progress=None,
                     prepared: PreparedCoverage | None = None,
                     report_out: dict | None = None) -> bytes:
    """Fracasa explícitamente si no se alcanza el presupuesto y calidad solicitados."""
    if not 0 <= initial_tolerance <= 0.05 or type(limit_bytes) is not int or limit_bytes < 1:
        raise ValueError('Configuración cartográfica inválida')
    attempts = sorted(set([initial_tolerance, .003, .005, .008, .012, .02, .035, .05]))
    diagnostics = []
    prepared = prepared or prepare_coverage(features)
    baseline = prepared.adjacency()
    if progress is not None:
        progress(f"cobertura preparada; {len(prepared.codes)} territorios, "
                 f"{sum(shapely.get_num_coordinates(g) for g in prepared.polygons):,} vértices")
    for index, tolerance in enumerate(attempts, 1):
        attempt_started = time.monotonic()
        if progress is not None:
            progress(f"TopoJSON {name}: intento {index}/{len(attempts)}; tolerancia={tolerance}")
        if tolerance < initial_tolerance:
            continue
        try:
            topo = _topo(features, name, tolerance, prepared=prepared, progress=progress)
            topo = _quantize(topo, quantization)
            if progress is not None:
                progress(f"cuantización en {time.monotonic()-attempt_started:.2f}s acumulados")
            content = json.dumps(topo, ensure_ascii=False, allow_nan=False,
                                 separators=(',', ':'), sort_keys=True).encode('utf-8')
            report = validate_topology(content, features, max_error_m, prepared=prepared, progress=progress)
            diagnostics.append(f'{tolerance}: {len(content)} bytes / {report["error_max_m"]} m')
            if progress is not None:
                progress(f"TopoJSON {name}: {len(content):,} bytes; error={report['error_max_m']} m; "
                         f"intento en {time.monotonic()-attempt_started:.2f}s")
            if len(content) <= limit_bytes:
                if report_out is not None:
                    report_out.update(report)
                return content
        except ValueError as exc:
            diagnostics.append(f'{tolerance}: {exc}')
            if progress is not None:
                progress(f"TopoJSON {name}: intento {index} rechazado "
                         f"tras {time.monotonic()-attempt_started:.2f}s: {str(exc)[:180]}")
    raise ValueError(f'TopoJSON {name} no cumple ≤{limit_bytes} bytes y error ≤{max_error_m} m. '
                     + '; '.join(diagnostics))
