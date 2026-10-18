"""Identidad reproducible del contenido L4, independiente de la ruta absoluta local."""
from __future__ import annotations

import hashlib
from pathlib import Path


def fingerprint(staged: Path, root: Path, sources: list[Path]) -> str:
    """Crea sha256 del conjunto de fuentes y recursos finales antes del manifest.

    Bloquea colisiones de rutas y dependencias faltantes. El hash no utiliza fecha
    ni permisos/mtimes del sistema de archivos.
    """
    root = root.resolve()
    pairs = []
    for source in set(sources):
        source = Path(source).resolve()
        if not source.is_file():
            raise FileNotFoundError(f'Dependencia L4 ausente: {source}')
        label = source.relative_to(root).as_posix() if source.is_relative_to(root) else 'external/' + source.name
        pairs.append((label, source))
    if len({key for key, _ in pairs}) != len(pairs):
        raise ValueError('Colisión de rutas lógicas L4')
    digest = hashlib.sha256()
    for label, source in sorted(pairs):
        digest.update(b'INPUT\x00' + label.encode('utf-8') + b'\x00')
        with source.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1 << 20), b''):
                digest.update(chunk)
    for output in sorted(p for p in staged.rglob('*') if p.is_file()):
        logical = output.relative_to(staged).as_posix()
        if logical == 'manifest.json':
            raise ValueError('Versionar antes de escribir manifest.json')
        digest.update(b'OUTPUT\x00' + logical.encode('utf-8') + b'\x00')
        with output.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1 << 20), b''):
                digest.update(chunk)
    return digest.hexdigest()[:7]
