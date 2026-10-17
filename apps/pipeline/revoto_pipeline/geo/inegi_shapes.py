"""Read and validate INEGI 00ent, 00mun and 00l layers without assuming their schema.

00l usually comprises amanzanadas, NOT all ITER regular localities.
00lpr (if present) is a supplementary point source, not a polygon substitute.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from typing import Any
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write
from revoto_pipeline.validation.quality import save_report

LAYER_IDS = ('entidades', 'municipios', 'localidades')
COLUMN_CANDIDATES = {
    'entidad': ('CVE_ENT', 'CVE_ENTIDAD', 'ENTIDAD', 'ENT', 'EDOCVE'),
    'municipio': ('CVE_MUN', 'CVE_MPIO', 'MUN', 'MPIOCVE'),
    'localidad': ('CVE_LOC', 'LOC', 'LOCALIDAD'),
    'cvegeo': ('CVEGEO', 'CVE_GEO'),
}


def get_field(columns: Any, kind: str, *, required: bool = True) -> str | None:
    """Resolve published alternative DBF field names, fail on absent required keys."""
    lookup = {str(c).upper(): str(c) for c in columns}
    available = [lookup[c] for c in COLUMN_CANDIDATES[kind] if c in lookup]
    if not available and required:
        raise ValueError(f'Falta campo geográfico {kind}; columnas disponibles: {list(columns)}')
    return available[0] if available else None


def geo_code(value: object, width: int) -> str | None:
    """Normalize a verified nonnegative numeric geographic code, preserving zeros."""
    if value is None:
        return None
    token = str(value).strip()
    if token.endswith('.0'):
        token = token[:-2]
    return token.zfill(width) if token.isascii() and token.isdigit() and len(token) <= width else None


def _gdf_codes(gdf, layer: str):
    """Build CVEGEO from the documented INEGI code fields or existing CVEGEO."""
    if layer not in LAYER_IDS:
        raise ValueError(f'Capa desconocida {layer}')
    existing = get_field(gdf.columns, 'cvegeo', required=False)
    widths = {'entidades': 2, 'municipios': 5, 'localidades': 9}
    width = widths[layer]
    if existing is not None:
        codes = gdf[existing].map(lambda v: geo_code(v, width))
    else:
        entity = get_field(gdf.columns, 'entidad')
        parts = [gdf[entity].map(lambda v: geo_code(v, 2))]
        if layer in ('municipios', 'localidades'):
            mun = get_field(gdf.columns, 'municipio')
            parts.append(gdf[mun].map(lambda v: geo_code(v, 3)))
        if layer == 'localidades':
            loc = get_field(gdf.columns, 'localidad')
            parts.append(gdf[loc].map(lambda v: geo_code(v, 4)))
        codes = parts[0]
        for part in parts[1:]:
            codes = codes + part
    if codes.isna().any():
        raise ValueError(f'{layer}: {int(codes.isna().sum())} claves geograficas invalidas')
    if codes.duplicated().any():
        # May be multipart represented as repeated geometries; do not pick a piece.
        raise ValueError(f'{layer}: CVEGEO duplicado; examinar y disolver explicitamente')
    return codes


def read_inegi_layer(cfg: Settings, layer: str, estado: int | None = None, *,
                     bbox: tuple[float, float, float, float] | None = None):
    """Read geometries, filter entity precisely by numeric CVEGEO, check CRS/validity."""
    import geopandas as gpd
    if layer not in LAYER_IDS:
        raise ValueError(layer)
    path = cfg.path('geo_raw') / str(cfg.geo[f'inegi_{layer}'])
    if not path.exists():
        raise FileNotFoundError(f'Falta shapefile INEGI {layer}: {path} (y su .shx/.dbf/.prj)')
    layer_df = gpd.read_file(path, bbox=bbox)
    if layer_df.crs is None:
        raise ValueError(f'{path}: CRS no declarado')
    if layer_df.geometry.isna().any() or not layer_df.geometry.is_valid.all():
        raise ValueError(f'{path}: geometrías vacias o invalidas')
    if not layer_df.geom_type.isin(['Polygon', 'MultiPolygon']).all():
        raise ValueError(f'{path}: se esperaban polígonos, hay {layer_df.geom_type.unique()}')
    codes = _gdf_codes(layer_df, layer)
    layer_df = layer_df.copy()
    layer_df['cvegeo'] = codes
    if estado is not None:
        layer_df = layer_df.loc[layer_df['cvegeo'].str[:2].eq(f'{estado:02}')].copy()
        if layer_df.empty:
            raise ValueError(f'{path}: sin geometrías para entidad {estado:02}')
    return layer_df[['cvegeo', 'geometry']].to_crs('EPSG:4326')


def read_inegi_state(cfg: Settings, layer: str, estado: int):
    """Use entity polygon's bounding box to limit national polygon reads."""
    if layer == 'entidades':
        return read_inegi_layer(cfg, layer, estado)
    import geopandas as gpd
    entity = read_inegi_layer(cfg, 'entidades', estado)
    path = cfg.path('geo_raw') / str(cfg.geo[f'inegi_{layer}'])
    if not path.exists():
        raise FileNotFoundError(path)
    header = gpd.read_file(path, rows=0)
    if header.crs is None:
        raise ValueError(f'{path}: CRS no declarado')
    bounds = tuple(entity.to_crs(header.crs).total_bounds)
    return read_inegi_layer(cfg, layer, estado, bbox=bounds)



def read_inegi_rural_points(cfg: Settings, estado: int):
    """Optionally read 00lpr; absent file is expected, malformed present file fails."""
    import geopandas as gpd
    relative = str(cfg.geo.get('inegi_localidades_puntos', '')).strip()
    if not relative:
        return None
    path = cfg.path('geo_raw') / relative
    if not path.exists():
        return None
    entity = read_inegi_layer(cfg, 'entidades', estado)
    header = gpd.read_file(path,rows=0)
    if header.crs is None:
        raise ValueError(f'{path}: CRS no declarado')
    bounds = tuple(entity.to_crs(header.crs).total_bounds)
    shapes = gpd.read_file(path,bbox=bounds)
    if shapes.crs is None or shapes.geometry.isna().any() or not shapes.geometry.is_valid.all():
        raise ValueError(f'{path}: geometria/CRS invalida')
    if not shapes.geom_type.isin(['Point','MultiPoint']).all():
        raise ValueError(f'{path}: 00lpr debe tener geometria puntual')
    shapes = shapes.copy()
    shapes['cvegeo'] = _gdf_codes(shapes,'localidades')
    shapes = shapes.loc[shapes.cvegeo.str[:2] == f'{estado:02}', ['cvegeo','geometry']]
    # MultiPoint positions are ambiguous and are not turned into a single point.
    return shapes.to_crs('EPSG:4326')


def build_inegi_geo_layers(cfg: Settings, estado: int) -> dict:
    """Export state/municipality geometry and municipal key index for validated joins.

    GeoJSON geometries are simplified only for the browser; the raw SHPs stay unchanged.
    """
    from shapely.geometry import mapping
    entities = read_inegi_state(cfg, 'entidades', estado)
    municipalities = read_inegi_state(cfg, 'municipios', estado)
    localities = read_inegi_state(cfg, 'localidades', estado)
    rural_points = read_inegi_rural_points(cfg, estado)
    municipalities['cve_ent'] = municipalities['cvegeo'].str[:2]
    municipalities['cve_mun'] = municipalities['cvegeo'].str[2:]
    if not set(municipalities['cve_ent']) == {f'{estado:02}'}:
        raise ValueError('Municipios fuera del estado')
    # L2 cartográfico interno: NO escribir directamente en public/data.
    # export_web genera después TopoJSON validado/versionado con manifest atómico.
    out_geo = cfg.path('geo_staging') / 'geojson' / f'edo={estado:02}'
    out_geo.mkdir(parents=True, exist_ok=True)
    tolerance = float(cfg.geo.get('geojson_simplify_degrees', 0.002))
    if not 0 <= tolerance <= 0.05:
        raise ValueError('Simplificacion fuera de intervalo seguro; revisar CRS/unidades')
    budget_file=cfg.root/'budget.json'
    budget=json.loads(budget_file.read_text(encoding='utf-8')) if budget_file.exists() else {}
    entity_bytes=int(budget.get('entidad_kb',300))*1024
    for name, layer in [('entidades', entities), ('municipios', municipalities)]:
        features = []
        for entry in layer.itertuples(index=False):
            # Dejar contornos originales aquí: simplificar cada municipio
            # por separado rompería fronteras compartidas. La simplificación
            # de cobertura se ejecuta en export/topologia.py.
            geometry = entry.geometry
            if geometry.is_empty or not geometry.is_valid or geometry.geom_type not in ('Polygon','MultiPolygon'):
                raise ValueError(f'GeoJSON invalido despues de simplificar: {entry.cvegeo}')
            features.append({'type':'Feature', 'properties':{'cvegeo':entry.cvegeo},
                             'geometry':mapping(geometry)})
        out = out_geo / f'{name}.geojson'
        temp = out.with_suffix('.pending.geojson')
        temp.write_text(json.dumps({'type':'FeatureCollection','features':features},
                                  ensure_ascii=False, separators=(',', ':')),encoding='utf-8')
        # No aplicar límite de navegador a los GeoJSON de staging. El límite
        # contractual de 300 KB corresponde al TopoJSON *final*.
        os.replace(temp, out)
    con = connection(cfg)
    try:
        # Tiny index of real 00mun geometries; never infer mapping from names.
        idx = municipalities[['cvegeo']].copy()
        con.register('municipios_shapes', idx)
        dst = cfg.path('geo_staging')/'inegi'/f'edo={estado:02}'/'municipios_index.parquet'
        marco = int(cfg.geo.get('inegi_marco_anio', 0))
        tmp = atomic_write(con, f'SELECT cvegeo, NULLIF({marco}, 0)::INTEGER AS anio_marco_inegi FROM municipios_shapes', dst)
        os.replace(tmp, dst)
    finally:
        con.close()
    report = {'estado':f'{estado:02}', 'entidades':len(entities),
              'municipios':len(municipalities), 'localidades_amanzanadas':len(localities),
              'localidades_rurales_puntuales':None if rural_points is None else len(rural_points),
              'localidades_no_cubiertas':'00l NO equivale al universo ITER',
              'geojson_simplificacion_grados':0,
              'topojson_tolerancia_inicial_grados':tolerance,
              'anio_marco_inegi':int(cfg.geo.get('inegi_marco_anio',0)) or None}
    save_report(cfg.path('reportes')/'geo'/f'edo={estado:02}_capas_inegi.json',report)
    return report
