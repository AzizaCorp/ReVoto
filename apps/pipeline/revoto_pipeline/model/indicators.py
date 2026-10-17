"""Metadata-driven aggregations; missing/secret source cells always propagate NULL."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Indicator:
    method: str
    numerator: str | None = None
    denominator: str | None = None
    weight: str | None = None
    unit: str = 'personas'
    family: str = 'poblacion'
    census_comparability: str = 'verify_dictionary'


# GRAPROES is a mean of years of schooling for people aged 15+;
# the 15+ population is an explicitly requested weight (not POBTOT).
INDICATOR_AGGREGATION = {
    'POBTOT': Indicator('sum'),
    'POBFEM': Indicator('sum'),
    'POBMAS': Indicator('sum'),
    'P_18YMAS': Indicator('sum'),
    'P_18A24': Indicator('sum'),
    'P_60YMAS': Indicator('sum'),
    'PEA': Indicator('sum'),
    'POCUPADA': Indicator('sum'),
    'PDESOCUP': Indicator('sum'),
    'P15YM_AN': Indicator('sum'),
    'GRAPROES': Indicator('weighted_mean', weight='P_15YMAS'),
    'PORC_MUJERES': Indicator('ratio', numerator='POBFEM', denominator='POBTOT'),
    # Only variables already selected by transform/inegi.py. Ratios are NOT
    # inferred without a documented numerator + denominator in the registry.
    'P_15YMAS': Indicator('sum', family='poblacion_edad'),
    'P_15YMAS_F': Indicator('sum', family='poblacion_edad'),
    'P_15YMAS_M': Indicator('sum', family='poblacion_edad'),
    'P_18YMAS_F': Indicator('sum', family='poblacion_edad'),
    'P_18YMAS_M': Indicator('sum', family='poblacion_edad'),
    'P_18A24_F': Indicator('sum', family='poblacion_edad'),
    'P_18A24_M': Indicator('sum', family='poblacion_edad'),
    'P_60YMAS_F': Indicator('sum', family='poblacion_edad'),
    'P_60YMAS_M': Indicator('sum', family='poblacion_edad'),
    'P3YM_HLI': Indicator('sum', family='lengua'),
    'P3YM_HLI_F': Indicator('sum', family='lengua'),
    'P3YM_HLI_M': Indicator('sum', family='lengua'),
    'PHOG_IND': Indicator('sum', family='indigena'),
    'POB_AFRO': Indicator('sum', family='afro'),
    'POB_AFRO_F': Indicator('sum', family='afro'),
    'POB_AFRO_M': Indicator('sum', family='afro'),
    'PCON_DISC': Indicator('sum', family='discapacidad'),
    'P18YM_PB': Indicator('sum', family='escolaridad'),
    'P18YM_PB_F': Indicator('sum', family='escolaridad'),
    'P18YM_PB_M': Indicator('sum', family='escolaridad'),
    'P15YM_AN_F': Indicator('sum', family='escolaridad'),
    'P15YM_AN_M': Indicator('sum', family='escolaridad'),
    'PRESOE15': Indicator('sum', family='educacion'),
    'PRESOE15_F': Indicator('sum', family='educacion'),
    'PRESOE15_M': Indicator('sum', family='educacion'),
    'PEA_F': Indicator('sum', family='actividad'),
    'PEA_M': Indicator('sum', family='actividad'),
    'POCUPADA_F': Indicator('sum', family='actividad'),
    'POCUPADA_M': Indicator('sum', family='actividad'),
    'PDESOCUP_F': Indicator('sum', family='actividad'),
    'PDESOCUP_M': Indicator('sum', family='actividad'),
    'PSINDER': Indicator('sum', family='salud'),
    'PDER_SS': Indicator('sum', family='salud'),
    'VIVPAR_HAB': Indicator('sum', unit='viviendas', family='vivienda'),
    'TVIVPARHAB': Indicator('sum', unit='viviendas', family='vivienda'),
    'P_3YMAS': Indicator('sum', family='poblacion_edad'),
    'VPH_INTER': Indicator('sum', unit='viviendas', family='vivienda'),
    'VPH_CEL': Indicator('sum', unit='viviendas', family='vivienda'),
    'VPH_S_ELEC': Indicator('sum', unit='viviendas', family='vivienda'),
    'VPH_AGUADV': Indicator('sum', unit='viviendas', family='vivienda'),
    'VPH_DRENAJ': Indicator('sum', unit='viviendas', family='vivienda'),
    'GRAPROES_F': Indicator('weighted_mean', weight='P_15YMAS_F', unit='anios', family='educacion'),
    'GRAPROES_M': Indicator('weighted_mean', weight='P_15YMAS_M', unit='anios', family='educacion'),
    'P3HLINHE': Indicator('sum', family='lengua'),
    'P3HLINHE_F': Indicator('sum', family='lengua'),
    'P3HLINHE_M': Indicator('sum', family='lengua'),
}


def available_expression(indicator: str, columns: set[str], alias: str = 'l') -> str:
    """SQL expression on a *group*; NULL if any input is suppressed/missing."""
    spec = INDICATOR_AGGREGATION[indicator]
    required = [indicator] if spec.method == 'sum' else ([spec.numerator,spec.denominator]
                if spec.method=='ratio' else [indicator,spec.weight])
    if any(name not in columns for name in required):
        return 'NULL::DOUBLE'
    def complete(field: str) -> str:
        return f'COUNT({alias}."{field}")=COUNT(*)'
    if spec.method == 'sum':
        return f'CASE WHEN {complete(indicator)} THEN SUM({alias}."{indicator}") ELSE NULL END'
    if spec.method == 'ratio':
        n,d = spec.numerator,spec.denominator
        return (f'CASE WHEN {complete(n)} AND {complete(d)} THEN '
                f'SUM({alias}."{n}")*1.0/NULLIF(SUM({alias}."{d}"),0) ELSE NULL END')
    weight = spec.weight
    return (f'CASE WHEN {complete(indicator)} AND {complete(weight)} '
            f'AND MIN({alias}."{weight}")>=0 THEN '
            f'SUM({alias}."{indicator}"*{alias}."{weight}")/'
            f'NULLIF(SUM({alias}."{weight}"),0) ELSE NULL END')
