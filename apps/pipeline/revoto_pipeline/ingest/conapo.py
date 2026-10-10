"""CONAPO municipal annual ingestion: no conflation with nominal electorate."""
from __future__ import annotations
import os
from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write
from revoto_pipeline.transform.conapo import conapo_select
from revoto_pipeline.validation.schemas import check_header, CONAPO_COLUMNS
from revoto_pipeline.validation.quality import save_report


def build_conapo(cfg: Settings) -> dict:
    source = cfg.path('conapo_raw')
    check_header(source, CONAPO_COLUMNS, exact=True, encoding=cfg.encoding)
    out = cfg.path('conapo_staging') / 'poblacion_anual.parquet'
    con = connection(cfg)
    try:
        tmp = atomic_write(con, conapo_select(source), out)
        q = f"read_parquet('{sql_path(tmp)}')"
        metrics = con.execute(f'''SELECT COUNT(*) AS rows,
            COUNT(*) FILTER (WHERE anio IS NULL OR sexo_ine IS NULL OR clave_municipal_raw IS NULL) AS bad_keys,
            COUNT(*) FILTER (WHERE pob_total_num IS NULL OR pob_total_num<0
                      OR POB_00_011_num IS NULL OR POB_012_29_num IS NULL
                      OR POB_30_59_num IS NULL OR POB_60_mm_num IS NULL) AS invalid_measures,
            COUNT(*) FILTER (WHERE pob_total_num <> POB_00_011_num + POB_012_29_num
                                             + POB_30_59_num + POB_60_mm_num) AS invalid_age_sum,
            COUNT(*) FILTER (WHERE TRY_CAST(fecha AS DATE) IS NULL
                OR YEAR(TRY_CAST(fecha AS DATE)) <> anio) AS invalid_date_year,
            COUNT(*) FILTER (WHERE TRIM(COALESCE(NOM_ENT,'')) <>
                          TRIM(COALESCE(NOM_ENT_etq,''))) AS state_label_mismatches,
            MIN(anio) AS min_year, MAX(anio) AS max_year,
            COUNT(DISTINCT (clave_municipal_raw, anio, sexo_ine)) AS candidate_keys
            FROM {q}''').fetchone()
        report = dict(zip(['rows','bad_keys','invalid_measures','invalid_age_sum','invalid_date_year','state_label_mismatches','min_year','max_year','candidate_keys'],metrics))
        if report['bad_keys'] or report['invalid_measures'] or report['invalid_age_sum'] or report['invalid_date_year'] or report['candidate_keys'] != report['rows']:
            raise ValueError(f'Falla CONAPO: {report}')
        os.replace(tmp, out)
        save_report(cfg.path('reportes')/'conapo'/'quality.json',report)
        return report
    finally:
        con.close()
