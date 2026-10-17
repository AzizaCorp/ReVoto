"""Identidad electoral por elección ≠ identidad municipal territorial de referencia.

Nunca se infiere una equivalencia a partir de similitud de nombres o de un MPIOCVE
sin año. Los dictámenes manuales deben conservar evidencia documentada.
"""
from __future__ import annotations

import csv
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

## !GRANDE: contrato de correspondencias versionadas y validación fail-closed.
COLUMNS = ('anio_eleccion', 'cve_ent_ine', 'cve_mpio_ine', 'nombre_ine',
           'cvegeo_canonico', 'nombre_canonico', 'tipo_equivalencia',
           'equivalencia_verificada', 'censo_referencia', 'fuente_referencia',
           'evidencia', 'observacion')
TYPES = frozenset({'exacta', 'recodificacion', 'renombre', 'ambigua_no_verificada'})


def normalize_name(value: object) -> str:
    text = unicodedata.normalize('NFKD', str(value or '').strip().upper())
    text = ''.join(c for c in text if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', re.sub(r'[^A-Z0-9]+', ' ', text)).strip()


def code5(value: object) -> str:
    text = str(value or '').strip()
    if len(text) == 9 and text.isascii() and text.isdigit() and text.endswith('0000'):
        text = text[:5]
    if len(text) != 5 or not text.isascii() or not text.isdigit() or text == '00000':
        raise ValueError(f'CVEGEO municipal no válido: {value!r}')
    return text


@dataclass(frozen=True)
class Identity:
    year: int
    state: int
    historic_code: int
    historic_name: str
    cvegeo: str
    name: str
    equivalence: str
    census: int
    source: str
    evidence: str

    @property
    def key(self) -> tuple[int, int, int]:
        return self.year, self.state, self.historic_code


def _read_rows(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        raise FileNotFoundError(f'Falta mapping municipal histórico: {path}. '
                                'Ejecuta generate-mappings y revisa pendientes.')
    with path.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        missing = set(COLUMNS) - set(reader.fieldnames or ())
        if missing:
            raise ValueError(f'Mapping municipal incompleto: {sorted(missing)}')
        return list(reader)


def load_identities(path: Path, *, years: set[int] | None = None,
                    states: set[int] | None = None) -> dict[tuple[int, int, int], Identity]:
    """Carga TODOS los registros (incluidos pendientes) y rechaza colisiones."""
    validated: dict[tuple[int, int, int], Identity] = {}
    seen: set[tuple[int, int, int]] = set()
    inverse: dict[tuple[int, str], tuple[int, int, int]] = {}
    for row in _read_rows(path):
        year, ent, mun = (int(row[k]) for k in ('anio_eleccion','cve_ent_ine','cve_mpio_ine'))
        if (years is not None and year not in years) or (states is not None and ent not in states):
            continue
        key = year, ent, mun
        if key in seen:
            raise ValueError(f'Mapping municipal duplicado: {key}')
        seen.add(key)
        eq = row['tipo_equivalencia'].strip().lower()
        verified = row['equivalencia_verificada'].strip().lower()
        if eq not in TYPES or verified not in {'si', 'no'}:
            raise ValueError(f'Estado de equivalencia inválido en {key}: {eq}/{verified}')
        if verified == 'no':
            if row['cvegeo_canonico'].strip():
                raise ValueError(f'Mapping pendiente tiene CVEGEO publicable en {key}')
            continue
        if eq == 'ambigua_no_verificada':
            raise ValueError(f'Equivalencia ambigua declarada verificada: {key}')
        cvegeo = code5(row['cvegeo_canonico'])
        if int(cvegeo[:2]) != ent:
            raise ValueError(f'CVEGEO de otra entidad en {key}: {cvegeo}')
        evidence = row['evidencia'].strip()
        source = row['fuente_referencia'].strip()
        if not evidence or not source or not row['nombre_ine'].strip() or not row['nombre_canonico'].strip():
            raise ValueError(f'Equivalencia sin evidencia o nombres: {key}')
        if eq == 'exacta' and (mun != int(cvegeo[2:]) or
                               normalize_name(row['nombre_ine']) != normalize_name(row['nombre_canonico'])):
            raise ValueError(f'Equivalencia exacta incompatible código/nombre: {key}')
        if eq == 'recodificacion' and mun == int(cvegeo[2:]):
            raise ValueError(f'Recodificación sin cambio de clave: {key}')
        if eq == 'renombre' and mun != int(cvegeo[2:]):
            raise ValueError(f'Renombre con cambio de clave: {key}; revisar tipo')
        reverse_key = (year, cvegeo)
        if reverse_key in inverse:
            raise ValueError(f'Dos municipios históricos comparten CVEGEO en {year}: '
                             f'{inverse[reverse_key]} y {key}')
        identity = Identity(year, ent, mun, row['nombre_ine'].strip(), cvegeo,
                            row['nombre_canonico'].strip(), eq, int(row['censo_referencia']),
                            source, evidence)
        validated[key] = identity
        inverse[reverse_key] = key
    return validated


def require_identities(path: Path, origins: dict[tuple[int, int, int], str]) -> dict[tuple[int, int, int], Identity]:
    """Exige una decisión probada para CADA origen que se quiere integrar/publicar."""
    if not origins:
        return {}
    identities = load_identities(path, years={k[0] for k in origins},
                                 states={k[1] for k in origins})
    for key, original_name in origins.items():
        if key not in identities:
            raise ValueError(f'Equivalencia municipal pendiente/no verificada para '
                             f'(año, entidad, MPIOCVE)={key}, MPIONOM={original_name!r}; '
                             f'revisa {path}. No se publica ni se une contexto.')
        if normalize_name(identities[key].historic_name) != normalize_name(original_name):
            raise ValueError(f'MPIONOM histórico cambió respecto al mapping {key}: '
                             f'{original_name!r} != {identities[key].historic_name!r}')
    return {key: identities[key] for key in origins}
