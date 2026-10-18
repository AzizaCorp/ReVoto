"""Polars LazyFrame reports for smaller staged census data, not 54M INE rows."""
from pathlib import Path
import polars as pl


def inegi_suppression_counts(path: Path, indicators: list[str]) -> dict[str,int]:
    """Count published special-code flags in selected census variables."""
    lf = pl.scan_parquet(path)
    cols = [f'{name}__suppressed' for name in indicators]
    values = lf.select(pl.col(col).sum().alias(col.removesuffix('__suppressed')) for col in cols)
    return {k:int(v or 0) for k,v in values.collect().to_dicts()[0].items()}
