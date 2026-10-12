"""Independent optional INEGI/CONAPO municipality + election year context."""
from __future__ import annotations
import os
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write
from revoto_pipeline.transform.context import (
    checked_mapping, CONAPO_REQUIRED_COLUMNS, INEGI_REQUIRED_COLUMNS)
from .reglas import unique_mapping


def _validated(cfg, key, cols, unique):
    rows=checked_mapping(cfg.path(key),cols)
    unique_mapping(rows,unique)
    return rows


def _values(con, name, columns, rows):
    """Only tiny reviewed numeric/identifier maps; every value is CSV-escaped."""
    if not rows:
        raise ValueError(f'Sin correspondencias verificadas: {name}')
    def literal(x):
        return "'"+str(x).replace("'","''")+"'"
    values=','.join('('+','.join(literal(row[k]) for k in columns)+')' for row in rows)
    colnames=','.join(columns)
    con.execute(f'''CREATE OR REPLACE TEMP VIEW {name} AS
                  SELECT * FROM (VALUES {values}) m({colnames})''')


def build_municipal_context(cfg: Settings, estado: int) -> dict[int,dict]:
    con=connection(cfg)
    results={}
    try:
        ic=cfg.integration.incluir_inegi
        cc=cfg.integration.incluir_conapo
        if ic:
            irows=_validated(cfg,'mapping_inegi_ine',INEGI_REQUIRED_COLUMNS,
                    ('cve_ent_ine','cve_mpio_ine','anio_eleccion','censo_ref'))
            unique_mapping(irows,('cvegeo_municipal_inegi','anio_eleccion','censo_ref'))
            _values(con,'map_inegi',('cve_ent_ine','cve_mpio_ine','anio_eleccion',
                                    'censo_ref','cvegeo_municipal_inegi'),irows)
        if cc:
            crows=_validated(cfg,'mapping_conapo_ine',CONAPO_REQUIRED_COLUMNS,
                             ('cve_ent_ine','cve_mpio_ine','anio'))
            unique_mapping(crows,('clave_conapo','anio'))
            _values(con,'map_conapo',('cve_ent_ine','cve_mpio_ine','anio','clave_conapo'),crows)
            conapo=cfg.path('conapo_staging')/'poblacion_anual.parquet'
            if not conapo.exists():
                raise FileNotFoundError(conapo)
            con.execute(f'''CREATE TEMP VIEW conapo_municipal AS
                SELECT TRY_CAST(clave_municipal_raw AS INTEGER) AS cvegeo_conapo,
                       anio, COUNT(*) AS filas, COUNT(DISTINCT sexo_ine) AS sexos,
                       COUNT(pob_total_num) AS numeros_validos,
                       CASE WHEN COUNT(*)=2 AND COUNT(DISTINCT sexo_ine)=2
                           AND COUNT(pob_total_num)=2 THEN SUM(pob_total_num) ELSE NULL END AS poblacion_conapo
                FROM read_parquet('{sql_path(conapo)}')
                GROUP BY 1,2''')
        for year in cfg.years:
            src=cfg.path('processed')/'marts'/'municipio'/f'edo={estado:02}'/f'anio={year}'/'datos.parquet'
            if not src.exists():
                raise FileNotFoundError(f'Ejecuta build-marts: {src}')
            base=f"read_parquet('{sql_path(src)}')"
            selects=['i.*']
            joins=[]
            if ic:
                census_year=cfg.reference[year]
                census=cfg.path('inegi_staging')/f'censo={census_year}'/'iter.parquet'
                if not census.exists():
                    raise FileNotFoundError(census)
                joins.append(f'''LEFT JOIN map_inegi mi
                    ON TRY_CAST(mi.cve_ent_ine AS INTEGER)=i.EDOCVE
                    AND TRY_CAST(mi.cve_mpio_ine AS INTEGER)=i.MPIOCVE
                    AND TRY_CAST(mi.anio_eleccion AS INTEGER)=i.AELEC
                    AND TRY_CAST(mi.censo_ref AS INTEGER)={census_year}
                    LEFT JOIN read_parquet('{sql_path(census)}') x
                    ON x.cvegeo=mi.cvegeo_municipal_inegi
                    AND x.record_level='total_municipal' ''')
                selects+=['x.cvegeo AS cvegeo_municipal_inegi',
                          'x.POBTOT AS inegi_pobtot',f'{census_year}::INTEGER AS censo_ref',
                          '(x.cvegeo IS NOT NULL) AS inegi_matched']
            if cc:
                joins.append('''LEFT JOIN map_conapo mc
                  ON TRY_CAST(mc.cve_ent_ine AS INTEGER)=i.EDOCVE
                  AND TRY_CAST(mc.cve_mpio_ine AS INTEGER)=i.MPIOCVE
                  AND TRY_CAST(mc.anio AS INTEGER)=i.AELEC
                  LEFT JOIN conapo_municipal cn
                  ON cn.cvegeo_conapo=TRY_CAST(mc.clave_conapo AS INTEGER)
                  AND cn.anio=i.AELEC''')
                selects+=['cn.poblacion_conapo',f'{year}::INTEGER AS conapo_ref',
                          '(cn.poblacion_conapo IS NOT NULL) AS conapo_matched']
            selects+=['\'municipio\'::VARCHAR AS granularidad_contexto',
                       f'{cfg.district_reference[year]}::INTEGER AS anio_cartografia_referencia',
                       f'{str(year < cfg.district_reference[year]).upper()}::BOOLEAN AS referencia_retroactiva']
            sql='SELECT '+', '.join(selects)+' FROM '+base+' i '+' '.join(joins)
            dest=cfg.path('processed')/'full_context'/f'edo={estado:02}'/f'anio={year}'/'municipios.parquet'
            pending=atomic_write(con,sql,dest)
            count=con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(pending)}')").fetchone()[0]
            before=con.execute(f'SELECT COUNT(*) FROM {base}').fetchone()[0]
            if count!=before:
                pending.unlink(missing_ok=True)
                raise ValueError(f'Fanout en INEGI/CONAPO: {before} → {count}')
            os.replace(pending,dest)
            results[year]={'rows':count,'fuentes':['INE']+(['INEGI'] if ic else [])+(['CONAPO'] if cc else [])}
        return results
    finally:
        con.close()
