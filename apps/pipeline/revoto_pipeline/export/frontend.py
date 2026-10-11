"""Compact static JSON from INE alone OR validated municipal triple context.
Never publish raw electoral microdata, locality -> section votes, or inferred breakdowns."""

from __future__ import annotations
import json
import os
from pathlib import Path
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.geo.temporal import resolve_reference
from revoto_pipeline.transform.inegi import INDICATORS


def _write_json(destination: Path, payload: dict) -> None:
    destination.parent.mkdir(parents=True,exist_ok=True)
    temp = destination.with_suffix('.pending.json')
    temp.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'),
                               allow_nan=False), encoding='utf-8')
    os.replace(temp,destination)


def _ine_rows(con, parquet: Path) -> list[dict]:
    rows = con.execute(f'''SELECT MPIOCVE,LN,SV,NV,NS,participacion_pct
        FROM read_parquet('{sql_path(parquet)}') ORDER BY MPIOCVE''').fetchall()
    return [dict(zip(('municipio','ln','sv','nv','ns','participacion_pct'),row)) for row in rows]


def _integrated_rows(con, parquet: Path) -> list[dict]:
    """Export measures grouped by statistical source with explicit temporal metadata."""
    query = f'''SELECT * FROM read_parquet('{sql_path(parquet)}') ORDER BY MPIOCVE'''
    result = con.execute(query)
    columns = [item[0] for item in result.description]
    data = [dict(zip(columns,row)) for row in result.fetchall()]
    out = []
    for item in data:
        out.append({
            'municipio_ine':item['MPIOCVE'],
            'cvegeo_municipal_inegi':item['cvegeo_municipal_inegi'],
            'cvegeo_municipal_mapa':item['cvegeo_municipal_mapa'],
            'ine':{'ln':item['LN'],'sv':item['SV'],'nv':item['NV'],
                   'ns':item['NS'],'participacion_pct':item['participacion_pct']},
            'conapo':{'poblacion_estimada':item['poblacion_conapo'],
                      'pob_00_011':item['conapo_pob_00_011'],
                      'pob_012_29':item['conapo_pob_012_29'],
                      'pob_30_59':item['conapo_pob_30_59'],
                      'pob_60_mm':item['conapo_pob_60_mm'],
                      'matched':bool(item['conapo_matched'])},
            'inegi':{'indicadores':{key.lower():item[f'inegi_{key.lower()}']
                                    for key in INDICATORS},
                     'matched':bool(item['inegi_matched'])},
            'geografia':{'municipio_geo_disponible':bool(item['geometria_municipal_disponible']),
                         'anio_marco_inegi':item['anio_marco_inegi'],
                         'referencia_retroactiva':bool(item['referencia_retroactiva']),
                         'equivalencia_secciones_historicas_verificada':False}
        })
    return out


def export_web(cfg: Settings, estado: int, integrado: bool = False) -> dict:
    """State/year municipality-level counts and weighted participation."""
    con = connection(cfg)
    exported: dict[int,int] = {}
    try:
        for year in cfg.years:
            refs = resolve_reference(cfg,year)
            folder = 'full_context' if integrado else 'ine'
            parquet = cfg.path('processed') / folder / f'edo={estado:02}' / f'anio={year}' / 'municipios.parquet'
            if not parquet.exists():
                raise FileNotFoundError(f'Falta dataset {folder}: {parquet}; '
                                        'ejecuta build-full-context antes de --integrado')
            municipalities = (_integrated_rows(con,parquet) if integrado
                              else _ine_rows(con,parquet))
            payload = {'estado':f'{estado:02}', 'anio_eleccion':year,
                       'fuentes' : ['INE', 'CONAPO', 'INEGI'] if integrado else ['INE'],
                       'referencias':{'censo':refs.censo_ref,'conapo':year,
                                      'cartografia_distrito_local':refs.anio_cartografia},
                        'notas':{'participacion':'100 * SUM(SV) / SUM(LN)',
                                    'conapo':'Estimaciones/proyecciones, NO lista nominal.',
                                    'inegi':'Totales municipales del censo de referencia.',
                                    'geografia':refs.nota, 'sin_transferencia_de_votos_historicos':True},
                                    'municipios':municipalities}
            branch = 'integrado' if integrado else 'ine'
            dest = (cfg.path('salida')/branch/f'edo={estado:02}'/f'anio={year}'/
                    'municipios.json')
            _write_json(dest, payload)
            exported[year] = len(municipalities)
        return exported
    finally:
        con.close()
