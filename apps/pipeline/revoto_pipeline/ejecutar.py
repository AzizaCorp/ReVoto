"""Utilidades para correr los pasos SQL y la validación. Se usan también en las pruebas."""

from __future__ import annotations
from pathlib import Path
import argparse
from revoto_pipeline.config import load_config, Settings, sql_path
from revoto_pipeline.ingest.ine import ingest_state, build_ine_municipal
from revoto_pipeline.ingest.inegi import build_inegi
from revoto_pipeline.ingest.conapo import build_conapo
from revoto_pipeline.transform.context import build_context
from revoto_pipeline.transform.full_context import build_full_context
from revoto_pipeline.geo.crosswalk import build_crosswalk
from revoto_pipeline.export.frontend import export_web
from revoto_pipeline.validation.quality import ine_quality, assert_ine_quality

COMMANDS = ['run','ingest-ine','aggregate-ine','build-inegi','build-conapo',
            'build-context','build-full-context','build-crosswalk','validate','export-web','catalog']


def choose_states(args: argparse.Namespace) -> list[int]:
    if args.all:
        return list(range(1,33))
    return [int(args.estado)]


def validate(cfg: Settings, estado: int) -> None:
    from revoto_pipeline.config import connection
    con = connection(cfg)
    try:
        for year in cfg.years:
            file = cfg.path('ine_staging')/f'edo={estado:02}'/f'anio={year}'/'conteos.parquet'
            info = ine_quality(con,file,year,estado)
            assert_ine_quality(info)
            print(f'VALIDO {estado:02} {year}: {info}')
    finally:
        con.close()


def catalog(cfg: Settings) -> None:
    """Persistent lightweight views over Parquet; does not ingest microdata."""
    import duckdb
    base = cfg.path('base')
    base.parent.mkdir(parents=True,exist_ok=True)
    available = list(cfg.path('ine_staging').rglob('conteos.parquet'))
    if not available:
        raise FileNotFoundError('Primero ejecutar ingest-ine')
    con = duckdb.connect(str(base))
    try:
        glob = cfg.path('ine_staging')/'edo=*'/'anio=*'/'conteos.parquet'
        con.execute(f"CREATE OR REPLACE VIEW ine_conteos AS SELECT * FROM read_parquet('{sql_path(glob)}', hive_partitioning=false)")
        municipal = cfg.path('processed')/'ine'
        if list(municipal.rglob('municipios.parquet')):
            glob = municipal/'edo=*'/'anio=*'/'municipios.parquet'
            con.execute(f"CREATE OR REPLACE VIEW ine_municipios AS SELECT * FROM read_parquet('{sql_path(glob)}', hive_partitioning=false)")
        print(f'Catálogo de vistas actualizado: {base}')
    finally:
        con.close()


def main() -> None:
    parser = argparse.ArgumentParser(description = 'REVOTO: pipeline local INE / INEGI / CONAPO')
    parser.add_argument('command', nargs = '?', default = 'run', choices = COMMANDS)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--estado', choices = [f'{i:02}' for i in range(1, 33)], default = '01')
    group.add_argument('--all', action = 'store_true')
    parser.add_argument('--censo', type = int, choices = [2010, 2020], default = 2020)
    parser.add_argument('--cartografia', type = int, help = 'Año del SHP de secciones (obligatorio en build-crosswalk)')
    args = parser.parse_args()
    cfg = load_config()
    if args.command == 'build-inegi':
        print(build_inegi(cfg, args.censo));return
    if args.command == 'build-conapo':
        print(build_conapo(cfg));return
    if args.command == 'catalog':
        catalog(cfg);return
    if args.command == 'build-crosswalk' and args.cartografia is None:
        parser.error('build-crosswalk requiere --cartografia AÑO; no asumir la versión del SHP')
    for estado in choose_states(args):
        cmd = args.command
        if cmd in ('run','ingest-ine'):
            print(ingest_state(cfg,estado))
        if cmd in ('run','aggregate-ine'):
            build_ine_municipal(cfg,estado)
        if cmd in ('run','export-web'):
            print(export_web(cfg,estado))
        if cmd == 'build-context':
            print(build_context(cfg,estado))
        if cmd == 'build-full-context':
            print(build_full_context(cfg,estado))
        if cmd == 'build-crosswalk':
            print(build_crosswalk(cfg,estado,args.censo,args.cartografia))
        if cmd == 'validate':
            validate(cfg,estado)

if __name__ == '__main__':
    main()