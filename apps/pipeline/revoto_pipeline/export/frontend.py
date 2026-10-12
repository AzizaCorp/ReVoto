"""Specialized partitioned JSON read models; never export below the RN-05 threshold."""
from __future__ import annotations
import json
import os
from pathlib import Path
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.geo.temporal import resolve_reference
from revoto_pipeline.model.reglas import publish_count
from revoto_pipeline.export.contract import validate_payload


def _write_json(path: Path, payload: dict) -> None:
    validate_payload(payload)
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix('.pending.json')
    tmp.write_text(json.dumps(payload,ensure_ascii=False,allow_nan=False,
                              separators=(',',':')),encoding='utf-8')
    os.replace(tmp,path)


def _rows(con,path:Path):
    if not path.is_file():
        raise FileNotFoundError(path)
    result=con.execute(f"SELECT * FROM read_parquet('{sql_path(path)}')")
    columns=[d[0] for d in result.description]
    return [dict(zip(columns,row)) for row in result.fetchall()]


def _published(row: dict, threshold: int, *, incluir_del: bool) -> dict:
    ln=row.get('LN')
    public=publish_count(row.get('SV'),ln,threshold)
    keys=('AELEC','EDOCVE','MPIOCVE','SECCION','SEXO','grupo_edad',
          'cvegeo_municipal','cve_seccion','cve_distrito_local','DEL')
    record={k:v for k,v in row.items() if k in keys and (incluir_del or k!='DEL')}
    record['publicacion']=public['status']
    for key in ('LN','SV','NV','NS'):
        record[key.lower()]=publish_count(row.get(key),ln,threshold)['valor']
    record['participacion_pct']=row.get('participacion_pct') if public['status']=='available' else None
    return record


def _public_context(row: dict, threshold: int) -> dict:
    """A suppressed electoral municipality cannot publish its hidden counts in context."""
    ln=row.get('LN')
    ok=ln is not None and ln>=threshold
    return {k:(v if ok or k not in ('LN','SV','NV','NS','participacion_pct') else None)
            for k,v in row.items() if k!='DEL'} | {'publication_status':('unavailable' if ln is None else 'available' if ok else 'suppressed')}


def export_web(cfg: Settings, estado: int, integrado: bool = False) -> dict:
    if not cfg.publication.permitir_contrato_v2:
        raise ValueError('Contrato v2 requiere opt-in: publicacion.permitir_contrato_v2=true')
    if cfg.umbral_rn05 is None:
        raise ValueError('RN-05 POR_DEFINIR: configura umbral_rn05 antes de publicar JSON')
    con=connection(cfg)
    results={}
    try:
        for year in cfg.years:
            folder=cfg.path('salida')/('integrado' if integrado else 'ine')/f'edo={estado:02}'/f'anio={year}'
            refs=resolve_reference(cfg,year)
            names=['municipio','sexo','grupo_edad','entidad']
            if cfg.publication.publicar_secciones:
                names+=['seccion']
                if cfg.publication.publicar_desgloses_territoriales:
                    names+=['seccion_sexo','seccion_edad']
            if cfg.incluir_del and cfg.del_distrito_verificado and cfg.publication.publicar_distritos:
                names+=['distrito_local']
                if cfg.publication.publicar_desgloses_territoriales:
                    names+=['distrito_local_sexo','distrito_local_edad']
            produced={}
            for name in names:
                src=cfg.path('processed')/'marts'/name/f'edo={estado:02}'/f'anio={year}'/'datos.parquet'
                rows=_rows(con,src)
                payload={'schema_version':2,'estado':f'{estado:02}','anio_eleccion':year,
                    'grano':name,'fuentes':['INE'],
                    'referencias':{'censo':refs.censo_ref,'cartografia':refs.anio_cartografia,
                                  'referencia_retroactiva':refs.referencia_territorial_historica},
                    'medidas':[_published(r,cfg.umbral_rn05,incluir_del=cfg.incluir_del) for r in rows]}
                public_name={'municipio':'municipios','seccion':'secciones',
                             'distrito_local':'distritos','seccion_sexo':'secciones-sexo',
                             'seccion_edad':'secciones-edad','distrito_local_sexo':'distritos-sexo',
                             'distrito_local_edad':'distritos-edad'}.get(name,name)
                _write_json(folder/f'{public_name}.json',payload)
                produced[public_name]=len(rows)
            if integrado:
                m=cfg.path('processed')/'full_context'/f'edo={estado:02}'/f'anio={year}'/'municipios.parquet'
                ctx=_rows(con,m)
                flags=['INE']+(['INEGI'] if cfg.integration.incluir_inegi else [])+(['CONAPO'] if cfg.integration.incluir_conapo else [])
                _write_json(folder/'municipios-contexto.json',{
                    'schema_version':2,'estado':f'{estado:02}','anio_eleccion':year,
                    'grano':'municipio','fuentes':flags,
                    'contexto_municipal':[_public_context(r,cfg.umbral_rn05) for r in ctx]})
                produced['municipios-contexto']=len(ctx)
                if cfg.integration.incluir_inegi and cfg.integration.incluir_geografia:
                    contextual_scopes=[]
                    if cfg.publication.publicar_secciones:
                        contextual_scopes.append(('secciones','secciones-contexto'))
                    if cfg.publication.publicar_distritos:
                        contextual_scopes.append(('distritos','distritos-contexto'))
                    for scope,name in contextual_scopes:
                        src=cfg.path('processed')/'inegi'/scope/f'edo={estado:02}'/f'anio={year}'/'contexto.parquet'
                        if src.exists():
                            rows=_rows(con,src)
                            _write_json(folder/f'{name}.json',{
                                'schema_version':2,'estado':f'{estado:02}','anio_eleccion':year,
                                'grano':scope+'_referencia','fuentes':['INEGI'],
                                'no_reasignar_votos':True,'contexto_territorial':rows})
                            produced[name]=len(rows)
            # Remove ONLY obsolete generated read models from this scope/config.
            candidates=('secciones','secciones-sexo','secciones-edad',
                        'distritos','distritos-sexo','distritos-edad',
                        'secciones-contexto','distritos-contexto','municipios-contexto')
            for previous in candidates:
                if previous not in produced:
                    (folder/f'{previous}.json').unlink(missing_ok=True)
            results[year]=produced
        return results
    finally:
        con.close()
