"""Validated mappings and backwards-compatible municipal-context entrypoint."""
from __future__ import annotations
import csv
from pathlib import Path

CONAPO_REQUIRED_COLUMNS={'clave_conapo','clave_ent_conapo','cve_ent_ine',
                         'cve_mpio_ine','anio','status_match'}
INEGI_REQUIRED_COLUMNS={'censo_ref','cvegeo_municipal_inegi','anio_eleccion',
                        'cve_ent_ine','cve_mpio_ine','status_match'}


def checked_mapping(path: Path,required_columns: set[str]) -> list[dict[str,str]]:
    if not path.is_file():
        raise FileNotFoundError(f'Falta mapping: {path}; ejecuta generate-mappings')
    with path.open('r',encoding='utf-8-sig',newline='') as stream:
        reader=csv.DictReader(stream)
        missing=required_columns-set(reader.fieldnames or ())
        if missing:
            raise ValueError(f'Mapping incompleto {path.name}: {sorted(missing)}')
        rows=[r for r in reader if r.get('status_match','').strip().lower()=='validado']
    if not rows:
        raise ValueError(f'No hay correspondencias validadas en {path}')
    return rows


def build_context(cfg,estado:int):
    """Deprecated command alias; no separate duplicate SQL path."""
    from revoto_pipeline.model.municipal_context import build_municipal_context
    return build_municipal_context(cfg,estado)
