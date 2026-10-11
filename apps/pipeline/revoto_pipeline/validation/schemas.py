"""Fail early for incompatible headers, not on ordinary missing data."""
from __future__ import annotations
import csv
from pathlib import Path

INE_COLUMNS = ('AELEC','FELECCION','EDOCVE','EDONOM','MPIOCVE','MPIONOM',
               'SECCION','TIPOSEC','DEF','DEL','SEXO','EDAD','LN','SV','NV','NS')
CONAPO_COLUMNS = ('CLAVE','CLAVE_ENT','NOM_ENT','NOM_MUN','SEXO','ANO',
                  'POB_00_011','POB_012_29','POB_30_59','POB_60_mm','POB_TOTAL',
                  'fecha','NOM_ENT_etq')
ITER_REQUIRED = ('ENTIDAD','MUN','LOC','NOM_ENT','NOM_MUN','NOM_LOC','POBTOT')

class SchemaError(ValueError):
    """An incompatible CSV header or missing essential field."""


def csv_header(path: Path, encoding: str = 'utf-8-sig') -> list[str]:
    with path.open('r', encoding = encoding, newline = '') as source:
        reader = csv.reader(source)
        try:
            return [x.strip().lstrip('\ufeff') for x in next(reader)]
        except StopIteration as err:
            raise SchemaError(f'Archivo vacío: {path}') from err


def check_header(path: Path, required: tuple[str, ...], *, exact: bool = False,
                 encoding: str = 'utf-8-sig') -> list[str]:
    columns = csv_header(path, encoding)
    canon = {c.upper(): c for c in columns}
    if len(canon) != len(set(columns)):
        raise SchemaError(f'Encabezados duplicados en {path}')
    need = {c.upper() for c in required}
    missing = sorted(need - canon.keys())
    extras = sorted(set(canon) - need) if exact else []
    if missing or extras:
        raise SchemaError(f'{path}: columnas faltantes={missing}; inesperadas={extras}')
    return columns


def first_record(path: Path, encoding: str = 'utf-8-sig') -> dict[str, str]:
    with path.open('r', encoding=encoding, newline='') as source:
        return next(csv.DictReader(source))
