"""L4 validation against packages/contracts: one public contract, no v2 bypass."""
from __future__ import annotations
import json
from pathlib import Path
from functools import lru_cache

SCHEMAS = {
    'manifest': 'manifest.schema.json',
    'nacional': 'nacional.schema.json',
    'entidad': 'entidad.schema.json',
    'municipio': 'municipio.schema.json',
}


@lru_cache(maxsize=1)
def _schemas() -> dict:
    root = Path(__file__).resolve().parents[4] / 'packages' / 'contracts' / 'schemas'
    return {path.name: json.loads(path.read_text(encoding='utf-8'))
            for path in root.glob('*.schema.json')}


def validate_payload(payload: object, kind: str, *, allow_extensions: bool = False) -> None:
    """Reject anything that is not a valid published L4 DTO.

    The Python JSONSchema dependency is required for publication. TypeScript type
    assertions do not validate the payload at runtime.
    """
    try:
        import jsonschema
    except ImportError as exc:
        raise RuntimeError('Publicar L4 requiere instalar jsonschema') from exc
    if kind == 'catalogo_entidades':
        if not isinstance(payload, list) or len(payload) != 32:
            raise ValueError('El catálogo público debe contener exactamente 32 entidades')
        codes = []
        for item in payload:
            if not isinstance(item, dict) or set(item) != {'cve', 'nombre'}:
                raise ValueError('Entidad del catálogo con campos inválidos')
            if type(item['cve']) is not int or not 1 <= item['cve'] <= 32:
                raise ValueError('Clave de entidad inválida')
            if not isinstance(item['nombre'], str) or not item['nombre'].strip():
                raise ValueError('Nombre de entidad vacío')
            codes.append(item['cve'])
        if sorted(codes) != list(range(1, 33)):
            raise ValueError('El catálogo tiene claves faltantes o duplicadas')
        return
    if allow_extensions and kind in ('entidad', 'municipio'):
        # Contrato propuesto para W-03/04/09; los schemas compartidos se
        # actualizan junto con sus DTO TypeScript antes de publicar en web.
        base = dict(payload)
        if kind == 'municipio':
            _check_cvegeo(base.pop('cvegeo', None), 'municipio.cvegeo')
            if 'vecinos' in base:
                neighbors = base.pop('vecinos')
                if not isinstance(neighbors, list) or any(type(v) is not int or v < 1
                                                          for v in neighbors) or sorted(set(neighbors)) != neighbors:
                      raise ValueError('municipio.vecinos debe ser lista ordenada de claves INE únicas')
                if base['territorio']['cve'] in neighbors:
                    raise ValueError('Un municipio no puede ser vecino de sí mismo')
            if 'arquetipo' in base:
                _check_arquetipo(base.pop('arquetipo'))
        else:
            if 'votos_esperados_por_edad' in base:
                _check_esperados(base.pop('votos_esperados_por_edad'))
            summaries = []
            for municipality in base['municipios']:
                summary = dict(municipality)
                _check_cvegeo(summary.pop('cvegeo', None), 'resumenMunicipio.cvegeo')
                summaries.append(summary)
            base['municipios'] = summaries
        # Al actualizar packages/contracts, validar el DTO COMPLETO contra el
        # esquema compartido. En diagnósticos previos al PR conjunto validar
        # su proyección L4 base y las extensiones de forma estricta aquí.
        current_schema = _schemas().get(SCHEMAS[kind], {})
        if kind == 'municipio':
            in_shared_contract = 'cvegeo' in current_schema.get('properties', {})
        else:
            in_shared_contract = 'votos_esperados_por_edad' in current_schema.get('properties', {})
        if not in_shared_contract:
            payload = base
    if kind not in SCHEMAS:
        raise ValueError(f'Tipo de recurso L4 no reconocido: {kind}')
    schemas = _schemas()
    name = SCHEMAS[kind]
    if name not in schemas or 'comun.schema.json' not in schemas:
        raise FileNotFoundError(f'Faltan los JSON Schema de L4: {name}')
    # The repository uses relative $ref: comun.schema.json#/$defs/...
    from jsonschema import Draft7Validator, RefResolver
    root = Path(__file__).resolve().parents[4] / 'packages' / 'contracts' / 'schemas'
    resolver = RefResolver(base_uri=root.as_uri() + '/', referrer=schemas[name],
                            store={k: v for k, v in schemas.items()} |
                                    {(root / k).as_uri(): v for k, v in schemas.items()})
    validator = Draft7Validator(schemas[name], resolver=resolver)
    errors = sorted(validator.iter_errors(payload), key=lambda e: (list(map(str, e.path)), e.message))
    if errors:
        e = errors[0]
        raise ValueError(f'L4 {kind} inválido en {list(e.path)}: {e.message}')


def _check_cvegeo(code: object, label: str) -> None:
    if not isinstance(code, str) or len(code) != 5 or not code.isascii() or not code.isdigit():
        raise ValueError(f'{label} debe ser string de 5 dígitos, recibido {code!r}')


def _check_esperados(values: object) -> None:
    if not isinstance(values, dict) or set(values) != {'18-24','25-34','35-44','45-59','60+'}:
        raise ValueError('votos_esperados_por_edad requiere exactamente cinco grupos RN-04')
    if any(type(v) not in (float,int) or not 0 <= v <= 3 for v in values.values()):
        raise ValueError('votos esperados deben pertenecer a [0,3]')


def _check_arquetipo(obj: object) -> None:
    if not isinstance(obj, dict) or set(obj) != {'id','nombre','nivel','efecto_presidencial',
                                                  'tendencia','volatilidad','tipicidad','rasgo'}:
        raise ValueError('Arquetipo no cumple campos exactos L4')
    if obj['id'] not in {'A1','A2','A3','A4','A5'} or obj['rasgo'] not in {'nivel','efp','tend','vol'}:
        raise ValueError('Arquetipo con identificador o rasgo inválido')
    if not isinstance(obj['nombre'],str) or not obj['nombre'].strip():
        raise ValueError('Arquetipo sin nombre')
    if any(type(obj[c]) not in (int,float) for c in ('nivel','efecto_presidencial','tendencia',
                                                      'volatilidad','tipicidad')):
        raise ValueError('Variables de arquetipo deben ser numéricas')
    if not 0 <= obj['tipicidad'] <= 1 or obj['volatilidad'] < 0:
        raise ValueError('Arquetipo con tipicidad o volatilidad inválidas')
