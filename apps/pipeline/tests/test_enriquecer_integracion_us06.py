"""Integración sintética de 32 estados. NO constituye publicación oficial INE."""
from __future__ import annotations
import json
from pathlib import Path
from shapely.geometry import box, mapping
from revoto_pipeline.export import enriquecer
from revoto_pipeline.export.metricas import YEARS, fraction


def write(path, data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')


def test_32_estados_topo_vecinos_perfil_y_calidad(tmp_path: Path, monkeypatch):
    root, staged = tmp_path/'repo',tmp_path/'stage'
    catalog = []
    counts = {}
    national = {y:[0,0,0,0] for y in YEARS}
    for edo in range(1,33):
        sx = -112 + (edo-1)%8*2.6
        sy = 14 + (edo-1)//8*2.6
        shapes = [box(sx,sy,sx+1,sy+1),box(sx+1,sy,sx+2,sy+1)]
        geo_dir=root/'apps/web/public/data/geometria'/f'edo={edo:02}'
        write(geo_dir/'municipios.geojson',{'type':'FeatureCollection','features':[
            {'properties':{'cvegeo':f'{edo:02}{i:03}'},'geometry':mapping(g),'type':'Feature'}
            for i,g in enumerate(shapes,1)]})
        write(geo_dir/'entidades.geojson',{'type':'FeatureCollection','features':[
            {'properties':{'cvegeo':f'{edo:02}'},'geometry':mapping(box(sx,sy,sx+2,sy+1)),
             'type':'Feature'}]})
        items=[]
        for i in (1,2):
            uid=f'operativo_{edo:02}_{i}'
            path=f'municipio/{edo:02}_estado/{edo:02}{i:03}_m{i}.json'
            write(staged/path,{'territorio':{'nivel':'municipio','cve':i,'cveEntidad':edo,
                 'nombre':f'M{i}','id_operativo':uid,'cvegeo':f'{edo:02}{i:03}'},
                 'identidad_verificada':True,'suprimido':False,'fuente':'INE','elecciones':[
                 {'anio':2024,'tipo':'presidencial','participacion':.5,'lista_nominal':200,
                  'por_edad':{},'por_sexo':{}}]})
            items.append({'cve':i,'nombre':f'M{i}','id_operativo':uid,
                          'archivo':path,'cvegeo':f'{edo:02}{i:03}',
                          'identidad_verificada':True,'participacion':{'2024':.5}})
        counts[edo]={}
        elections=[]
        for ix,y in enumerate(YEARS):
            vals = (1000, 450+10*ix, 550-10*ix, 0)
            counts[edo][y] = vals
            for j,x in enumerate(vals):
                national[y][j] += x
            elections.append({'anio':y,'tipo':'presidencial' if y in (2012,2018,2024) else 'intermedia',
                'participacion':fraction(vals,1),'lista_nominal':1000,'por_edad':{},'por_sexo':{}})
        ep=f'entidad/{edo:02}_estado.json'
        write(staged/ep,{'territorio':{'nivel':'entidad','cve':edo,'cveEntidad':edo,'nombre':f'E{edo}'},
                         'fuente':'INE','elecciones':elections,'municipios':items})
        write(staged/f'entidad/{edo:02}.json',{'territorio':{'nivel':'entidad','nombre':f'E{edo}'},
                                             'fuente':'INE','elecciones':elections,'municipios':items})
        catalog.append({'cve':edo,'nombre':f'E{edo}','archivo':ep})
    write(staged/'catalogos/entidades.json',catalog)
    write(staged/'nacional.json',{'territorio':{'nivel':'nacional','nombre':'México'},
                                'fuente':'INE', 'elecciones':[{'anio':y,'tipo':'presidencial' if y in (2012,2018,2024) else 'intermedia',
                                 'participacion':fraction(tuple(national[y]),1), 'lista_nominal':32000,
                                 'por_edad':{},'por_sexo':{}} for y in YEARS]})
    monkeypatch.setattr(enriquecer,'_reference_counts',lambda r,ys:(counts,national,[],None))
    result = enriquecer.enriquecer_staged(staged,root,years=YEARS)
    q=result['calidad']
    assert q['cobertura']['entidades']==32
    assert q['geometria']['estados_topojson']==32
    assert q['cobertura']['cobertura_vecindad']==64
    assert q['integridad']['estado']=='verificada'
    assert q['integridad']['documentos_validados']==98
    assert q['oficial']['estado']=='no_verificada'
    assert (staged/'geo/entidades.topo.json').is_file()
    example=json.loads((staged/'municipio/01_estado/01001_m1.json').read_text())
    assert example['vecinos']==['operativo_01_2']
    estatal=json.loads((staged/'entidad/01_estado.json').read_text())
    assert estatal['perfil_estatal']['metodologia']=='perfil_descriptivo_estatal_v1'
    assert 'arquetipo' not in estatal
