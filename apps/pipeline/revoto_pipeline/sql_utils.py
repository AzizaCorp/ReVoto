"""Shared SQL builders; column names are validated and local paths escaped."""
from pathlib import Path
from revoto_pipeline.config import sql_path


def ident(name: str) -> str:
    if not name or not name.replace('_','').isalnum() or not name[0].isalpha():
        raise ValueError(f'Identificador SQL inseguro: {name!r}')
    return f'"{name}"'


def norm(name: str) -> str:
    return f"NULLIF(TRIM({ident(name)}), '')"


def num(name: str, dtype: str='INTEGER') -> str:
    if dtype not in ('INTEGER','BIGINT','DOUBLE','SMALLINT','TINYINT'):
        raise ValueError('Tipo no permitido')
    return f'TRY_CAST({norm(name)} AS {dtype})'


def read_csv(path: Path) -> str:
    return f"read_csv('{sql_path(path)}',header=true,all_varchar=true,delim=',',quote='\"',escape='\"',ignore_errors=false)"


def copy_parquet(con,select_sql: str,destination: Path) -> None:
    destination.parent.mkdir(parents=True,exist_ok=True)
    con.execute(f"COPY ({select_sql}) TO '{sql_path(destination)}' "
                '(FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 100000)')


def atomic_write(con,select_sql: str,destination: Path) -> Path:
    tmp=destination.with_name(destination.stem+'.pending.parquet')
    tmp.unlink(missing_ok=True)
    copy_parquet(con,select_sql,tmp)
    return tmp
