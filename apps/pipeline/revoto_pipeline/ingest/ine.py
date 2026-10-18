"""Locate CSVs from first-row state keys, stage each year independently."""
from __future__ import annotations
from pathlib import Path
import os
from revoto_pipeline.config import Settings, connection
from revoto_pipeline.sql_utils import atomic_write, read_csv
from revoto_pipeline.transform.ine import ine_select, municipality_select
from revoto_pipeline.validation.schemas import INE_COLUMNS, check_header, first_record, SchemaError
from revoto_pipeline.validation.quality import ine_quality, assert_ine_quality, save_report


def locate_ine_files(cfg: Settings, estado: int) -> dict[int, Path]:
    """Derive entity from EDOCVE, never from ambiguous filename abbreviations."""
    found: dict[int, Path] = {}
    for year in cfg.years:
        folder = cfg.path('ine_raw') / str(year)
        if not folder.is_dir():
            raise FileNotFoundError(f'Falta carpeta INE: {folder}')
        for file in folder.glob('*.csv'):
            check_header(file, INE_COLUMNS, exact=True, encoding=cfg.encoding)
            first = first_record(file, cfg.encoding)
            if int(first['EDOCVE'].strip()) == estado:
                if year in found:
                    raise SchemaError(f'Dos archivos para estado {estado}, año {year}')
                found[year] = file
    missing = sorted(set(cfg.years) - set(found))
    if missing:
        raise FileNotFoundError(f'Estado {estado:02}: faltan CSV de {missing}')
    return found


def ingest_state(cfg: Settings, estado: int) -> dict:
    if not 1 <= estado <= 32:
        raise ValueError('Estado debe estar entre 01 y 32')
    files = locate_ine_files(cfg, estado)
    con = connection(cfg)
    pending: list[tuple[Path,Path]] = []
    report: dict = {'estado': f'{estado:02}', 'years': {}, 'status': 'validated'}
    try:
        for year, source in sorted(files.items()):
            dest = cfg.path('ine_staging') / f'edo={estado:02}' / f'anio={year}' / 'conteos.parquet'
            tmp = atomic_write(con, ine_select(source, year), dest)
            pending.append((tmp, dest))
            metrics = ine_quality(con, tmp, year, estado)
            # Scans raw a second time for a robust input/output row-count check.
            source_rows = con.execute(f'SELECT COUNT(*) FROM {read_csv(source)}').fetchone()[0]
            metrics['source_rows'] = source_rows
            if source_rows != metrics['rows']:
                raise ValueError(f'{source}: diferencias de filas {source_rows} vs {metrics["rows"]}')
            assert_ine_quality(metrics)
            metrics['source_file'] = source.name
            report['years'][str(year)] = metrics
        # Promote only after validating every year for this entity.
        for tmp, dest in pending:
            os.replace(tmp, dest)
        save_report(cfg.path('reportes')/'ine'/f'edo={estado:02}.json', report)
        return report
    finally:
        for tmp, _ in pending:
            tmp.unlink(missing_ok=True)
        con.close()


def build_ine_municipal(cfg: Settings, estado: int) -> None:
    """Preserve counts; compute participation only after summation."""
    con = connection(cfg)
    try:
        for year in cfg.years:
            source = cfg.path('ine_staging')/f'edo={estado:02}'/f'anio={year}'/'conteos.parquet'
            if not source.exists():
                raise FileNotFoundError(source)
            for by_sex, name in [(False,'municipios'),(True,'municipios_sexo')]:
                out = cfg.path('processed')/'ine'/f'edo={estado:02}'/f'anio={year}'/f'{name}.parquet'
                tmp = atomic_write(con, municipality_select(source, by_sex), out)
                os.replace(tmp, out)
    finally:
        con.close()
