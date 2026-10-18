"""Time-vintage contracts: never turn reference cartography into historical fact."""
from __future__ import annotations
from dataclasses import dataclass
from revoto_pipeline.config import Settings


@dataclass(frozen=True)
class TemporalReference:
    anio_eleccion: int
    censo_ref: int
    anio_cartografia: int
    referencia_territorial_historica: bool
    equivalencia_secciones_historicas_verificada: bool=False

    @property
    def nota(self) -> str:
        if self.referencia_territorial_historica:
            return ('Cartografía de referencia retrospectiva; NO representa límites históricos '
                    'ni permite reasignar votos sin crosswalk temporal certificado.')
        return ('Cartografía de referencia; la correspondencia histórica de secciones '
                'debe certificarse por separado.')


def resolve_reference(cfg: Settings,anio_eleccion: int,censo: int | None=None,
                      cartografia: int | None=None) -> TemporalReference:
    if anio_eleccion not in cfg.years:
        raise ValueError(f'Eleccion no configurada: {anio_eleccion}')
    expected_census=cfg.reference[anio_eleccion]
    expected_carto=cfg.district_reference[anio_eleccion]
    if censo is not None and censo!=expected_census:
        raise ValueError(f'Eleccion {anio_eleccion}: requiere censo {expected_census}, no {censo}')
    if cartografia is not None and cartografia!=expected_carto:
        raise ValueError(f'Eleccion {anio_eleccion}: requiere cartografia {expected_carto}, no {cartografia}')
    return TemporalReference(anio_eleccion,expected_census,expected_carto,
                             anio_eleccion<expected_carto)


@dataclass(frozen=True)
class InegiGeometryReference:
    censo_ref: int
    marco_inegi_anio: int | None
    poligono_compatible: bool
    razon: str


def inegi_geometry_reference(cfg: Settings, anio_eleccion: int) -> InegiGeometryReference:
    """Fail closed: difference in census and INEGI SHP vintage forbids strong polygon allocation.

    This is not the same as reference DERFE. Matching census vintage is a
    necessary screening condition, never proof of territorial equivalence.
    """
    ref = resolve_reference(cfg, anio_eleccion)
    marco = int(cfg.geo.get('inegi_marco_anio', 0)) or None
    compatible = marco == ref.censo_ref
    return InegiGeometryReference(ref.censo_ref, marco, compatible,
        'mismo_anio_requiere_validacion_cartografica' if compatible else
        'marco_inegi_distinto_del_censo')
