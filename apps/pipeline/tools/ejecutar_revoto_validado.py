"""Ejecuta REVOTO sólo cuando la identidad territorial es publicable.

Desde apps/pipeline:
 python ejecutar_revoto_validado.py --check
 python ejecutar_revoto_validado.py --ready-context
 python ejecutar_revoto_validado.py --all

No modifica mappings, canonical ni controles de calidad.
"""
from __future__ import annotations
import argparse
import csv
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

YEARS = (2009, 2012, 2015, 2018, 2021, 2024)


def inspect(project_root: Path):
    src = project_root / 'data/mappings/municipios_historicos.csv'
    if not src.is_file():
        raise SystemExit(f'Falta {src}; ejecuta generate-mappings primero.')
    with src.open('r', encoding='utf-8-sig', newline='') as handle:
        records = list(csv.DictReader(handle))
    required = {'anio_eleccion', 'cve_ent_ine', 'cve_mpio_ine', 'nombre_ine',
                'cvegeo_canonico', 'equivalencia_verificada'}
    if records and not required.issubset(records[0]):
        raise SystemExit(f'Columnas faltantes: {required - set(records[0])}')
    groups = defaultdict(lambda: {'total': 0, 'pending': 0})
    pending = []
    seen = set()
    for row in records:
        key = tuple(int(row[c]) for c in ('anio_eleccion', 'cve_ent_ine', 'cve_mpio_ine'))
        if key in seen:
            raise SystemExit(f'Identidad histórica duplicada: {key}')
        seen.add(key)
        year, state, mun = key
        groups[(year, state)]['total'] += 1
        valid = row['equivalencia_verificada'].strip().lower() == 'si' and bool(row['cvegeo_canonico'].strip())
        if not valid:
            groups[(year, state)]['pending'] += 1
            pending.append(row)
    dest = project_root / 'data/quality/municipios_bloqueantes_publicacion.csv'
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(records[0]) if records else sorted(required))
        writer.writeheader()
        writer.writerows(pending)
    ready_states = [state for state in range(1, 33)
                    if all((year, state) in groups and groups[(year, state)]['pending'] == 0
                           for year in YEARS)]
    print(f'Registros históricos: {len(records):,}; pendientes: {len(pending):,}')
    print('Estados completos:', ', '.join(f'{x:02d}' for x in ready_states) or 'ninguno')
    print('Informe:', dest)
    return len(pending), ready_states, groups


def run(*args):
    print('>', ' '.join(args), flush=True)
    subprocess.run(args, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--ready-context', action='store_true')
    mode.add_argument('--all', action='store_true')
    options = parser.parse_args()
    pipeline = Path(__file__).resolve().parent
    root = pipeline.parents[1]
    pending, ready_states, _ = inspect(root)
    if options.check:
        return
    if options.ready_context:
        for state in ready_states:
            run(sys.executable, '-m', 'revoto_pipeline', 'build-full-context', '--estado', f'{state:02d}')
        return
    if pending or len(ready_states) != 32:
        raise SystemExit('BLOQUEADO: no hay mapping nacional completamente verificado. '
                         'Revisa municipios_bloqueantes_publicacion.csv. '
                         'No se aprobaron candidatos por nombre.')
    run(sys.executable, 'preflight_identidad.py', '--verify-all')
    run(sys.executable, '-m', 'revoto_pipeline', 'build-full-context', '--all')
    run(sys.executable, '-m', 'revoto_pipeline', 'build-db')
    run(sys.executable, '-m', 'pytest', 'tests', '-q')
    run(sys.executable, '-m', 'revoto_pipeline', 'export-web', '--all', '--dry-run')


if __name__ == '__main__':
    main()
