"""INE typed staging SQL, retaining raw measures and all geographic keys."""
from pathlib import Path
from revoto_pipeline.sql_utils import ident, norm, num, read_csv


def ine_select(path: Path, year: int) -> str:
    d = {c: num(c) for c in ('AELEC','EDOCVE','MPIOCVE','SECCION',
                              'DEF','DEL','LN','SV','NV','NS')}
    for c, dtype in [('SEXO','TINYINT'), ('EDAD','SMALLINT')]:
        d[c] = num(c, dtype)
    date = f"COALESCE(TRY_STRPTIME({norm('FELECCION')}, '%d/%m/%Y')::DATE, " \
           f"TRY_CAST({norm('FELECCION')} AS DATE))"
    fields = [*(f'{d[c]} AS {ident(c)}' for c in ['AELEC','EDOCVE','MPIOCVE',
               'SECCION','DEF','DEL','SEXO','EDAD','LN','SV','NV','NS']),
              f'{date} AS FELECCION',
              *(f'{norm(c)} AS {ident(c)}' for c in ['EDONOM','MPIONOM','TIPOSEC']),
              f"{str(year)}::INTEGER AS source_year",
              f"'{path.name.replace(chr(39), chr(39)*2)}' AS source_file",
              f'{d["DEF"]} IS NULL AS missing_def',
              f'{d["DEL"]} IS NULL AS missing_del',
              f'({norm("DEF")} IS NOT NULL AND {d["DEF"]} IS NULL) AS invalid_def_token',
              f'({norm("DEL")} IS NOT NULL AND {d["DEL"]} IS NULL) AS invalid_del_token']
    # The WHERE clause is deliberately absent: never drop electoral observations.
    return 'SELECT ' + ',\n'.join(fields) + f' FROM {read_csv(path)}'


def municipality_select(parquet: Path, by_sex: bool = False) -> str:
    from ..config import sql_path
    dims = 'AELEC, EDOCVE, MPIOCVE' + (', SEXO' if by_sex else '')
    return f'''SELECT {dims}, SUM(LN)::BIGINT AS LN, SUM(SV)::BIGINT AS SV,
          SUM(NV)::BIGINT AS NV, SUM(NS)::BIGINT AS NS,
          CASE WHEN SUM(LN)>0 THEN ROUND(100.0*SUM(SV)/NULLIF(SUM(LN)-SUM(NS),0),4)::DOUBLE
               ELSE NULL END AS participacion_pct
    FROM read_parquet('{sql_path(parquet)}') GROUP BY {dims}'''
