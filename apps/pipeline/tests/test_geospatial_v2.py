"""Synthetic geometries; no original INEGI/INE SHPs required."""
from pathlib import Path
import pytest
from shapely.geometry import Polygon, Point

geopandas = pytest.importorskip('geopandas')
from revoto_pipeline.config import load_config, CONFIG_FILE
from revoto_pipeline.geo.temporal import resolve_reference
from revoto_pipeline.geo.inegi_shapes import (geo_code, read_inegi_layer, read_inegi_state)
from revoto_pipeline.geo.crosswalk import (dms_to_decimal, find_territory_shp, read_electoral_polygons,
    section_to_district, assign_points_to_sections, assign_locality_polygons_to_sections)


def config_for(tmp_path):
    return load_config(CONFIG_FILE, tmp_path)


def shape_frame(codes: list[str], geometries: list[Polygon], column: str):
    return geopandas.GeoDataFrame({column: codes}, geometry=geometries, crs='EPSG:4326')


def write_shp(folder: Path, name: str, df):
    folder.mkdir(parents=True, exist_ok=True)
    df.to_file(folder / name)


def test_temporal_reference_2009_2024(tmp_path):
    cfg = config_for(tmp_path)
    assert resolve_reference(cfg, 2009).anio_cartografia == 2021
    assert resolve_reference(cfg, 2021).anio_cartografia == 2021
    assert resolve_reference(cfg, 2024).anio_cartografia == 2023
    assert resolve_reference(cfg, 2009).referencia_territorial_historica
    assert not resolve_reference(cfg, 2024).referencia_territorial_historica
    with pytest.raises(ValueError,match='requiere cartografia 2023'):
        resolve_reference(cfg,2024,cartografia=2021)
    with pytest.raises(ValueError,match='requiere censo 2010'):
        resolve_reference(cfg,2009,censo=2020)


def test_code_padding_without_silent_inference():
    assert geo_code('1',2) == '01'
    assert geo_code('0001',4) == '0001'
    assert geo_code('bad',2) is None
    assert geo_code('-1',2) is None
    assert geo_code('123',2) is None


def test_section_to_district_containment_and_boundary_ambiguity():
    west = Polygon([(0,0),(1,0),(1,1),(0,1)])
    east = Polygon([(1,0),(2,0),(2,1),(1,1)])
    both = Polygon([(0,0),(2,0),(2,1),(0,1)])
    sec=shape_frame(['00001','00002'],[west,east],'codigo')
    dis=shape_frame(['00008'],[both],'codigo')
    assert section_to_district(sec,dis) == {
       '00001':('00008','distrito_unico_contenido'),
       '00002':('00008','distrito_unico_contenido')}
    points = geopandas.GeoDataFrame({'cvegeo':['010010001','010010002']},
              geometry=[Point(0.5,0.5), Point(1,0.5)], crs='EPSG:4326')
    matches = assign_points_to_sections(points,sec)
    assert matches['010010001'] == ('00001','unico')
    assert matches['010010002'] == (None,'ambiguo')
    locs=shape_frame(['010010001','010010002'],[
       Polygon([(0.2,0.2),(0.4,0.2),(0.4,0.4),(0.2,0.4)]),
       Polygon([(0.9,0.2),(1.1,0.2),(1.1,0.4),(0.9,0.4)])], 'cvegeo')
    poly = assign_locality_polygons_to_sections(locs,sec)
    assert poly == {'010010001':'00001'}


def test_user_shapefile_paths_and_state_filter(tmp_path):
    cfg = config_for(tmp_path)
    shape_dir = cfg.path('geo_raw')/'inegi'
    poly = Polygon([(-103,20),(-101,20),(-101,22),(-103,22)])
    write_shp(shape_dir,'00ent.shp',shape_frame(['01'],[poly],'CVEGEO'))
    write_shp(shape_dir,'00mun.shp',shape_frame(['01001'],[poly],'CVEGEO'))
    write_shp(shape_dir,'00l.shp',shape_frame(['010010001'],[poly],'CVEGEO'))
    assert list(read_inegi_state(cfg,'municipios',1).cvegeo) == ['01001']
    assert list(read_inegi_state(cfg,'localidades',1).cvegeo) == ['010010001']
    write_shp(cfg.path('geo_raw')/'secciones'/'2021','shapes.shp',
              shape_frame(['1'],[poly],'SECCION').assign(CVE_ENT='01'))
    write_shp(cfg.path('geo_raw')/'distritos-locales'/'2021','dl.shp',
              shape_frame(['4'],[poly],'DISTRITO').assign(CVE_ENT='01'))
    assert find_territory_shp(cfg,'secciones',2021).name == 'shapes.shp'
    assert list(read_electoral_polygons(cfg,'secciones',2021,1).codigo) == ['00001']
    assert list(read_electoral_polygons(cfg,'distritos_locales',2021,1).codigo) == ['00004']
    write_shp(cfg.path('geo_raw')/'secciones'/'2021','extra.shp',
              shape_frame(['2'],[poly],'SECCION').assign(CVE_ENT='01'))
    with pytest.raises(ValueError,match='hay 2 SHP'):
        find_territory_shp(cfg,'secciones',2021)

def test_compact_dms_inegi_2010():
    assert dms_to_decimal("215251", axis="lat") == pytest.approx(21.8808333333)
    assert dms_to_decimal("1021746", axis="lon") == pytest.approx(-102.2961111111)
    assert dms_to_decimal("215260", axis="lat") is None
    assert dms_to_decimal("1026060", axis="lon") is None
    assert dms_to_decimal("*", axis="lat") is None