"""Diagnóstico SOLO LECTURA de equivalencias municipales históricas.

Uso desde apps/pipeline: python diagnosticar_municipios.py --estado 01 --anio 2009
"""
from __future__ import annotations
import argparse
import csv
from pathlib import Path
from revoto_pipeline.config import load_config


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--estado', type=int, required=True)
    parser.add_argument('--anio', type=int, required=True)
    args = parser.parse_args()
    cfg = load_config()
    mapping = cfg.path('mapping_municipal_historico')
    if not mapping.is_file():
        raise SystemExit(f'No existe {mapping}. Ejecuta generate-mappings primero.')
    with mapping.open(encoding='utf-8-sig', newline='') as stream:
        rows = [r for r in csv.DictReader(stream)
                if int(r['anio_eleccion']) == args.anio and int(r['cve_ent_ine']) == args.estado]
    print(f'Mapping: {mapping}\nAño: {args.anio}; entidad: {args.estado:02}; filas: {len(rows)}')
    for r in sorted(rows, key=lambda x: int(x['cve_mpio_ine'])):
        if r['equivalencia_verificada'].strip().lower() != 'si':
            print(f"PENDIENTE: INE {int(r['cve_mpio_ine']):03} {r['nombre_ine']!r}; "
                  f"tipo={r['tipo_equivalencia']}; observación={r['observacion']}")
    try:
        import duckdb
    except ImportError:
        print('DuckDB no instalado: se omite comparación con canonical.')
        return
    src = cfg.path('processed')/'canonical'/'hecho_participacion'/f'edo={args.estado:02}'/f'anio={args.anio}'/'hechos.parquet'
    if not src.is_file():
        print(f'Canonical no existe: {src}')
        return
    con = duckdb.connect(':memory:')
    try:
        sql = "SELECT MPIOCVE, MPIONOM, COUNT(*) FROM read_parquet(?) GROUP BY 1,2 ORDER BY 1,2"
        print('Municipios observados en canonical:')
        for c,n,k in con.execute(sql,[str(src)]).fetchall():
            matches = [r for r in rows if int(r['cve_mpio_ine']) == int(c)]
            verificado = len(matches)==1 and matches[0]['equivalencia_verificada'].strip().lower() == 'si'
            print(f'  {int(c):03} {n!r}: {k} registros; mapping verificado={verificado}')
    finally:
        con.close()
    print('No se modificó ningún archivo ni se aprobaron equivalencias.')

if __name__ == '__main__':
    main()
