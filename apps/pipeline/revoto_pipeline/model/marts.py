"""Electoral read models. All rates use aggregated counts, never AVG(percentages)."""
from __future__ import annotations
import os
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write

# Keep age unknown separately. AGE is not reconstructed from group-age averages.
AGE_SQL = "CASE WHEN EDAD BETWEEN 18 AND 24 THEN '18-24'" \
        "WHEN EDAD BETWEEN 25 AND 34 THEN '25-34'" \
        "WHEN EDAD BETWEEN 35 AND 44 THEN '35-44'" \
        "WHEN EDAD BETWEEN 45 AND 59 THEN '45-59'" \
        "WHEN EDAD BETWEEN 60 AND 110 THEN '60+'" \
        "ELSE 'no_especificada' END"

GRAINS = {
 'entidad': ('AELEC','EDOCVE'),
 'municipio': ('AELEC','EDOCVE','MPIOCVE'),
 'seccion': ('AELEC','EDOCVE','MPIOCVE','SECCION'),
 'sexo': ('AELEC','EDOCVE','SEXO'),
 'grupo_edad': ('AELEC','EDOCVE','grupo_edad'),
 'municipio_sexo': ('AELEC','EDOCVE','MPIOCVE','SEXO'),
 'municipio_edad': ('AELEC','EDOCVE','MPIOCVE','grupo_edad'),
 'seccion_sexo': ('AELEC','EDOCVE','MPIOCVE','SECCION','SEXO'),
 'seccion_edad': ('AELEC','EDOCVE','MPIOCVE','SECCION','grupo_edad'),
}


def aggregation_sql(table: str, dims: tuple[str,...], *, rn05: int | None = None) -> str:
    names=', '.join(dims)
    # LN=0 yields NULL; an unspecified RN-05 threshold does not silently publish.
    raw = (f'SELECT {names}, SUM(LN)::BIGINT AS LN, SUM(SV)::BIGINT AS SV, '
           f'SUM(NV)::BIGINT AS NV, SUM(NS)::BIGINT AS NS '
           f'FROM {table} GROUP BY {names}')
    if rn05 is None:
        return (f'SELECT *, NULL::DOUBLE AS participacion_pct, '
                f"'umbral_no_definido'::VARCHAR AS publication_status FROM ({raw}) a")
    return (f'SELECT *, CASE WHEN LN>={rn05} AND LN>NS THEN '
            f'100.0*SV/NULLIF(LN-NS, 0) ELSE NULL END AS participacion_pct, '
            f"CASE WHEN LN IS NULL THEN 'unavailable' WHEN LN<{rn05} THEN 'suppressed' "
            f"WHEN NS IS NULL OR SV IS NULL THEN 'unavailable' "
            f"WHEN LN<NS THEN 'invalid_counts' WHEN LN=NS THEN 'rate_undefined' "
            f"ELSE 'available' END AS publication_status FROM ({raw}) a")

def build_marts(cfg: Settings, estado: int) -> dict[int,dict[str,int]]:
    con = connection(cfg)
    result={}
    try:
        for year in cfg.years:
            fact = cfg.path('processed')/'canonical'/'hecho_participacion'/f'edo={estado:02}'/f'anio={year}'/'hechos.parquet'
            if not fact.exists():
                raise FileNotFoundError(fact)
            table=f"(SELECT *, {AGE_SQL} AS grupo_edad FROM read_parquet('{sql_path(fact)}'))"
            grains=dict(GRAINS)
            # DEL = candidate local district *identifier*, never sum it.
            if cfg.incluir_del and cfg.del_distrito_verificado:
                grains['distrito_local']=('AELEC','EDOCVE','DEL')
                grains['distrito_local_sexo']=('AELEC','EDOCVE','DEL','SEXO')
                grains['distrito_local_edad']=('AELEC','EDOCVE','DEL','grupo_edad')
            if not (cfg.incluir_del and cfg.del_distrito_verificado):
                for old_name in ('distrito_local','distrito_local_sexo','distrito_local_edad'):
                    stale=cfg.path('processed')/'marts'/old_name/f'edo={estado:02}'/f'anio={year}'/'datos.parquet'
                    stale.unlink(missing_ok=True)  # derived output, never raw/canonical
            # RN-06/RN-09 affect only demographic slices; unfiltered totals
            # remain anchored to canonical observation counts.
            counts={}
            for name,dims in grains.items():
                predicates=[]
                if 'SEXO' in dims:
                    predicates.append('SEXO IN (0,1)')
                if 'grupo_edad' in dims:
                    predicates.append('EDAD BETWEEN 18 AND 110')
                if name.startswith('distrito_local'):
                    predicates.append('DEL IS NOT NULL AND DEL>0')
                mart_table=(f'(SELECT * FROM {table} WHERE ' + ' AND '.join(predicates) + ')') if predicates else table
                statement=aggregation_sql(mart_table,dims,rn05=cfg.umbral_rn05)
                dest=cfg.path('processed')/'marts' / name / f'edo={estado:02}' / f'anio={year}' / 'datos.parquet'
                pending=atomic_write(con,statement,dest)
                n=con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(pending)}')").fetchone()[0]
                # Check totals and uniqueness on the pending file BEFORE promotion.
                totals=con.execute(f'SELECT SUM(LN),SUM(SV),SUM(NV),SUM(NS) FROM {mart_table}').fetchone()
                aggregated=con.execute(f"SELECT SUM(LN),SUM(SV),SUM(NV),SUM(NS) FROM read_parquet('{sql_path(pending)}')").fetchone()
                d=con.execute(f"SELECT COUNT(*) FROM (SELECT {', '.join(dims)},COUNT(*) n FROM read_parquet('{sql_path(pending)}') GROUP BY {', '.join(dims)} HAVING n>1)").fetchone()[0]
                if totals!=aggregated or d:
                    pending.unlink(missing_ok=True)
                    raise ValueError(f'Mart {name} {estado}/{year}: reconciliación o unicidad fallida; {totals} != {aggregated}, duplicados={d}')
                os.replace(pending,dest)
                counts[name]=n
            result[year]=counts
        return result
    finally:
        con.close()
