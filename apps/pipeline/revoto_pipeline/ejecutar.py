"""Utilidades para correr los pasos SQL y la validación. Se usan también en las pruebas."""

from __future__ import annotations
import argparse
from revoto_pipeline.config import load_config, Settings, sql_path
from revoto_pipeline.ingest.ine import ingest_state, build_ine_municipal
from revoto_pipeline.ingest.inegi import build_inegi
from revoto_pipeline.ingest.conapo import build_conapo
from revoto_pipeline.transform.context import build_context, checked_mapping, CONAPO_REQUIRED_COLUMNS, INEGI_REQUIRED_COLUMNS
from revoto_pipeline.transform.full_context import build_full_context
from revoto_pipeline.geo.temporal import resolve_reference
from revoto_pipeline.geo.inegi_shapes import build_inegi_geo_layers
from revoto_pipeline.geo.crosswalk import build_crosswalk
from revoto_pipeline.export.frontend import export_web
from revoto_pipeline.validation.quality import ine_quality, assert_ine_quality
from revoto_pipeline.generar_mappings import main as generate_mappings

COMMANDS = ['run', 'run-integrated', 'prepare-sources', 'ingest-ine','aggregate-ine',
            'build-inegi', 'build-conapo', 'build-geo-layers', 'build-context',
            'build-full-context', 'build-crosswalk', 'validate', 'export-web', 'catalog',
            'generate-mappings']


def choose_states(args: argparse.Namespace) -> list[int]:
    return list(range(1, 33)) if args.all else [int(args.estado)]


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
    base.parent.mkdir(parents=True,exist_ok = True)
    available = list(cfg.path('ine_staging').rglob('conteos.parquet'))
    if not available:
        raise FileNotFoundError('Primero ejecutar ingest-ine')
    con = duckdb.connect(str(base))
    try:
        for name, directory, file in (
            ('ine_conteos', cfg.path('ine_staging')/'conteos.parquet'),
            ('ine_municipios', cfg.path('processed')/'ine', 'municipios.parquet'),
            ('revoto_full_context', cfg.path('processed')/'full_context', 'municipios.parquet')):
            if list(directory.rglob('municipios.parquet')):
                glob = directory/'edo=*'/'anio=*'/file
                con.execute(f"CREATE OR REPLACE VIEW {name} AS SELECT * FROM read_parquet('{sql_path(glob)}', hive_partitioning=false)")
            print(f'Catálogo de vistas actualizado: {base}')
    finally:
        con.close()


def prepare_sources(cfg: Settings) -> None:
    for census in sorted(set(cfg.reference.values())):
        print('INEGI', build_inegi(cfg,census))
    print('CONAPO',build_conapo(cfg))


def preflight_integrated(cfg: Settings) -> None:
    """Fallar cuando los mapeos municipales no verificados no tengan filas."""
    checked_mapping(cfg.path('mapping_conapo_ine'), CONAPO_REQUIRED_COLUMNS)
    checked_mapping(cfg.path('mapping_inegi_ine'), INEGI_REQUIRED_COLUMNS)


def main() -> None:
    parser = argparse.ArgumentParser(description = 'REVOTO: pipeline local INE / INEGI / CONAPO + geografia')
    parser.add_argument('command', nargs = '?', default = 'run', choices = COMMANDS)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--estado', choices = [f'{i:02}' for i in range(1, 33)], default = '01')
    group.add_argument('--all', action = 'store_true')
    parser.add_argument('--censo', type = int, choices = [2010, 2020], default = None, 
                        help = 'Solo build-inegi; en crosswalk se infiere por --anio')
    parser.add_argument('--anio', type = int, help = 'Año de ELECCION para build-crosswalk')
    parser.add_argument('--cartografia', type = int, help = 'Valida que corresponda a regla 2021/2023')
    parser.add_argument('--integrado', action = 'store_true',
                            help = 'export-web de INE+CONAPO+INEGI, exige build-full-context')
    args = parser.parse_args()
    cfg = load_config()
    cmd = args.command
    if cmd == 'build-inegi':
        if args.censo is None:
            parser.error('build-inegi requiere --censo 2010 o 2020')
        print(build_inegi(cfg, args.censo));return
    if cmd == 'build-conapo':
        print(build_conapo(cfg));return
    if cmd == 'generate-mappings':
        generate_mappings();return
    if cmd == 'prepare-sources':
        prepare_sources(cfg);return
    if cmd == 'catalog':
        catalog(cfg);return
    if cmd == 'build-crosswalk' and args.cartografia is None:
        if args.anio is None:
            parser.error('build-crosswalk requiere --anio ELECCION (no solo --cartografia)')
        resolve_reference(cfg,args.anio,args.censo,args.cartografia)
        if cmd == 'run-integrated':
            preflight_integrated(cfg)
            prepare_sources(cfg)
    for estado in choose_states(args):
        if cmd in ('run', 'run-integrated', 'ingest-ine'):
            print(ingest_state(cfg, estado))
        if cmd in ('run', 'run-integrated', 'aggregate-ine'):
            build_ine_municipal(cfg, estado)
        if cmd in ('run','export-web'):
            print(export_web(cfg, estado, integrado = (cmd == 'run-integrated' or args.integrado)))
        if cmd in ('run-integrated', 'build-geo-layers'):
            print('CAPAS INEGI:', build_inegi_geo_layers(cfg, estado))
        if cmd == 'build-context':
            print(build_context(cfg, estado))
        if cmd in ('run-integrated', 'build-full-context'):
            print(build_full_context(cfg, estado))
        if cmd in ('run-integrated', 'build-crosswalk'):
            elections = cfg.years if cmd == 'run-integrated' else (args.anio,)
            for anio in elections:
                print(build_crosswalk(cfg, estado, anio,
                      census=args.censo,
                      cartography_year=args.cartografia))
        if cmd == 'validate':
            validate(cfg,estado)
        if cmd == 'run-integrated':
            print(export_web(cfg, estado, integrado=True))

if __name__ == '__main__':
    main()