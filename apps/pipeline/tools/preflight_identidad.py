"""REVOTO: preflight de publicación; no inventa ni aprueba equivalencias.

Ejecutar desde apps/pipeline: python preflight_identidad.py [--run-ready-context]
"""
from __future__ import annotations
import argparse
import csv
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

YEARS = (2009, 2012, 2015, 2018, 2021, 2024)


def inspect(root: Path):
    path = root / 'data/mappings/municipios_historicos.csv'
    if not path.is_file():
        raise FileNotFoundError(f'No existe {path}. Ejecuta generate-mappings.')
    with path.open(encoding='utf-8-sig', newline='') as source:
        rows = list(csv.DictReader(source))
    groups = defaultdict(lambda: {'total':0,'verificados':0,'pendientes':[]})
    seen = set()
    for row in rows:
        year, state, municipality = (int(row[c]) for c in ('anio_eleccion','cve_ent_ine','cve_mpio_ine'))
        key = (year, state, municipality)
        if key in seen:
            raise ValueError(f'Mapping duplicado: {key}')
        seen.add(key)
        group=groups[(year,state)]
        group['total'] += 1
        if row['equivalencia_verificada'].strip().lower() == 'si':
            group['verificados'] += 1
        else:
            group['pendientes'].append(f'{municipality:03d}:{row["nombre_ine"]}')
    full_states = [state for state in range(1,33) if all(
        (year,state) in groups and groups[(year,state)]['total'] == groups[(year,state)]['verificados']
        for year in YEARS)]
    report = root / 'data/quality/preflight_publicacion.csv'
    report.parent.mkdir(parents=True, exist_ok=True)
    with report.open('w',encoding='utf-8-sig',newline='') as file:
        writer=csv.writer(file)
        writer.writerow(['anio','estado','municipios','verificados','pendientes','full_context_existente','full_context_canonico','ejecutable'])
        for (year,state), info in sorted(groups.items()):
            context=root/'data/processed/full_context'/f'edo={state:02d}'/f'anio={year}'/'municipios.parquet'
            ready=info['total']==info['verificados']
            writer.writerow([year,f'{state:02d}',info['total'],info['verificados'],len(info['pendientes']),
                             'si' if context.is_file() else 'no','no_comprobado' if context.is_file() else 'no',
                             'si' if ready else 'no'])
    print(f'Identidades: {len(rows):,}; pendientes: {sum(len(x["pendientes"]) for x in groups.values()):,}')
    print(f'Particiones listas: {sum(x["total"]==x["verificados"] for x in groups.values())}/{len(groups)}')
    print('Estados completos en 6 años:', ', '.join(f'{s:02d}' for s in full_states) or '(ninguno)')
    print('Informe:',report)
    return groups,full_states


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-ready-context',action='store_true',help='Ejecutar build-full-context únicamente para estados completos')
    parser.add_argument('--verify-all',action='store_true',help='Salir con error si no están completos los 32 estados')
    args=parser.parse_args()
    pipeline=Path(__file__).resolve().parent
    root=pipeline.parents[1]  # apps/pipeline -> ReVoto
    groups,full_states=inspect(root)
    if args.run_ready_context:
        for state in full_states:
            print(f'Construyendo full_context estado {state:02d}',flush=True)
            subprocess.run([sys.executable,'-m','revoto_pipeline','build-full-context','--estado',f'{state:02d}'],
                           cwd=pipeline,check=True)
    if args.verify_all and len(full_states)!=32:
        raise SystemExit('PUBLICACIÓN BLOQUEADA: faltan equivalencias verificadas. No ejecutar export-web --all.')
    if args.verify_all:
        print('Todas las identidades están verificadas; continúa con build-full-context --all, build-db y export-web --all --dry-run.')

if __name__=='__main__':
    main()
