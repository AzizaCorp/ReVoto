"""Typed TOML settings. Paths are always resolved against the monorepo root."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import tomllib

ROOT = Path(__file__).resolve().parents[3]
CONFIG_FILE = Path(__file__).resolve().parents[1] / 'config.toml'


@dataclass(frozen=True)
class Integration:
    incluir_inegi: bool = True
    incluir_conapo: bool = True
    incluir_geografia: bool = True
    permitir_localidades_por_punto: bool = False
    cobertura_minima_inegi: float = 0.80

    def __post_init__(self):
        if not 0 <= self.cobertura_minima_inegi <= 1:
            raise ValueError('cobertura_minima_inegi debe pertenecer a [0,1]')


@dataclass(frozen=True)
class Publication:
    permitir_contrato_v2: bool = False
    publicar_secciones: bool = False
    publicar_distritos: bool = False
    publicar_desgloses_territoriales: bool = False


@dataclass(frozen=True)
class Settings:
    root: Path
    paths: dict[str, Path]
    years: tuple[int, ...]
    reference: dict[int, int]
    district_reference: dict[int, int]
    encoding: str
    threads: int
    memory_limit: str
    geo: dict[str, str]
    integration: Integration = Integration()
    publication: Publication = Publication()
    incluir_del: bool = True
    del_distrito_verificado: bool = False
    umbral_rn05: int | None = None

    def path(self, name: str) -> Path:
        return self.paths[name]


def load_config(file: Path = CONFIG_FILE, root: Path = ROOT) -> Settings:
    with Path(file).open('rb') as handle:
        cfg = tomllib.load(handle)
    ing = cfg['ingestion']
    years = tuple(int(x) for x in ing['years_ine'])
    census = {int(k): int(v) for k, v in cfg['referencia_censal'].items()}
    districts = {int(k): int(v) for k, v in cfg['referencia_distritacion_local'].items()}
    if set(years) != set(census) or set(years) != set(districts):
        raise ValueError('Faltan referencias censales/cartográficas de alguna elección')
    paths = {k: (Path(root) / str(value)).resolve() for k, value in cfg['rutas'].items()}
    i = cfg.get('integracion', {})
    for key in ('incluir_inegi','incluir_conapo','incluir_geografia','permitir_localidades_por_punto'):
        if key in i and type(i[key]) is not bool:
            raise ValueError(f'integracion.{key} debe ser boolean')
    if type(cfg.get('ine',{}).get('del_distrito_verificado',False)) is not bool:
        raise ValueError('ine.del_distrito_verificado debe ser boolean')
    if type(cfg.get('ine',{}).get('incluir_del',True)) is not bool:
        raise ValueError('ine.incluir_del debe ser boolean')
    integration = Integration(**{name:i[name] for name in Integration.__dataclass_fields__ if name in i})
    publication_values = cfg.get('publicacion', {})
    for key in Publication.__dataclass_fields__:
        if key in publication_values and type(publication_values[key]) is not bool:
            raise ValueError(f'publicacion.{key} debe ser boolean')
    publication = Publication(**publication_values)
    value = cfg.get('reglas', {}).get('umbral_rn05', 'POR_DEFINIR')
    threshold = None if value == 'POR_DEFINIR' else int(value)
    if threshold is not None and threshold < 1:
        raise ValueError('umbral_rn05 debe ser positivo')
    return Settings(root=Path(root).resolve(), paths=paths, years=years,
        reference=census, district_reference=districts,
        encoding=ing['csv_encoding'], threads=int(ing['threads']),
        memory_limit=str(ing['memory_limit']), geo=cfg['geografia'],
        integration=integration, publication=publication, incluir_del=cfg.get('ine',{}).get('incluir_del',True),
        del_distrito_verificado=cfg.get('ine',{}).get('del_distrito_verificado',False),
        umbral_rn05=threshold)


def sql_path(path: Path) -> str:
    return Path(path).as_posix().replace("'", "''")


def connection(cfg: Settings):
    import duckdb
    con = duckdb.connect(':memory:')
    con.execute(f'SET threads = {int(cfg.threads)}')
    con.execute(f"SET memory_limit = '{cfg.memory_limit}'")
    tmp = cfg.root / 'data' / '.duckdb_tmp'
    tmp.mkdir(parents=True, exist_ok=True)
    con.execute(f"SET temp_directory = '{sql_path(tmp)}'")
    return con
