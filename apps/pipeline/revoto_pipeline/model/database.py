"""Persistent DuckDB star catalog; large facts stay in external Parquet."""
from __future__ import annotations
import os
from pathlib import Path
import duckdb
from revoto_pipeline.config import Settings, sql_path


def _source(paths: list[Path]) -> str:
    if not paths:
        raise FileNotFoundError('No hay Parquet para registrar en DuckDB')
    quoted=', '.join("'"+sql_path(p)+"'" for p in paths)
    return f'read_parquet([{quoted}], hive_partitioning=false, union_by_name=true)'


def build_database(cfg: Settings) -> dict[str,int]:
    """Build a temporary DB then atomically replace the published database file."""
    sources=sorted((cfg.path('processed')/'canonical'/'hecho_participacion').rglob('hechos.parquet'))
    if not sources:
        raise FileNotFoundError('Ejecuta build-canonical primero')
    destination=cfg.path('base')
    destination.parent.mkdir(parents=True,exist_ok=True)
    pending=destination.with_name(destination.stem+'.pending.duckdb')
    pending.unlink(missing_ok=True)
    con=duckdb.connect(str(pending))
    counts={}
    try:
        con.execute('CREATE SCHEMA IF NOT EXISTS analytics')
        # Aliases carry old column names while exposing descriptive keys for joins.
        con.execute(f'''CREATE OR REPLACE VIEW analytics.hecho_participacion AS
            SELECT AELEC, EDOCVE, EDONOM, MPIOCVE, MPIONOM, SECCION, TIPOSEC,
                   DEF, DEL, SEXO, EDAD, FELECCION, LN, SV, NV, NS, source_year, source_file
            FROM {_source(sources)}''')
        # Historical source DEL is never silently treated as a verified geometry.
        threshold=cfg.umbral_rn05
        pct=('NULL::DOUBLE' if threshold is None else
             f'CASE WHEN COUNT(DISTINCT EDOCVE)=32 AND SUM(LN)>={int(threshold)} AND SUM(LN)>SUM(NS) THEN 100.0*SUM(SV)/NULLIF(SUM(LN)-SUM(NS),0) ELSE NULL END')
        con.execute(f'''CREATE OR REPLACE VIEW analytics.mart_participacion_nacional AS
           SELECT AELEC, SUM(LN)::BIGINT AS LN, SUM(SV)::BIGINT AS SV,
             SUM(NV)::BIGINT AS NV,SUM(NS)::BIGINT AS NS,
             COUNT(DISTINCT EDOCVE)::INTEGER AS entidades_disponibles,
             (COUNT(DISTINCT EDOCVE)=32) AS cobertura_nacional_completa,
             {pct} AS participacion_pct
           FROM analytics.hecho_participacion GROUP BY AELEC''')
        sql=(Path(__file__).resolve().parents[1]/'sql'/'70_modelo_dimensional.sql').read_text(encoding='utf-8')
        con.execute(sql)
        if cfg.incluir_del and cfg.del_distrito_verificado:
            con.execute('''CREATE OR REPLACE TABLE analytics.dim_distrito_local AS
                SELECT DISTINCT AELEC::INTEGER AS id_eleccion,EDOCVE::INTEGER AS cve_entidad,
                   DEL::INTEGER AS cve_distrito_local
                FROM analytics.hecho_participacion WHERE DEL IS NOT NULL AND DEL>0''')
        census_values=', '.join(f'({year},{cfg.reference[year]})' for year in sorted(cfg.years))
        con.execute(f'''CREATE OR REPLACE TABLE analytics.dim_censo AS
                SELECT DISTINCT censo_ref::INTEGER AS censo_ref
                FROM (VALUES {census_values}) t(anio_eleccion,censo_ref)''')
        counts['mart_participacion_nacional']=con.execute('SELECT COUNT(*) FROM analytics.mart_participacion_nacional').fetchone()[0]
        counts['hecho_participacion']=con.execute('SELECT COUNT(*) FROM analytics.hecho_participacion').fetchone()[0]
        for name in ['dim_eleccion','dim_entidad','dim_municipio','dim_seccion','dim_sexo','dim_grupo_edad','dim_censo']+(['dim_distrito_local'] if cfg.incluir_del and cfg.del_distrito_verificado else []):
            counts[name]=con.execute(f'SELECT COUNT(*) FROM analytics.{name}').fetchone()[0]
        # Views of separately generated read models; no full-sized data duplication.
        for family,folder,base in [('mart_participacion_',cfg.path('processed')/'marts','datos.parquet'),
                                    ('mart_contexto_',cfg.path('processed')/'inegi','contexto.parquet')]:
            if not folder.exists():
                continue
            if family=='mart_contexto_' and not cfg.integration.incluir_inegi:
                continue
            for sub in sorted(x for x in folder.iterdir() if x.is_dir()):
                if family=='mart_participacion_' and sub.name.startswith('distrito_local') and not (cfg.incluir_del and cfg.del_distrito_verificado):
                    continue
                paths=sorted(sub.rglob(base))
                if not paths:
                    continue
                name=family+sub.name
                if not name.replace('_','').isalnum():
                    raise ValueError(f'Unsafe view name: {name}')
                con.execute(f'CREATE OR REPLACE VIEW analytics.{name} AS SELECT * FROM {_source(paths)}')
                counts[name]=len(paths)
        municipal=sorted((cfg.path('processed')/'full_context').rglob('municipios.parquet'))
        if municipal and (cfg.integration.incluir_inegi or cfg.integration.incluir_conapo):
            for item in municipal:
                columns={x[0] for x in con.execute(f"DESCRIBE SELECT * FROM read_parquet('{sql_path(item)}')").fetchall()}
                for active,field in ((cfg.integration.incluir_inegi,'inegi_pobtot'),
                                     (cfg.integration.incluir_conapo,'poblacion_conapo')):
                    if (field in columns)!=active:
                        raise ValueError(f'Mart municipal obsoleto para configuración actual: {item} ({field})')
            con.execute(f'CREATE OR REPLACE VIEW analytics.mart_contexto_municipio AS SELECT * FROM {_source(municipal)}')
            counts['mart_contexto_municipio']=len(municipal)
        bridge=sorted((cfg.path('geo_staging')/'crosswalk').rglob('localidad_seccion_distrito.parquet'))
        if bridge and cfg.integration.incluir_geografia:
            con.execute(f'''CREATE OR REPLACE VIEW analytics.bridge_localidad_seccion AS
                        SELECT * FROM {_source(bridge)}''')
            con.execute('''CREATE OR REPLACE VIEW analytics.bridge_seccion_distrito_local AS
                        SELECT entidad,anio_eleccion,anio_cartografia,seccion_referencia,
                               MIN(distrito_local_referencia) AS distrito_local_referencia,
                               MIN(referencia_retroactiva) AS referencia_retroactiva,
                               BOOL_AND(equivalencia_historica_verificada) AS equivalencia_historica_verificada
                        FROM analytics.bridge_localidad_seccion
                        WHERE seccion_referencia IS NOT NULL
                        GROUP BY entidad,anio_eleccion,anio_cartografia,seccion_referencia
                        HAVING COUNT(DISTINCT distrito_local_referencia)=1
                           AND COUNT(*) FILTER (WHERE status_distrito<>'distrito_unico_contenido')=0''')
        # No foreign keys on a Parquet-backed view: uniqueness is checked in quality gates.
        if con.execute('''SELECT COUNT(*) FROM (SELECT AELEC,EDOCVE,MPIOCVE,SECCION,
                    COUNT(DISTINCT COALESCE(TIPOSEC,'<NULL>')) AS n FROM analytics.hecho_participacion
                    GROUP BY ALL HAVING n>1)''').fetchone()[0]:
            raise ValueError('Secciones con TIPOSEC contradictorio')
    except Exception:
        con.close()
        pending.unlink(missing_ok=True)
        raise
    else:
        con.close()
        os.replace(pending,destination)
        return counts
