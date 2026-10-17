"""Opt-in reproducible del Notebook 02: indicadores municipales INE×INEGI.

No se incorpora al contrato L4 hasta que producto apruebe indicadores,
fuentes censales, cobertura y divulgación. Los ratios nunca se calculan usando
una columna ausente o un denominador incompatible; devuelven NULL.
"""
from __future__ import annotations

import os
from pathlib import Path

from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.sql_utils import atomic_write


# Numerador y denominador deben pertenecer al mismo municipio/censo.
RATIOS = {
    'acceso_electricidad': ('inegi_vph_s_elec', 'viviendas', True),
    'internet_viviendas': ('inegi_vph_inter', 'viviendas', False),
    'celular_viviendas': ('inegi_vph_cel', 'viviendas', False),
    'sin_analfabetismo_15': ('inegi_p15ym_an', 'inegi_p_15ymas', True),
    'habla_lengua_indigena': ('inegi_p3ym_hli', 'inegi_p_3ymas', False),
    'hogares_indigenas': ('inegi_phog_ind', 'inegi_pobtot', False),
    'afromexicana': ('inegi_pob_afro', 'inegi_pobtot', False),
}


def _percent(num: str, denom: str, available: set[str], *, invert: bool) -> str:
    if num not in available or denom not in available:
        return 'NULL::DOUBLE'
    # Bound indices from tables already materialized; untrusted CSV not in SQL.
    n, d = f'TRY_CAST(src."{num}" AS DOUBLE)', f'TRY_CAST(src."{denom}" AS DOUBLE)'
    quotient = f'({n}/NULLIF({d},0))'
    return (f'CASE WHEN {d}>0 AND {n}>=0 AND {n}<={d} '
            f'THEN 100.0*({"1.0-" if invert else ""}{quotient}) ELSE NULL END')


def _denom_viviendas(con, base: str, columns: set[str]) -> str | None:
    # No escoger según valores de cada municipio: una fórmula debe tener
    # denominador único y documentado por corrida/censo.
    for name in ('inegi_vivpar_hab', 'inegi_tvivparhab'):
        if name in columns:
            count = con.execute(f'''SELECT COUNT(*) FROM {base} WHERE TRY_CAST("{name}" AS DOUBLE)>0''').fetchone()[0]
            if count:
                return name
    return None


def build_indicadores_municipales(cfg: Settings, estado: int) -> dict:
    """Crea un mart analítico separado con indicadores y metadatos temporales.

    Requiere INEGI activado y los Parquet full_context correspondientes.
    No modifica full_context, marts canónicos ni archivos L4.
    """
    if not cfg.integration.incluir_inegi:
        raise ValueError('Los indicadores Notebook 02 necesitan integracion.incluir_inegi=true')
    con = connection(cfg)
    result = {}
    try:
        for year in cfg.years:
            source = (cfg.path('processed')/'full_context'/f'edo={estado:02}'/
                      f'anio={year}'/'municipios.parquet')
            if not source.is_file():
                raise FileNotFoundError(f'Falta dataset integrado: {source}')
            base = f"read_parquet('{sql_path(source)}')"
            columns = {r[0] for r in con.execute(f'DESCRIBE SELECT * FROM {base}').fetchall()}
            if not {'AELEC', 'EDOCVE', 'MPIOCVE', 'inegi_matched', 'censo_ref'} <= columns:
                raise ValueError(f'full_context carece de columnas imprescindibles: {source}')
            vivienda = _denom_viviendas(con, base, columns)
            selects = []
            for indicator, (num, den, invert) in RATIOS.items():
                denominator = vivienda if den == 'viviendas' else den
                expr = _percent(num, denominator, columns, invert=invert) if denominator else 'NULL::DOUBLE'
                selects.append(f'{expr} AS {indicator}')
            if 'inegi_graproes' in columns:
                selects.append('''CASE WHEN src.inegi_graproes BETWEEN 0 AND 30
                    THEN src.inegi_graproes ELSE NULL END AS escolaridad''')
            else:
                selects.append('NULL::DOUBLE AS escolaridad')
            selects.extend((f"'{vivienda or 'sin_denominador'}'::VARCHAR AS denominador_vivienda",
                            f"'{cfg.reference[year]}'::VARCHAR AS censo_usado"))
            query = 'SELECT src.*, ' + ', '.join(selects) + f' FROM {base} src'
            output = (cfg.path('processed')/'analitica'/'indicadores_municipales'/
                      f'edo={estado:02}'/f'anio={year}'/'datos.parquet')
            tmp = atomic_write(con, query, output)
            try:
                original_n = con.execute(f'SELECT COUNT(*) FROM {base}').fetchone()[0]
                joined_n = con.execute(f"SELECT COUNT(*) FROM read_parquet('{sql_path(tmp)}')").fetchone()[0]
                duplicates = con.execute(f'''SELECT COUNT(*) FROM (
                    SELECT AELEC,EDOCVE,MPIOCVE,COUNT(*) AS n
                    FROM read_parquet('{sql_path(tmp)}')
                    GROUP BY 1,2,3 HAVING n>1)''').fetchone()[0]
                if original_n != joined_n or duplicates:
                    raise ValueError(f'Indicadores con duplicados o fanout: {estado}/{year}')
                os.replace(tmp, output)
            finally:
                tmp.unlink(missing_ok=True)
            result[year] = {'filas': original_n, 'denominador_vivienda': vivienda,
                            'censo_ref': cfg.reference[year]}
        return result
    finally:
        con.close()
