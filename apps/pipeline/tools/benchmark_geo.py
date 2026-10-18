"""Benchmark reproducible de vecindad + TopoJSON con un GeoJSON municipal real.

Uso desde apps/pipeline:
 python tools/benchmark_geo.py --geo ../../data/staging/geo/geojson/edo=03/municipios.geojson
Nunca escribe cartografía, marts ni recursos L4.
"""
from __future__ import annotations
import argparse
import json
import time
import sys
from pathlib import Path

import shapely
from shapely.geometry import shape
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from revoto_pipeline.export.topologia import prepare_coverage, vecinos_operativos, topologia_budget


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--geo', type=Path, required=True, help='GeoJSON de municipios')
    parser.add_argument('--cuantizacion', type=int, default=100000)
    parser.add_argument('--presupuesto-kb', type=int, default=300)
    parser.add_argument('--error-max-m', type=float, default=6500.0)
    parser.add_argument('--reporte', type=Path, help='Guardar resumen de benchmark en JSON')
    args = parser.parse_args()
    data = json.loads(args.geo.read_text(encoding='utf-8'))
    features = data['features']
    original = [shape(f['geometry']) for f in features]
    if not shapely.coverage_is_valid(original) and not hasattr(shapely, 'coverage_clean'):
        parser.error('Cobertura inválida: requiere Shapely 2.2+ con coverage_clean()')
    start = time.perf_counter()

    def log(message: str) -> None:
        print(f'[{time.perf_counter()-start:8.2f} s] {message}', flush=True)

    log(f'Shapely {shapely.__version__}; municipios={len(features)}; '
        f'vertices={sum(shapely.get_num_coordinates(g) for g in original):,}')
    coverage = prepare_coverage(features)
    prep_sec = time.perf_counter() - start
    log(f'cobertura validada y limpia: {prep_sec:.2f} s')
    codes_to_ids = {code: code for code in coverage.codes}
    a = time.perf_counter()
    graph = vecinos_operativos(features, codes_to_ids, prepared=coverage)
    adj_sec = time.perf_counter() - a
    log(f'vecinos: {sum(len(v) for v in graph.values()) // 2} pares; {adj_sec:.2f} s')
    a = time.perf_counter()
    quality: dict = {}
    blob = topologia_budget(features, 'municipios', args.presupuesto_kb*1024,
                            quantization=args.cuantizacion,
                            max_error_m=args.error_max_m,
                            progress=log, prepared=coverage, report_out=quality)
    topo_sec = time.perf_counter() - a
    result = {'fuente':str(args.geo), 'shapely':shapely.__version__,
              'municipios':len(features), 'vertices':sum(shapely.get_num_coordinates(g) for g in original),
              'segundos':{'preparacion':round(prep_sec,3), 'vecinos':round(adj_sec,3),
                          'topologia_validada':round(topo_sec,3), 'total':round(time.perf_counter()-start,3)},
              'bytes':len(blob), 'calidad':quality, 'vecindades':sum(map(len,graph.values()))//2}
    log(f'final: {result["segundos"]["total"]:.2f} s; {len(blob):,} bytes')
    # CAMBIO: json.dumps no serializa escalares NumPy/Shapely (p. ej. numpy.intc).
    # Convertimos únicamente escalares compatibles a tipos nativos, sin alterar el reporte.
    def _json_default(value):
        item = getattr(value, 'item', None)
        if callable(item):
            return item()
        if isinstance(value, Path):
            return str(value)
        raise TypeError(f'Object of type {value.__class__.__name__} is not JSON serializable')

    rendered = json.dumps(
        result, ensure_ascii=False, indent=2, default=_json_default
    )
    print(rendered, flush=True)
    if args.reporte:
        args.reporte.parent.mkdir(parents=True, exist_ok=True)
        args.reporte.write_text(rendered, encoding='utf-8')


if __name__ == '__main__':
    main()
