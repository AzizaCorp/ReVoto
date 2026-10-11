"""Election-to-census and election-to-cartography mappings (no historical vote reallocation)."""
from __future__ import annotations
from dataclasses import dataclass
from revoto_pipeline.config import Settings


@dataclass(frozen=True)
class TemporalReference:
    anio_eleccion: int
    censo_ref: int
    anio_cartografia: int
    referencia_territorial_historica: bool
    equivalencia_secciones_historicas_verificada: bool = False

    @property
    def nota(self) -> str:
        if self.referencia_territorial_historica:
            return ('Cartografia de referencia retrospectiva; NO representa limites historicos '
                    'ni permite reasignar votos sin correspondencia temporal certificada.')
        return ('Cartografia de referencia definida para la eleccion (puede ser previa); '
                'el enlace a las secciones historicas requiere validacion de vigencia.')


def resolve_reference(cfg: Settings, anio_eleccion: int, censo: int | None = None,
                      cartografia: int | None = None) -> TemporalReference:
    """Never silently override the configured historical territorial reference."""
    if anio_eleccion not in cfg.years:
        raise ValueError(f'Eleccion no configurada: {anio_eleccion}')
    expected_census = cfg.reference[anio_eleccion]
    expected_carto = cfg.district_reference[anio_eleccion]
    if censo is not None and censo != expected_census:
        raise ValueError(f'Eleccion {anio_eleccion}: requiere censo {expected_census}, no {censo}')
    if cartografia is not None and cartografia != expected_carto:
        raise ValueError(f'Eleccion {anio_eleccion}: requiere cartografia {expected_carto}, no {cartografia}')
    return TemporalReference(anio_eleccion, expected_census, expected_carto,
                             referencia_territorial_historica=(anio_eleccion < expected_carto))
