"""ITER localities -> reference electoral sections/districts with defensible coverage."""
from __future__ import annotations
import os
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.geo.temporal import resolve_reference
from revoto_pipeline.sql_utils import atomic_write
from .indicators import INDICATOR_AGGREGATION, available_expression


def _input_files(cfg: Settings, estado: int, year: int):
    ref=resolve_reference(cfg,year)
    census=cfg.path('inegi_staging')/f'censo={ref.censo_ref}'/'iter.parquet'
    bridge=cfg.path('geo_staging')/'crosswalk'/f'edo={estado:02}'/f'anio_eleccion={year}'/'localidad_seccion_distrito.parquet'
    for p in (census,bridge):
        if not p.is_file():
            raise FileNotFoundError(p)
    return ref,census,bridge


def _validate(con, c, b, estado, ref):
    dup=con.execute(f'''SELECT COUNT(*) FROM (
           SELECT cvegeo FROM {b} GROUP BY cvegeo HAVING COUNT(*)>1)''').fetchone()[0]
    if dup:
        raise ValueError('Crosswalk con fanout: localidad repetida')
    dup_iter=con.execute(f'''SELECT COUNT(*) FROM (
           SELECT cvegeo FROM {c} WHERE record_level='localidad_regular' GROUP BY cvegeo HAVING COUNT(*)>1)''').fetchone()[0]
    if dup_iter:
        raise ValueError('ITER contiene claves de localidad duplicadas')
    wrong=con.execute(f'''SELECT COUNT(*) FROM {b}
       WHERE TRY_CAST(entidad AS INTEGER) IS DISTINCT FROM {estado}
         OR anio_eleccion IS DISTINCT FROM {ref.anio_eleccion}
         OR censo_ref IS DISTINCT FROM {ref.censo_ref}
         OR anio_cartografia IS DISTINCT FROM {ref.anio_cartografia}
         OR referencia_retroactiva IS DISTINCT FROM {str(ref.referencia_territorial_historica).upper()}''').fetchone()[0]
    if wrong:
        raise ValueError('Crosswalk incompatible con la referencia electoral/censal')
    contradictions=con.execute(f'''SELECT COUNT(*) FROM {b}
       WHERE status_seccion NOT IN ('unico','sin_interseccion','ambiguo','sin_coordenadas',
           'desacuerdo_poligono_punto','sin_seccion') OR
           (status_seccion<>'unico' AND seccion_referencia IS NOT NULL)''').fetchone()[0]
    if contradictions:
        raise ValueError('Crosswalk contiene estados de asignación contradictorios')


def build_contexto_inegi(cfg: Settings, estado: int, year: int) -> dict:
    """Build *reference* context, not historic electoral vote reallocation."""
    ref, census, bridge=_input_files(cfg,estado,year)
    con=connection(cfg)
    try:
        c=f"read_parquet('{sql_path(census)}')"
        b=f"read_parquet('{sql_path(bridge)}')"
        _validate(con,c,b,estado,ref)
        columns={r[0] for r in con.execute(f'DESCRIBE SELECT * FROM {c}').fetchall()}
        accepted="b.status_seccion='unico' AND b.seccion_referencia IS NOT NULL"
        if not cfg.integration.permitir_localidades_por_punto:
            accepted+=" AND b.metodo_localidad='poligono_localidad_contenido'"
        # Explicit one-to-one source key; no municipality totals are mixed with localities.
        con.execute(f'''CREATE TEMP VIEW localidades AS
          SELECT i.*, SUBSTR(i.cvegeo,1,5) AS cvegeo_municipal,
                 b.seccion_referencia, b.distrito_local_referencia,
                 b.status_seccion,b.status_distrito,b.metodo_localidad,
                 b.referencia_retroactiva,b.equivalencia_historica_verificada,
                 ({accepted}) AS asignable
          FROM {c} i LEFT JOIN {b} b ON i.cvegeo=b.cvegeo
          WHERE i.record_level='localidad_regular' AND TRY_CAST(i.ENTIDAD AS INTEGER)={estado}''')
        # Use real municipality census denominators only; not SUM(all estimated sections).
        con.execute(f'''CREATE TEMP VIEW cobertura_municipal AS WITH agg AS (
          SELECT cvegeo_municipal, COUNT(*) AS localidades_total,
              COUNT(*) FILTER (WHERE asignable) AS localidades_asignadas,
              COUNT(*) FILTER (WHERE NOT COALESCE(asignable,FALSE)) AS localidades_ambiguas,
              CASE WHEN COUNT(POBTOT)=COUNT(*) THEN SUM(POBTOT) ELSE NULL END AS localidades_poblacion_disponible,
              CASE WHEN COUNT(POBTOT) FILTER (WHERE asignable)=COUNT(*) FILTER (WHERE asignable)
                   THEN COALESCE(SUM(POBTOT) FILTER (WHERE asignable),0) ELSE NULL END AS poblacion_asignada
          FROM localidades GROUP BY 1),
          totals AS (SELECT SUBSTR(cvegeo,1,5) AS cvegeo_municipal, POBTOT AS poblacion_total_disponible
              FROM {c} WHERE record_level='total_municipal'
                   AND TRY_CAST(ENTIDAD AS INTEGER)={estado})
          SELECT a.*, t.poblacion_total_disponible,
                 CASE WHEN t.poblacion_total_disponible>0
                      AND a.poblacion_asignada<=t.poblacion_total_disponible
                      THEN a.poblacion_asignada*1.0/t.poblacion_total_disponible
                      ELSE NULL END AS coverage_pct
          FROM agg a LEFT JOIN totals t USING(cvegeo_municipal)''')
        measures=',\n'.join(f'{available_expression(ind,columns)} AS "{ind.lower()}"'
                            for ind in INDICATOR_AGGREGATION)
        sections=f'''WITH section_stats AS (
             SELECT l.cvegeo_municipal, l.seccion_referencia AS cve_seccion,
                 COUNT(*) AS localidades_en_seccion,
                 {measures}
             FROM localidades l WHERE l.asignable
             GROUP BY l.cvegeo_municipal,l.seccion_referencia)
           SELECT s.*, c.localidades_total,c.localidades_asignadas,c.localidades_ambiguas,
              c.poblacion_total_disponible,c.poblacion_asignada,c.coverage_pct,
              {ref.censo_ref}::INTEGER AS censo_ref,
              {ref.anio_cartografia}::INTEGER AS anio_cartografia,
              {str(ref.referencia_territorial_historica).upper()}::BOOLEAN AS referencia_retroactiva,
              FALSE::BOOLEAN AS equivalencia_historica_verificada,
              'localidades_asignables'::VARCHAR AS metodo,
              CASE WHEN c.coverage_pct IS NULL THEN 'unavailable'
                   WHEN c.coverage_pct<{float(cfg.integration.cobertura_minima_inegi)} THEN 'insufficient_coverage'
                   ELSE 'available' END AS quality_status
           FROM section_stats s LEFT JOIN cobertura_municipal c USING(cvegeo_municipal)'''
        # Only eligible localities, a denominator available, and sufficient coverage yield published metrics.
        con.execute('CREATE TEMP VIEW secciones_completas AS '+sections)
        indicator_names=[k.lower() for k in INDICATOR_AGGREGATION]
        allowed=[f'CASE WHEN quality_status=\'available\' THEN "{name}" ELSE NULL END AS "{name}"'
                 for name in indicator_names]
        rest=', '.join('"'+n+'"' for n in ['cvegeo_municipal','cve_seccion','localidades_en_seccion',
             'localidades_total','localidades_asignadas','localidades_ambiguas',
             'poblacion_total_disponible','poblacion_asignada','coverage_pct','censo_ref','anio_cartografia',
             'referencia_retroactiva','equivalencia_historica_verificada','metodo','quality_status'])
        section_sql=f"SELECT {rest}, {', '.join(allowed)} FROM secciones_completas"
        dest=cfg.path('processed')/'inegi'/'secciones'/f'edo={estado:02}'/f'anio={year}'/'contexto.parquet'
        pending=atomic_write(con,section_sql,dest)
        os.replace(pending,dest)
        # District census context is aggregated DIRECTLY from assigned localities,
        # not from repeated municipality coverage rows or partial electoral votes.
        district_filter=("l.asignable AND l.status_distrito='distrito_unico_contenido' "
                         "AND l.distrito_local_referencia IS NOT NULL")
        dis_measures=',\n'.join(f'{available_expression(ind,columns)} AS "{ind.lower()}"'
                              for ind in INDICATOR_AGGREGATION)
        district_sql=f'''SELECT l.distrito_local_referencia AS cve_distrito_local,
             COUNT(*) AS localidades_asignadas, {dis_measures},
             {ref.censo_ref}::INTEGER AS censo_ref,
             {ref.anio_cartografia}::INTEGER AS anio_cartografia,
             {str(ref.referencia_territorial_historica).upper()}::BOOLEAN AS referencia_retroactiva,
             FALSE::BOOLEAN AS equivalencia_historica_verificada,
             'contexto_distrito_referencia_no_votos'::VARCHAR AS metodo,
             'subtotal_localidades_asignadas'::VARCHAR AS quality_status,
             NULL::DOUBLE AS coverage_pct
             FROM localidades l WHERE {district_filter} GROUP BY 1'''
        # No district-level coverage denominator exists when a district crosses municipalities;
        # do not claim these district figures to be complete censal totals.
        district=cfg.path('processed')/'inegi'/'distritos'/f'edo={estado:02}'/f'anio={year}'/'contexto.parquet'
        pending=atomic_write(con,district_sql,district)
        os.replace(pending,district)
        return {'secciones':con.execute('SELECT COUNT(*) FROM secciones_completas').fetchone()[0],
                'distritos':con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(district)}')").fetchone()[0],
                'censo_ref':ref.censo_ref,'anio_cartografia':ref.anio_cartografia,
                'referencia_retroactiva':ref.referencia_territorial_historica}
    finally:
        con.close()
