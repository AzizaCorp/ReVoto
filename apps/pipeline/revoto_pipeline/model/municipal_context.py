"""Independent optional INEGI/CONAPO municipality + election year context."""
from __future__ import annotations
import os

from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write
from revoto_pipeline.model.identidad_municipal import load_identities, normalize_name
from .indicators import INDICATOR_AGGREGATION


def _values(con, name, columns, rows):
    """Mappings pequeños, sin interpolar identificadores SQL arbitrarios."""
    if not rows:
        raise ValueError(f'Sin correspondencias verificadas: {name}')
    def literal(x):
        return "'"+str(x).replace("'", "''")+"'"
    values=','.join('('+','.join(literal(row[k]) for k in columns)+')' for row in rows)
    con.execute(f'''CREATE OR REPLACE TEMP VIEW {name} AS
                  SELECT * FROM (VALUES {values}) m({','.join(columns)})''')

def build_municipal_context(cfg: Settings, estado: int) -> dict[int, dict]:
    con = connection(cfg)
    results = {}
    try:
        ic, cc = cfg.integration.incluir_inegi, cfg.integration.incluir_conapo
        mapping_path = cfg.path('mapping_municipal_historico')
        identities = load_identities(mapping_path, years=set(cfg.years), states={estado})
        if cc:
            conapo = cfg.path('conapo_staging')/'poblacion_anual.parquet'
            if not conapo.is_file():
                raise FileNotFoundError(conapo)
            con.execute(f'''CREATE TEMP VIEW conapo_municipal AS
                SELECT TRY_CAST(clave_municipal_raw AS INTEGER) AS cvegeo_conapo,
                    anio, COUNT(*) AS filas, COUNT(DISTINCT sexo_ine) AS sexos,
                    COUNT(pob_total_num) AS numeros_validos,
                    CASE WHEN COUNT(*)=2 AND COUNT(DISTINCT sexo_ine)=2
                         AND COUNT(pob_total_num)=2 THEN SUM(pob_total_num)
                         ELSE NULL END AS poblacion_conapo
                FROM read_parquet('{sql_path(conapo)}') GROUP BY 1,2''')
        for year in cfg.years:
            src = cfg.path('processed')/'marts'/'municipio'/f'edo={estado:02}'/f'anio={year}'/'datos.parquet'
            if not src.is_file():
                raise FileNotFoundError(f'Ejecuta build-marts: {src}')
            base = f"read_parquet('{sql_path(src)}')"
            keys = [(int(y),int(e),int(m)) for y,e,m in
                    con.execute(f'SELECT AELEC, EDOCVE, MPIOCVE FROM {base}').fetchall()]
            if any(k[:2] != (year, estado) for k in keys):
                raise ValueError(f'Mart municipal contiene otra elección/estado: {src}')
            missing = [k for k in keys if k not in identities]
            if missing:
                raise ValueError(f'Equivalencias territoriales no verificadas en {src}: {missing[:8]}. '
                                 f'Revisar {mapping_path}')
            current = [identities[k] for k in keys]
            
            fact = cfg.path('processed')/'canonical'/'hecho_participacion'/f'edo={estado:02}'/f'anio={year}'/'hechos.parquet'
            if fact.is_file():
                distinct = con.execute(f"SELECT DISTINCT MPIOCVE, MPIONOM FROM read_parquet('{sql_path(fact)}')").fetchall()
                for mun, name in distinct:
                    key = (year, estado, int(mun))
                    if key not in identities or normalize_name(identities[key].historic_name) != normalize_name(name):
                        raise ValueError(f'Mapping municipal obsoleto respecto a canonical: {key}/{name!r}')
            _values(con,'map_identidad',
                ('anio_eleccion','cve_ent_ine','cve_mpio_ine','nombre_ine',
                 'cvegeo_canonico','nombre_canonico','tipo_equivalencia','fuente_referencia'),
                [dict(anio_eleccion=i.year,cve_ent_ine=i.state,cve_mpio_ine=i.historic_code,
                      nombre_ine=i.historic_name,cvegeo_canonico=i.cvegeo,
                      nombre_canonico=i.name,tipo_equivalencia=i.equivalence,
                      fuente_referencia=i.source) for i in current])
            joins=['''INNER JOIN map_identidad im
                ON TRY_CAST(im.anio_eleccion AS INTEGER)=i.AELEC
                AND TRY_CAST(im.cve_ent_ine AS INTEGER)=i.EDOCVE
                AND TRY_CAST(im.cve_mpio_ine AS INTEGER)=i.MPIOCVE''']
            selects=['i.*', 'im.nombre_ine AS MPIONOM_original',
                     'im.cvegeo_canonico', 'im.nombre_canonico AS nombre_municipio_canonico',
                     'im.tipo_equivalencia', 'TRUE::BOOLEAN AS equivalencia_verificada',
                     'im.fuente_referencia AS referencia_identidad']
            if ic:
                census_year = cfg.reference[year]
                census = cfg.path('inegi_staging')/f'censo={census_year}'/'iter.parquet'
                if not census.is_file():
                    raise FileNotFoundError(census)
                reference = f"read_parquet('{sql_path(census)}')"
                dup = con.execute(f'''SELECT COUNT(*) FROM (
                    SELECT cvegeo FROM {reference} WHERE record_level='total_municipal'
                    GROUP BY 1 HAVING COUNT(*)>1)''').fetchone()[0]
                if dup:
                    raise ValueError(f'ITER municipal con {dup} claves duplicadas')
                cols = {r[0] for r in con.execute(f'DESCRIBE SELECT * FROM {reference}').fetchall()}
                projections = [f'x."{name}" AS inegi_{name.lower()}' if name in cols
                               else f'NULL::DOUBLE AS inegi_{name.lower()}'
                               for name,spec in INDICATOR_AGGREGATION.items()
                               if spec.method in ('sum','weighted_mean') and name!='POBTOT']
                joins.append(f'''LEFT JOIN {reference} x
                    ON x.cvegeo=im.cvegeo_canonico || '0000'
                    AND x.record_level='total_municipal' ''')
                selects += ['x.cvegeo AS cvegeo_municipal_inegi','x.POBTOT AS inegi_pobtot',
                            *projections,f'{census_year}::INTEGER AS censo_ref',
                            '(x.cvegeo IS NOT NULL) AS inegi_matched',
                            "'iter_total_municipal'::VARCHAR AS inegi_metodo"]
            if cc:
                joins.append('''LEFT JOIN conapo_municipal cn
                    ON cn.cvegeo_conapo=TRY_CAST(im.cvegeo_canonico AS INTEGER)
                    AND cn.anio=i.AELEC''')
                selects += ['cn.poblacion_conapo',f'{year}::INTEGER AS conapo_ref',
                            '(cn.poblacion_conapo IS NOT NULL) AS conapo_matched']
            selects += ["'municipio'::VARCHAR AS granularidad_contexto",
                        f'{cfg.district_reference[year]}::INTEGER AS anio_cartografia_referencia',
                        f'{str(year < cfg.district_reference[year]).upper()}::BOOLEAN AS referencia_retroactiva']
            statement = 'SELECT '+', '.join(selects)+' FROM '+base+' i '+' '.join(joins)
            dest = cfg.path('processed')/'full_context'/f'edo={estado:02}'/f'anio={year}'/'municipios.parquet'
            pending = atomic_write(con, statement, dest)
            try:
                count = con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(pending)}')").fetchone()[0]
                before = con.execute(f'SELECT COUNT(*) FROM {base}').fetchone()[0]
                duplicates = con.execute(f'''SELECT COUNT(*) FROM (
                    SELECT AELEC,EDOCVE,MPIOCVE,COUNT(*) n
                    FROM read_parquet('{sql_path(pending)}') GROUP BY 1,2,3 HAVING n>1)''').fetchone()[0]
                if count != before or duplicates:
                    raise ValueError(f'Contexto: pérdida/fanout: {before} → {count}, duplicados={duplicates}')
                os.replace(pending,dest)
            finally:
                pending.unlink(missing_ok=True)
            results[year] = {'rows':count,'fuentes':['INE']+(['INEGI'] if ic else [])+(['CONAPO'] if cc else [])}
        return results
    finally:
        con.close()
