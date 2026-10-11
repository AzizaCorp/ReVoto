"""Load settings relative to monorepo root, regardless of current directory."""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import tomllib

ROOT = Path(__file__).resolve().parents[3]
CONFIG_FILE = Path(__file__).resolve().parents[1] / 'config.toml'

@dataclass(frozen = True)
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

    def path(self, name: str) -> Path:
        return self.paths[name]


def load_config(file: Path = CONFIG_FILE, root: Path = ROOT) -> Settings:
    """Leer TOML; checar cada ruta bajo la raíz del proyecto."""
    with file.open('rb') as handle:
        cfg = tomllib.load(handle)
    ing = cfg['ingestion']
    years = tuple(int(x) for x in ing['years_ine'])
    census = {int(k): int(v) for k, v in cfg['referencia_censal'].items()}
    districts = {int(k): int(v) for k, v in cfg['referencia_distritacion_local'].items()}
    if set(years) != set(census) or set(years) != set(districts):
        raise ValueError('Toda eleccion debe aparecer en referencia_censal y referencia_distritacion_local')
    paths = {key: (root / str(value)).resolve() for key, value in cfg['rutas'].items()}
    return Settings(root = root, paths = paths, years = years, reference = census,
                    district_reference = districts, encoding = ing['csv_encoding'],
                    threads = int(ing['threads']), memory_limit = ing['memory_limit'], geo = cfg['geografia'])


def connection(cfg: Settings):
    """Conexión DuckDB en memoria; los datos grandes permanecen en el disco."""
    import duckdb
    conn = duckdb.connect(database=':memory:')
    conn.execute(f"SET threads = {int(cfg.threads)}")
    conn.execute(f"SET memory_limit = '{cfg.memory_limit}'")
    (cfg.root / 'data' / '.duckdb_tmp').mkdir(parents=True, exist_ok=True)
    conn.execute(f"SET temp_directory = '{sql_path(cfg.root / 'data' / '.duckdb_tmp')}'")
    return conn


def sql_path(path: Path) -> str:
    """Escapar de forma segurauna ruta de SQL local."""
    return path.as_posix().replace("'", "''")
