"""Perfil descriptivo por estado. No convierte un K-means municipal en modelo estatal."""
from __future__ import annotations

from collections.abc import Mapping
import math

from revoto_pipeline.export.metricas import YEARS, PRESIDENCIALES, counts


def perfil_estatal(state: Mapping[int, object], national: Mapping[int, object]) -> dict | None:
    """Seis observaciones completas; referencia nacional calculada desde conteos.

    La regresión usa las mismas variables de diseño del estudio municipal:
    intercepción, tiempo centrado, indicador presidencial. Devuelve indicadores
    descriptivos, NO una etiqueta A1–A5 ni un identificador de clúster.
    """
    if set(state) != set(YEARS) or set(national) != set(YEARS):
        return None
    from numpy import array, column_stack, linalg, std

    rates, pres, dates = [], [], []
    for year in YEARS:
        s, n = counts(state[year]), counts(national[year])
        if s.ln == s.ns or n.ln == n.ns:
            return None
        rates.append(100 * (s.sv / (s.ln - s.ns) - n.sv / (n.ln - n.ns)))
        pres.append(int(year in PRESIDENCIALES))
        dates.append(year)
    t = (array(dates) - 2016.5) / 7.5
    y = array(rates)
    x = column_stack([array([1.] * len(YEARS)), t, array(pres, dtype=float)])
    beta, _, rank, _ = linalg.lstsq(x, y, rcond=None)
    if rank != 3:
        return None
    residual = y - x @ beta
    output = {
        'metodologia': 'perfil_descriptivo_estatal_v1',
        'nivel_pp': round(float(y.mean()), 3),
        'efecto_presidencial_pp': round(float(y[array(pres) == 1].mean() - y[array(pres) == 0].mean()), 3),
        'tendencia_pp_decada': round(float(beta[1] * 10 / 7.5), 3),
        'volatilidad_pp': round(float(std(residual, ddof=3)), 3),
        'anios': list(YEARS),
        'referencia': 'participacion_nacional_desde_conteos',
    }
    return output if all(math.isfinite(v) for v in output.values() if type(v) in (int, float)) else None
