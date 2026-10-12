"""ITER locality -> electoral section -> local district in chosen reference cartography.

Spatial allocation identifies a *reference location*, NOT historical electorate/votes.
Never redistribute historical SV/LN over 2021/2023 district maps automatically.
"""
from __future__ import annotations
from pathlib import Path
import os
import re
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write
from revoto_pipeline.validation.quality import save_report
from revoto_pipeline.geo.inegi_shapes import geo_code, read_inegi_state, read_inegi_rural_points
from revoto_pipeline.geo.temporal import resolve_reference

DMS_RE = re.compile(r'''^\s*(\d{1,3})\s*°\s*(\d{1,2})\s*'\s*([\d.]+)\s*"?\s*([NSEW])\s*$''', re.I)


def dms_to_decimal(value: object, axis: str | None = None) -> float | None:
    """Parse INEGI DMS, e.g. 95°42'19.854\" W; reject invalid tokens."""
    if value is None:
        return None
    
    token = str(value).strip()
    if not token or token == '*':
        return None
    
    if token.isascii() and token.isdigit() and axis in ('lat', 'lon'):
        width = 6 if axis == 'lat' else 7

        if len(token) == width:
            degree_digits = 2 if axis == 'lat' else 3
            degrees = int(token[:degree_digits])
            minutes = int(token[degree_digits:degree_digits + 2])
            seconds = int(token[degree_digits + 2:])

            maximum = 90 if axis == 'lat' else 180

            if degrees > maximum or minutes >= 60 or seconds >= 60:
                return None

            decimal = degrees + minutes / 60 + seconds / 3600
            return -decimal if axis == 'lon' else decimal

        return None
    try:
        decimal = float(value)
        maximum = 90 if axis == "lat" else 180
        return decimal if -maximum <= decimal <= maximum else None
    except ValueError:
        pass
    match = DMS_RE.fullmatch(token)
    if not match or match is None:
        return None
    degrees, minutes, seconds = map(float, match.group(1,2,3))
    direction = match.group(4).upper()
    if axis == 'lat' and direction not in ('N', 'S'):
        return None
    if axis == 'lon' and direction not in ('E', 'W'):
        return None
    maximum = 90 if direction in ('N', 'S') else 180
    if degrees > maximum or minutes >= 60 or seconds >= 60:
        return None

    number = degrees + minutes/60 + seconds/3600
    return -number if direction in ('S','W') else number

def find_territory_shp(cfg: Settings, layer: str, cartography_year: int,
                       estado: int | None = None) -> Path:
    """Resolve 1 real SHP within user's folder; never invent its basename."""
    options = {
        'secciones': ('secciones_dir', 'secciones_archivo'),
        'distritos_locales': ('distritos_locales_dir', 'distritos_locales_archivo'),
    }
    if layer not in options:
        raise ValueError(layer)
    folder_key, name_key = options[layer]
    folder = cfg.path('geo_raw') / str(cfg.geo[folder_key]).format(anio=cartography_year)
    if not folder.is_dir():
        raise FileNotFoundError(f'No existe carpeta electoral: {folder}')
    name = str(cfg.geo.get(name_key, '')).strip()
    if name:
        if ('{edo' in name) and estado is None:
            raise ValueError('El patron de archivo requiere estado')
        name = name.format(anio=cartography_year, edo=estado,
                           edo02=f'{estado:02}' if estado is not None else '')
        target = folder / name
        if target.exists():
            return target
    files = sorted(folder.rglob('*.shp'))
    if len(files) == 1:
        return files[0]
    if not files:
        raise FileNotFoundError(f'{folder}: no hay SHP (configurado: {name!r})')
    raise ValueError(f'{folder}: hay {len(files)} SHP ({[p.name for p in files]}). '
                    f'Configura [geografia].{name_key} para desambiguar.')


def _col(df, candidates: tuple[str, ...], label: str) -> str:
    names = {str(n).upper():str(n) for n in df.columns}
    for n in candidates:
        if n in names:
            return names[n]
    raise ValueError(f'No existe columna {label} entre {list(df.columns)}. '
                     'Inspecciona el DBF antes de mapear campos; no asumir claves.')


def read_electoral_polygons(cfg: Settings, layer: str, year: int, estado: int):
    """Load section/local-district polygons."""
    import geopandas as gpd
    import pyogrio
    import shapely
    from shapely.validation import explain_validity
    path = find_territory_shp(cfg, layer, year, estado)
    info = pyogrio.read_info(path)
    crs = info.get('crs')
    if crs is None:
        raise ValueError(f'{path}: CRS no declarado')
    entity = read_inegi_state(cfg, 'entidades', estado)
    bbox = tuple(entity.to_crs(crs).total_bounds)
    try:
        shapes = pyogrio.read_dataframe(path, bbox=bbox, on_invalid='fix')
    except Exception as err:
        raise ValueError(f'{path}: no fue posible leer la cartografía electoral. Detalle: {type(err).__name__}: {err}') from err
    if shapes.empty:
        raise ValueError(f'{path}: no se encontraron geometrías para estado {estado:02}')
    if shapes.crs is None:
        raise ValueError(f'{path}: CRS perdido durante lectura')
    null_count = int(shapes.geometry.isna().sum())
    if null_count:
        raise ValueError(f'{path}: {null_count} geometrías quedaron NULL después de intentar reparar anillos.')
    invalid_mask = ~shapes.geometry.is_valid
    repair_stats = {'total': len(shapes), 'invalidas_originales': int(invalid_mask.sum()), 'reparadas': 0, 'irreparables': 0, 'razones': {}}
    if invalid_mask.any():
        for geom in shapes.loc[invalid_mask, 'geometry']:
            reason = explain_validity(geom)
            repair_stats['razones'][reason] = repair_stats['razones'].get(reason, 0) + 1
        repaired = shapely.make_valid(shapes.loc[invalid_mask, 'geometry'].values)
        shapes.loc[invalid_mask, 'geometry'] = repaired
        still_invalid = ~shapes.geometry.is_valid
        repair_stats['reparadas'] = int(invalid_mask.sum() - still_invalid.sum())
        repair_stats['irreparables'] = int(still_invalid.sum())
        if still_invalid.any():
            bad = shapes.loc[still_invalid].copy()
            reasons = [explain_validity(g) for g in bad.geometry]
            raise ValueError(f"{path}: {repair_stats['irreparables']} geometrías siguen inválidas después de make_valid(). Ejemplos: {reasons[:5]}")
    def polygonal_only(geom):
        if geom is None or geom.is_empty:
            return None
        if geom.geom_type in ('Polygon', 'MultiPolygon'):
            return geom
        if geom.geom_type == 'GeometryCollection':
            polygons = [g for g in geom.geoms if g.geom_type in ('Polygon', 'MultiPolygon')]
            if not polygons:
                return None
            return shapely.union_all(polygons)
        return None
    shapes['geometry'] = shapes.geometry.map(polygonal_only)
    bad_type = shapes.geometry.isna()
    if bad_type.any():
        raise ValueError(f'{path}: {int(bad_type.sum())} geometrías no contienen componentes poligonales después de reparación.')
    state = _col(shapes, ('CVE_ENT', 'ENTIDAD', 'EDOCVE', 'ENT', 'CVE_EDO'), 'entidad')
    shapes = shapes.loc[shapes[state].map(lambda x: geo_code(x, 2)).eq(f'{estado:02}')].copy()
    if shapes.empty:
        raise ValueError(f'{path}: estado {estado:02} ausente')
    if layer == 'secciones':
        fields = ('SECCION', 'SECC', 'CVE_SECC', 'SECC_ELEC')
        label = 'seccion'
    else:
        fields = ('DEL', 'DISTRITO_L', 'DTTOLOC', 'DISTRITO', 'NUM_DIST', 'NUM_DTTO', 'DTO_LOC')
        label = 'distrito_local'
    column = _col(shapes, fields, label)
    shapes['codigo'] = shapes[column].map(lambda x: geo_code(x, 5))
    invalid_codes = int(shapes['codigo'].isna().sum())
    if invalid_codes:
        raise ValueError(f'{path}: {invalid_codes} claves electorales inválidas.')
    shapes = shapes[['codigo', 'geometry']].dissolve(by='codigo', as_index=False)
    if shapes.geometry.isna().any():
        raise ValueError(f'{path}: geometrías nulas después de dissolve.')
    invalid_after = ~shapes.geometry.is_valid
    if invalid_after.any():
        shapes.loc[invalid_after, 'geometry'] = shapely.make_valid(shapes.loc[invalid_after, 'geometry'].values)
    if not shapes.geometry.is_valid.all():
        raise ValueError(f'{path}: geometría inválida después de dissolve y make_valid.')
    shapes = shapes.to_crs('EPSG:4326')
    return shapes

def section_to_district(sections, districts) -> dict[str, tuple[str | None, str]]:
    """Use full-polygon containment, not centroid or largest-overlap heuristics."""
    import geopandas as gpd
    hits = gpd.sjoin(sections[['codigo','geometry']], districts[['codigo','geometry']],
                     predicate='within', how='left')
    grouped = hits.groupby('codigo_left', sort=False)['codigo_right'].apply(
        lambda values: sorted(set(v for v in values.dropna()))).to_dict()
    result = {}
    for code in sections['codigo']:
        matches = grouped.get(code, [])
        if len(matches) == 1:
            result[code] = (matches[0], 'distrito_unico_contenido')
        elif not matches:
            result[code] = (None, 'seccion_no_contenida_en_distrito')
        else:
            result[code] = (None, 'seccion_multidistrito')
    return result


def assign_points_to_sections(points, sections) -> dict[str, tuple[str | None, str]]:
    """Reject points touching multiple section polygons (boundary ambiguity)."""
    import geopandas as gpd
    joined = gpd.sjoin(points[['cvegeo','geometry']],
                       sections[['codigo','geometry']], predicate='intersects', how='left')
    grouped = joined.groupby('cvegeo', sort=False)['codigo'].apply(
        lambda values: sorted(set(v for v in values.dropna()))).to_dict()
    result = {}
    for code in points.cvegeo:
        candidates = grouped.get(code, [])
        result[code] = ((candidates[0], 'unico') if len(candidates) == 1 else
                        (None, 'ambiguo' if candidates else 'sin_interseccion'))
    return result


def assign_locality_polygons_to_sections(polygons, sections) -> dict[str,str]:
    """Only polygon geometries FULLY inside one electoral section qualify."""
    import geopandas as gpd
    hits = gpd.sjoin(polygons[['cvegeo','geometry']], sections[['codigo','geometry']],
                     predicate='within', how='left')
    grouped = hits.groupby('cvegeo', sort=False)['codigo'].apply(
        lambda values: sorted(set(v for v in values.dropna()))).to_dict()
    return {code: hits[0] for code, hits in grouped.items() if len(hits) == 1}


def build_crosswalk(cfg: Settings, estado: int, anio_eleccion: int, *,
                    census: int | None = None, cartography_year: int | None = None) -> dict:
    """One row per ITER locality with explicit cartography, status and provenance.
    A successful locality assignment is NOT a valid historical section crosswalk.."""
    import geopandas as gpd
    import pandas as pd

    refs = resolve_reference(cfg, anio_eleccion, census, cartography_year)
    census = refs.censo_ref
    year = refs.anio_cartografia
    source = cfg.path('inegi_staging')/f'censo={census}'/'iter.parquet'
    if not source.exists():
        raise FileNotFoundError(f'Faltan ITER: {source}')
    read_inegi_state(cfg, 'municipios', estado)
    locality_shapes = read_inegi_state(cfg, 'localidades', estado)
    rural_points = (read_inegi_rural_points(cfg, estado)
                    if int(cfg.geo.get('inegi_marco_anio', 0)) == census else None)
    sections = read_electoral_polygons(cfg, 'secciones', year, estado)
    districts = read_electoral_polygons(cfg, 'distritos_locales', year, estado)
    section_district = section_to_district(sections, districts)
    
    con = connection(cfg)
    try:
        rows = con.execute(f'''SELECT cvegeo, ENTIDAD, LATITUD, LONGITUD
            FROM read_parquet('{sql_path(source)}')
            WHERE record_level='localidad_regular' AND TRY_CAST(ENTIDAD AS INTEGER)={estado}''').fetchall()
        if not rows:
            raise ValueError(f'ITER {census}: No hay localidades regulares para entidad {estado}')
        local = pd.DataFrame(rows,columns=['cvegeo', 'entidad', 'lat_raw', 'lon_raw'])
        local["origen_punto"] = "iter"
        if local.cvegeo.duplicated().any():
            raise ValueError('ITER contiene clave localidad duplicada')
        local['lat'] = local['lat_raw'].map(lambda v: dms_to_decimal(v, axis='lat'))
        local['lon'] = local['lon_raw'].map(lambda v: dms_to_decimal(v, axis='lon'))
        good = local['lat'].between(-90,90) & local['lon'].between(-180,180)
        if rural_points is not None and not rural_points.empty:
            rural_lookup = {row.cvegeo:row.geometry for row in rural_points.itertuples(index=False)
                                        if row.geometry.geom_type == 'Point'}
            for index in local.index[~good]:
                pt = rural_lookup.get(local.at[index, 'cvegeo'])
                if pt is not None:
                    local.at[index, 'lat'], local.at[index, 'lon'] = pt.y, pt.x
                    local.at[index, 'origen_punto'] = 'inegi_00lpr'
            good = local['lat'].between(-90, 90) & local['lon'].between(-180, 180)
        points = gpd.GeoDataFrame(local.loc[good,['cvegeo']].copy(),
             geometry = gpd.points_from_xy(local.loc[good, 'lon'],local.loc[good, 'lat']),
             crs = 'EPSG:4326')
        point_match = assign_points_to_sections(points, sections)
        marco_year = int(cfg.geo.get('inegi_marco_anio', 0))
        # 00l geometries of an unknown/different vintage cannot override ITER censo.
        polygon_match = (assign_locality_polygons_to_sections(locality_shapes, sections)
                         if marco_year == census else {})
        records = []
        for record in local.itertuples(index = False):
            section, status = point_match.get(record.cvegeo, (None, 'sin_coordenadas'))
            method = ('punto_rural_00lpr' if record.origen_punto=='inegi_00lpr'
                       else 'punto_representativo_iter')
            district, district_status = (section_district.get(section, (None, 'sin_seccion'))
                                 if section else (None, 'sin_seccion'))
            # Polygon overrides point only when the entire polygon is inside ONE section;
            # disagreement is not resolved silently and requires review.
            contained = polygon_match.get(record.cvegeo)
            if contained:
                if section is not None and section != contained:
                    section, status = None, 'desacuerdo_poligono_punto'
                else:
                    section, status, method = contained, 'unico', 'poligono_localidad_contenido'
                    district, district_status = (section_district.get(section, (None,'sin_seccion'))
                                                 if section else (None,'sin_seccion'))
            records.append({'cvegeo': record.cvegeo,'entidad':f'{estado:02}',
                            'anio_eleccion' : anio_eleccion, 'censo_ref' : census, 'anio_cartografia' : year,
                            'anio_marco_inegi' : marco_year if marco_year else None,
                            'seccion_referencia' : int(section) if section else None,
                            'distrito_local_referencia' : int(district) if district else None,
                            'status_seccion' : status, 'status_distrito' : district_status,
                            'metodo_localidad' : method,
                            'referencia_retroactiva' : refs.referencia_territorial_historica,
                            'equivalencia_historica_verificada' : False})
        result = pd.DataFrame.from_records(records)
        con.register('geo_result',result)
        target = (cfg.path('geo_staging') / 'crosswalk' / f'edo={estado:02}' /
                  f'anio_eleccion={anio_eleccion}' / 'localidad_seccion_distrito.parquet')
        tmp = atomic_write(con, '''SELECT cvegeo, entidad,
                    CAST(anio_eleccion AS INTEGER) AS anio_eleccion,
                    CAST(censo_ref AS INTEGER) AS censo_ref,
                    CAST(anio_cartografia AS INTEGER) AS anio_cartografia,
                    TRY_CAST(anio_marco_inegi AS INTEGER) AS anio_marco_inegi,
                    TRY_CAST(seccion_referencia AS INTEGER) AS seccion_referencia,
                    TRY_CAST(distrito_local_referencia AS INTEGER) AS distrito_local_referencia,
                    status_seccion, status_distrito, metodo_localidad,
                    CAST(referencia_retroactiva AS BOOLEAN) AS referencia_retroactiva,
                    CAST(equivalencia_historica_verificada AS BOOLEAN)
                    AS equivalencia_historica_verificada FROM geo_result''', target)
        os.replace(tmp, target)
        report = {'estado':f'{estado:02}', 'anio_eleccion':anio_eleccion,
                  'censo_ref':census, 'anio_cartografia':year,
                  'anio_marco_inegi':marco_year if marco_year else None,
                  'poligonos_localidad_compatibles_censo':marco_year == census,
                  'rows':len(records), 
                  'status_seccion':{k:int(v) for k,v in result.status_seccion.value_counts().items()},
                  'status_distrito':{k:int(v) for k,v in result.status_distrito.value_counts().items()},
                  'metodos':{k:int(v) for k,v in result.metodo_localidad.value_counts().items()},
                  'fuente_secciones':str(find_territory_shp(cfg,'secciones',year,estado).relative_to(cfg.path('geo_raw'))),
                  'fuente_distritos':str(find_territory_shp(cfg,'distritos_locales',year,estado).relative_to(cfg.path('geo_raw'))),
                  'nota':refs.nota,
                  'limitacion':'No asigna LN/SV de secciones historicas a distritos de referencia.'}
        save_report(cfg.path('reportes')/'geo'/f'edo={estado:02}_censo={census}_eleccion={anio_eleccion}.json', report)
        return report
    finally:
        con.close()
