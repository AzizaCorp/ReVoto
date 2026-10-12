"""Metadata-driven aggregations; missing/secret source cells always propagate NULL."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Indicator:
    method: str
    numerator: str | None = None
    denominator: str | None = None
    weight: str | None = None


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
