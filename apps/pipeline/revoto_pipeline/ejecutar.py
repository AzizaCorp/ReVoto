"""CLI orchestrator. Orchestration here; IO/SQL/GIS belong to focused modules."""
from __future__ import annotations
import argparse
from revoto_pipeline.config import load_config, Settings

COMMANDS = ('run','run-integrated','prepare-sources','ingest-ine','aggregate-ine',
            'build-canonical','build-marts','build-inegi','build-conapo',
            'build-geo-layers','build-crosswalk','build-inegi-secciones','build-context',
            'build-full-context','validate','export-web','catalog','build-db','generate-mappings')


def choose_states(args: argparse.Namespace) -> list[int]:
    return list(range(1,33)) if args.all else [int(args.estado)]


def validate(cfg:Settings,estado:int):
    from revoto_pipeline.config import connection
    from revoto_pipeline.validation.quality import ine_quality,assert_ine_quality
    con=connection(cfg)
    try:
        for year in cfg.years:
            file=cfg.path('ine_staging')/f'edo={estado:02}'/f'anio={year}'/'conteos.parquet'
            info=ine_quality(con,file,year,estado)
            assert_ine_quality(info)
            print('VALIDO',estado,year,info)
    finally:
        con.close()


def prepare_sources(cfg:Settings):
    if cfg.integration.incluir_inegi:
        from revoto_pipeline.ingest.inegi import build_inegi
        for census in sorted(set(cfg.reference.values())):
            print('INEGI',build_inegi(cfg,census))
    if cfg.integration.incluir_conapo:
        from revoto_pipeline.ingest.conapo import build_conapo
        print('CONAPO',build_conapo(cfg))


def build_context(cfg:Settings,estado:int):
    from revoto_pipeline.model.municipal_context import build_municipal_context
    return build_municipal_context(cfg,estado)


def catalog(cfg:Settings):
    from revoto_pipeline.model.database import build_database
    return build_database(cfg)


def main(argv: list[str] | None=None):
    parser=argparse.ArgumentParser(description='REVOTO: motor analítico electoral local')
    parser.add_argument('command',nargs='?',default='run',choices=COMMANDS)
    scope=parser.add_mutually_exclusive_group()
    scope.add_argument('--estado',choices=[f'{i:02}' for i in range(1,33)],default='01')
    scope.add_argument('--all',action='store_true')
    parser.add_argument('--censo',type=int,choices=[2010,2020])
    parser.add_argument('--anio',type=int)
    parser.add_argument('--cartografia',type=int)
    parser.add_argument('--integrado',action='store_true')
    args=parser.parse_args(argv)
    cfg=load_config()
    cmd=args.command
    if cmd=='generate-mappings':
        from revoto_pipeline.generar_mappings import main as generate
        generate();return
    if cmd=='prepare-sources':
        prepare_sources(cfg);return
    if cmd=='build-inegi':
        if args.censo is None: parser.error('build-inegi requiere --censo')
        from revoto_pipeline.ingest.inegi import build_inegi
        print(build_inegi(cfg,args.censo));return
    if cmd=='build-conapo':
        from revoto_pipeline.ingest.conapo import build_conapo
        print(build_conapo(cfg));return
    if cmd in ('build-db','catalog'):
        if cmd=='catalog':print('AVISO: catalog alias de build-db')
        print(catalog(cfg));return
    if cmd=='run-integrated':
        prepare_sources(cfg)
    if cmd in ('build-crosswalk','build-inegi-secciones') and args.anio is None:
        parser.error(f'{cmd} requiere --anio para evitar referencias temporales implícitas')
    for estado in choose_states(args):
        if cmd in ('run','run-integrated','ingest-ine'):
            from revoto_pipeline.ingest.ine import ingest_state
            print('INE',ingest_state(cfg,estado))
        if cmd in ('run','run-integrated','aggregate-ine'):
            from revoto_pipeline.ingest.ine import build_ine_municipal
            build_ine_municipal(cfg,estado)
        if cmd in ('run','run-integrated','build-canonical'):
            from revoto_pipeline.model.canonical import build_canonical
            print('CANONICAL',build_canonical(cfg,estado))
        if cmd in ('run','run-integrated','build-marts'):
            from revoto_pipeline.model.marts import build_marts
            print('MARTS',build_marts(cfg,estado))
        if cmd in ('run-integrated','build-geo-layers') and cfg.integration.incluir_geografia:
            from revoto_pipeline.geo.inegi_shapes import build_inegi_geo_layers
            print('GIS',build_inegi_geo_layers(cfg,estado))
        if cmd in ('run-integrated','build-crosswalk') and cfg.integration.incluir_geografia and (cfg.integration.incluir_inegi or cmd=='build-crosswalk'):
            from revoto_pipeline.geo.crosswalk import build_crosswalk
            years=cfg.years if cmd=='run-integrated' else (args.anio,)
            for year in years:
                print('CROSSWALK',build_crosswalk(cfg,estado,year,census=args.censo,
                                                  cartography_year=args.cartografia))
        if cmd in ('run-integrated','build-inegi-secciones') and cfg.integration.incluir_geografia and cfg.integration.incluir_inegi:
            from revoto_pipeline.model.contexto_inegi import build_contexto_inegi
            years=cfg.years if cmd=='run-integrated' else (args.anio,)
            for year in years:
                print('INEGI SECCIONES',build_contexto_inegi(cfg,estado,year))
        if cmd in ('run-integrated','build-context','build-full-context'):
            print('CONTEXTO MUNICIPAL',build_context(cfg,estado))
        if cmd=='validate': validate(cfg,estado)
        if cmd in ('run','run-integrated','export-web'):
            from revoto_pipeline.export.frontend import export_web
            print('FRONTEND',export_web(cfg,estado,integrado=(cmd=='run-integrated' or args.integrado)))
    if cmd in ('run','run-integrated'):
        print('DUCKDB',catalog(cfg))


if __name__=='__main__':
    main()
