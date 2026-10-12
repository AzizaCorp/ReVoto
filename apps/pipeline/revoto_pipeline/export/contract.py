"""Lightweight no-extra-dependency validation of the specialized frontend v2 envelope."""
from __future__ import annotations


def validate_payload(payload: dict) -> None:
    required=('schema_version','estado','anio_eleccion','grano','fuentes')
    if any(k not in payload for k in required):
        raise ValueError('Faltan campos obligatorios del frontend_v2')
    if payload['schema_version'] != 2 or type(payload['anio_eleccion']) is not int:
        raise ValueError('schema_version/anio_eleccion inválidos')
    if not isinstance(payload['estado'],str) or len(payload['estado'])!=2 or not payload['estado'].isdigit():
        raise ValueError('estado inválido')
    if not isinstance(payload['fuentes'],list) or not payload['fuentes']:
        raise ValueError('fuentes inválidas')
    variants=[k for k in ('medidas','contexto_municipal','contexto_territorial') if k in payload]
    if len(variants)!=1 or not isinstance(payload[variants[0]],list):
        raise ValueError('Debe existir un único tipo de read model')
    if variants[0]=='medidas':
        for r in payload['medidas']:
            if any(k not in r for k in ('publicacion','ln','sv','nv','ns','participacion_pct')):
                raise ValueError('Medida sin claves requeridas')
            if r['publicacion']=='suppressed' and any(r[k] is not None for k in ('ln','sv','nv','ns','participacion_pct')):
                raise ValueError('Medida suprimida contiene valores numéricos')
