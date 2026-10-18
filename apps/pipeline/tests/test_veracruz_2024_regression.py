"""REV-DATA-13: reproducible real-data regression for 30/2024, guarded by an opt-in.
Run: REVOTO_REAL_DATA=1 python -m pytest tests/test_veracruz_2024_regression.py -v
No fabricated counts, no local data committed, no zero-context expectation.
"""
from __future__ import annotations
import json, os
from pathlib import Path
import pytest
from revoto_pipeline.config import load_config, sql_path


def test_veracruz_real_data_report():
    if os.getenv('REVOTO_REAL_DATA')!='1':pytest.skip('Only run with private real datasets, explicitly opted in')
    duckdb=pytest.importorskip('duckdb')
    cfg=load_config()
    stato=30;year=2024
    canonical=cfg.path('processed')/'canonical/hecho_participacion/edo=30/anio=2024/hechos.parquet'
    staging=cfg.path('ine_staging')/'edo=30/anio=2024/conteos.parquet'
    bridge=cfg.path('geo_staging')/'crosswalk/edo=30/anio_eleccion=2024/localidad_seccion_distrito.parquet'
    context=cfg.path('processed')/'inegi/secciones/edo=30/anio=2024/contexto.parquet'
    municipal=cfg.path('processed')/'full_context/edo=30/anio=2024/municipios.parquet'
    for p in (canonical,staging,bridge,context,municipal):
        assert p.is_file(),f'Required real data missing: {p}'
    con=duckdb.connect(':memory:')
    results={'estado':30,'anio':2024,'fuentes':{},'conteos':{},'crosswalk':{},'contexto':{}}
    try:
        for name,p in [('canonical',canonical),('staging',staging),('crosswalk',bridge),('contexto',context),('full_context_municipal',municipal)]:
            results['fuentes'][name]=str(p.relative_to(cfg.root))
        for name,p in [('canonical',canonical),('staging',staging)]:
            results['conteos'][name]=dict(zip(['filas','LN','SV','NV','NS'],con.execute(f"SELECT COUNT(*),SUM(LN),SUM(SV),SUM(NV),SUM(NS) FROM read_parquet('{sql_path(p)}')").fetchone()))
        assert results['conteos']['canonical']==results['conteos']['staging'],'Canonical != staging'
        cross=con.execute(f"SELECT metodo_localidad,status_seccion,COUNT(*) n FROM read_parquet('{sql_path(bridge)}') GROUP BY ALL").fetchall()
        results['crosswalk']['metodo_estado']=[{'metodo':m,'estado':s,'localidades':n} for m,s,n in cross]
        accepted=con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(bridge)}') WHERE status_seccion='unico' AND seccion_referencia IS NOT NULL AND metodo_localidad='poligono_localidad_contenido'").fetchone()[0]
        rows=con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(context)}')").fetchone()[0]
        results['contexto']={'localidades_poligonales_elegibles':accepted,'secciones_registradas':rows}
        if not cfg.integration.permitir_localidades_por_punto:
            assert (accepted==0 and rows==0) or (accepted>0 and rows>0), 'Empty context unexpectedly'
        dups=con.execute(f"SELECT COUNT(*) FROM (SELECT AELEC,EDOCVE,MPIOCVE,COUNT(*) n FROM read_parquet('{sql_path(municipal)}') GROUP BY 1,2,3 HAVING n>1)").fetchone()[0]
        assert dups==0,'Municipal fanout'
        out=cfg.path('reportes')/'regresion'/'veracruz_2024.json'
        out.parent.mkdir(parents=True,exist_ok=True)
        tmp=out.with_suffix('.pending.json');tmp.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8');tmp.replace(out)
    finally:
        con.close()
