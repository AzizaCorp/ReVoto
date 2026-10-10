"""CONAPO sex mapping and source-compatible projected measures."""
from pathlib import Path
from ..sql_utils import read_csv, norm, num, ident

CONAPO_SEX_MAP = {'HOMBRES': 0, 'MUJERES': 1}
AGE_FIELDS = ('POB_00_011','POB_012_29','POB_30_59','POB_60_mm')


def conapo_select(path: Path) -> str:
    """Retain all thirteen raw columns verbatim; append typed fields."""
    fields = ['raw.*', f'{num("ANO")} AS anio',
              f'{num("POB_TOTAL", "BIGINT")} AS pob_total_num',
              *[f'{num(c, "BIGINT")} AS {ident(c+"_num")}' for c in AGE_FIELDS],
              "CASE UPPER(TRIM(SEXO)) WHEN 'HOMBRES' THEN 0 "
              "WHEN 'MUJERES' THEN 1 ELSE NULL END::TINYINT AS sexo_ine",
              f'{norm("CLAVE")} AS clave_municipal_raw',
              f'{norm("CLAVE_ENT")} AS clave_entidad_raw']
    return 'SELECT ' + ',\n'.join(fields) + f' FROM {read_csv(path)} raw'
