from __future__ import annotations

from revoto_pipeline.config import Settings, sql_path
from revoto_pipeline.model.publicacion_l4 import ARQUETIPOS


def register_mer(con, cfg: Settings) -> None:
    grains = {
        'entidad': ('entidad', False, False),
        'municipio': ('municipio', False, False),
        'sexo': ('entidad', False, True),
        'grupo_edad': ('entidad', True, False),
        'municipio_sexo': ('municipio', False, True),
        'municipio_edad': ('municipio', True, False),
    }
    parts = []
    available = {r[0] for r in con.execute('''SELECT table_name FROM information_schema.views
                     WHERE table_schema='analytics' ''').fetchall()}
    for mart, (level, age, sex) in grains.items():
        view_name = 'mart_participacion_' + mart
        if view_name not in available:
            continue
        e = 'CAST(EDOCVE AS INTEGER)'
        m = 'CAST(MPIOCVE AS INTEGER)' if level == 'municipio' else 'NULL::INTEGER'
        g = 'CAST(grupo_edad AS VARCHAR)' if age else 'NULL::VARCHAR'
        s = "CASE SEXO WHEN 0 THEN 'H' WHEN 1 THEN 'M' END" if sex else 'NULL::VARCHAR'
        where = (" WHERE grupo_edad IN ('18-24','25-34','35-44','45-59','60+')" if age else '')
        parts.append(f'''SELECT '{level}'::VARCHAR AS nivel, {e} AS cve_entidad,
              {m} AS cve_municipio, CAST(AELEC AS INTEGER) AS anio,
              {g} AS grupo_edad, {s} AS sexo,
              CAST(LN AS BIGINT) AS lista_nominal,
              CAST(SV AS BIGINT) AS votaron,
              CAST(NS AS BIGINT) AS sin_dato,
              CAST(participacion_pct / 100.0 AS DOUBLE) AS participacion,
              (publication_status='suppressed') AS suprimido
            FROM analytics.{view_name}{where}''')
    if 'mart_participacion_nacional' in available:
        parts.append('''SELECT 'nacional'::VARCHAR AS nivel, NULL::INTEGER AS cve_entidad,
             NULL::INTEGER AS cve_municipio, CAST(AELEC AS INTEGER) AS anio,
             NULL::VARCHAR AS grupo_edad, NULL::VARCHAR AS sexo,
             CAST(LN AS BIGINT) AS lista_nominal,
             CAST(SV AS BIGINT) AS votaron, CAST(NS AS BIGINT) AS sin_dato,
             CAST(participacion_pct/100.0 AS DOUBLE) AS participacion,
             (participacion_pct IS NULL) AS suprimido
             FROM analytics.mart_participacion_nacional
             WHERE cobertura_nacional_completa''')
    if parts:
        con.execute('CREATE OR REPLACE VIEW analytics.v_participacion_mer AS ' + ' UNION ALL '.join(parts))
    vals = ','.join(f"('{code}', '{name}')" for name, code in sorted(ARQUETIPOS.items()))
    con.execute(f'''CREATE OR REPLACE TABLE analytics.dim_arquetipo AS
        SELECT * FROM (VALUES {vals}) d(id, nombre)''')
    archetypes = cfg.path('arquetipos_municipales')
    if archetypes.exists():
        con.execute(f'''CREATE OR REPLACE VIEW analytics.v_arquetipo_municipio AS
            SELECT CAST(edo AS INTEGER) AS cve_entidad,
                   CAST(mun AS INTEGER) AS cve_municipio,
                   cvegeo, CASE arquetipo
                     {''.join(f"WHEN '{name}' THEN '{code}' " for name,code in ARQUETIPOS.items())}
                     ELSE NULL END AS id_arquetipo,
                   arquetipo AS nombre, CAST(nivel AS DOUBLE) AS nivel,
                   CAST(efp AS DOUBLE) AS efecto_presidencial,
                   CAST(tend AS DOUBLE) AS tendencia,
                   CAST(vol AS DOUBLE) AS volatilidad,
                   CAST(tipicidad AS DOUBLE) AS tipicidad, rasgo
            FROM read_csv('{sql_path(archetypes)}', all_varchar=true, header=true)
            WHERE arquetipo <> 'Historial corto' ''')
    expected = cfg.path('votos_esperados')
    if expected.exists():
        rows = []
        for g in ('18-24','25-34','35-44','45-59','60+'):
            rows.append(f'''SELECT CAST(edo AS INTEGER) AS cve_entidad,
               '{g}'::VARCHAR AS grupo_edad, CAST("{g}" AS DOUBLE) AS votos_de_3
               FROM read_csv('{sql_path(expected)}', all_varchar=true, header=true)''')
        con.execute('CREATE OR REPLACE VIEW analytics.v_votos_esperados AS ' + ' UNION ALL '.join(rows))
    indicator_paths = sorted((cfg.path('processed')/'analitica'/'indicadores_municipales').rglob('datos.parquet'))
    if indicator_paths and cfg.integration.incluir_inegi:
        paths = ','.join("'" + sql_path(p) + "'" for p in indicator_paths)
        con.execute(f'''CREATE OR REPLACE VIEW analytics.v_indicadores_municipales AS
                 SELECT * FROM read_parquet([{paths}], union_by_name=true, hive_partitioning=false)''')
