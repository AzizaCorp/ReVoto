"""Spatial joins of census locality point coordinates to year-specific electoral sections."""
from __future__ import annotations
from pathlib import Path
import os
import re
from ..config import Settings, connection, sql_path
from ..sql_utils import atomic_write
from ..validation.quality import save_report

DMS_RE = re.compile(r'''^\s*(\d{1,3})\s*°\s*(\d{1,2})\s*'\s*([\d.]+)\s*"?\s*([NSEW])\s*$''', re.I)


def dms_to_decimal(value: object) -> float | None:
    """Parse INEGI DMS, e.g. 95°42'19.854\" W; reject invalid tokens."""
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        decimal = float(value)
        return decimal if -180 <= decimal <= 180 else None
    except ValueError:
        pass
    match = DMS_RE.fullmatch(value.strip())
    if not match:
        return None
    degrees, minutes, seconds = map(float, match.group(1,2,3))
    direction = match.group(4).upper()
    if minutes >= 60 or seconds >= 60 or degrees > (90 if direction in ('N','S') else 180):
        return None
    number = degrees + minutes/60 + seconds/3600
    return -number if direction in ('S','W') else number


def build_crosswalk(cfg: Settings, estado: int, census: int, cartography_year: int) -> dict:
    """Point-to-polygon assignment; ambiguous/absent matches remain explicit."""
    import geopandas as gpd
    import pandas as pd
    source = cfg.path('inegi_staging')/f'censo={census}'/'iter.parquet'
    pattern = cfg.geo['secciones_pattern'].format(anio=cartography_year)
    shp = cfg.path('geo_raw') / pattern
    if not shp.exists() or not source.exists():
        raise FileNotFoundError(f'Faltan ITER o SECCION SHP: {source} / {shp}')
    con = connection(cfg)
    try:
        rows = con.execute(f'''SELECT cvegeo, ENTIDAD, LATITUD, LONGITUD
            FROM read_parquet('{sql_path(source)}')
            WHERE record_level='localidad_regular' AND TRY_CAST(ENTIDAD AS INTEGER)={estado}''').fetchall()
        if not rows:
            raise ValueError(f'No hay localidades regulares para entidad {estado}')
        local = pd.DataFrame(rows,columns=['cvegeo','entidad','lat_raw','lon_raw'])
        local['lat'] = local['lat_raw'].map(dms_to_decimal)
        local['lon'] = local['lon_raw'].map(dms_to_decimal)
        good = local['lat'].between(-90,90) & local['lon'].between(-180,180)
        points = gpd.GeoDataFrame(local.loc[good,['cvegeo','entidad']],
             geometry=gpd.points_from_xy(local.loc[good,'lon'],local.loc[good,'lat']),
             crs='EPSG:4326')
        shapes = gpd.read_file(shp)
        state_col = cfg.geo['entidad_column']
        section_col = cfg.geo['seccion_column']
        for col in (state_col,section_col):
            if col not in shapes:
                raise ValueError(f'Columna {col} no disponible en {shp}; configurar config.toml')
        if shapes.crs is None:
            raise ValueError('SHP sin CRS declarado: no se puede asignar con precisión')
        shapes = shapes.loc[pd.to_numeric(shapes[state_col],errors='coerce').eq(estado)].copy()
        if shapes.empty:
            raise ValueError(f'SHP sin polígonos de entidad {estado}')
        if shapes.geometry.isna().any() or not shapes.geometry.is_valid.all():
            raise ValueError('SHP contiene geometrías nulas o inválidas; reparar con control explícito')
        shapes = shapes[[section_col,'geometry']].to_crs('EPSG:4326')
        joined = gpd.sjoin(points, shapes, how='left', predicate='intersects')
        matches: dict[str, list[str]] = {}
        for code, section in zip(joined['cvegeo'], joined[section_col]):
            if pd.notna(section):
                matches.setdefault(str(code),[]).append(str(section))
        invalid_coords = set(local.loc[~good,'cvegeo'])
        records = []
        for code, ent in zip(local['cvegeo'], local['entidad']):
            candidates = matches.get(str(code), [])
            if code in invalid_coords:
                status, section = 'sin_coordenadas', None
            elif len(candidates) == 0:
                status, section = 'sin_interseccion', None
            elif len(candidates) == 1:
                status, section = 'unico', candidates[0]
            else:
                status, section = 'ambiguo', None
            records.append({'cvegeo':code,'entidad':ent,'seccion':section,
                'censo_ref':census,'anio_cartografia':cartography_year,'status_match':status})
        result = pd.DataFrame.from_records(records)
        con.register('crosswalk_result',result)
        target = cfg.path('geo_staging')/f'censo={census}'/f'anio_cartografia={cartography_year}'/f'edo={estado:02}'/'localidad_seccion.parquet'
        tmp = atomic_write(con, '''SELECT cvegeo, entidad,
                    TRY_CAST(seccion AS INTEGER) AS seccion,
                    censo_ref,anio_cartografia,status_match
                    FROM crosswalk_result''',target)
        os.replace(tmp,target)
        report = {'estado':f'{estado:02}', 'censo_ref':census, 'anio_cartografia':cartography_year,
                  'rows':len(records), 'statuses':{k:int(v) for k,v in result['status_match'].value_counts().to_dict().items()},
                  'method':'Punto representativo de localidad, NO intersección territorial completa'}
        save_report(cfg.path('reportes')/'geo'/f'edo={estado:02}_censo={census}_carto={cartography_year}.json',report)
        return report
    finally:
        con.close()
