"""Validated L4 static publication for all 32 entities, atomically versioned.

No section, local district, precise age or personal data ever enter L4. This is
not an internal analytics export. For local experiments use dry_run=True.
"""
from __future__ import annotations
import csv
import hashlib
import json
import os
import shutil
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
import unicodedata
from pathlib import Path

from revoto_pipeline.config import Settings, connection, sql_path
from revoto_pipeline.export.contract import validate_payload
from revoto_pipeline.model.publicacion_l4 import (municipal_cvegeo, arquetipos_csv,
    votos_esperados_csv, check_analytic_key)
from revoto_pipeline.export.topologia import topologia_budget, vecinos_geometricos
from revoto_pipeline.model.identidad_municipal import require_identities

YEARS_PRESIDENCIALES = frozenset({2012, 2018, 2024})
AGE_SQL = ("CASE WHEN EDAD BETWEEN 18 AND 24 THEN '18-24' "
           "WHEN EDAD BETWEEN 25 AND 34 THEN '25-34' "
           "WHEN EDAD BETWEEN 35 AND 44 THEN '35-44' "
           "WHEN EDAD BETWEEN 45 AND 59 THEN '45-59' "
           "WHEN EDAD BETWEEN 60 AND 110 THEN '60+' ELSE NULL END")
FUENTE = 'INE · Conteos Censales de Participación Ciudadana'


def _src(cfg: Settings, grano: str, edo: int, year: int) -> Path:
    return cfg.path('processed') / 'marts' / grano / f'edo={edo:02}' / f'anio={year}' / 'datos.parquet'


def _canonical(cfg: Settings, edo: int, year: int) -> Path:
    return (cfg.path('processed') / 'canonical' / 'hecho_participacion' /
            f'edo={edo:02}' / f'anio={year}' / 'hechos.parquet')


def _rows(con, path: Path) -> list[dict]:
    if not path.is_file():
        raise FileNotFoundError(f'Falta dependencia para L4: {path}')
    result = con.execute(f"SELECT * FROM read_parquet('{sql_path(path)}')")
    cols = [x[0] for x in result.description]
    return [dict(zip(cols, row)) for row in result.fetchall()]


def _unique(rows: list[dict], keys: tuple[str, ...], label: str) -> None:
    seen = set()
    for row in rows:
        key = tuple(row.get(c) for c in keys)
        if any(value is None for value in key) or key in seen:
            raise ValueError(f'Llave NULL o duplicada en {label}: {key}')
        seen.add(key)


from revoto_pipeline.export.metricas import status as _status_l4, fraction as _fraction_l4, election as _election_l4

def _rate(row: dict, threshold: int) -> float | None:
    try:
        return _fraction_l4(row, threshold)
    except ValueError as exc:
        raise ValueError(f'Tasa fuera de rango o conteos inválidos: {exc}') from exc

def _period_status(row: dict | None, threshold: int) -> str:
    return _status_l4(row, threshold)

def _election(row: dict, year: int, threshold: int, ages: dict, sexes: dict) -> dict:
    return _election_l4(year, row, threshold, ages, sexes, include_unavailable=False)

def _aggregated_demographics(con, cfg: Settings, edo: int, year: int):
    """Generate municipality-level demographic metrics from canonical WITHOUT new Parquets.

    Exclude out-of-catalogue sex and invalid age only from their respective
    breakdowns, not from electoral totals (RN-06 and RN-09).
    """
    fact = _canonical(cfg, edo, year)
    if not fact.is_file():
        raise FileNotFoundError(fact)
    source = f"read_parquet('{sql_path(fact)}')"
    sql = f'''SELECT MPIOCVE, 'edad' AS grupo_tipo, {AGE_SQL} AS etiqueta,
              SUM(LN)::BIGINT AS LN, SUM(SV)::BIGINT AS SV,
              SUM(NS)::BIGINT AS NS
              FROM {source}
              WHERE EDAD BETWEEN 18 AND 110
              GROUP BY MPIOCVE, etiqueta
              UNION ALL
              SELECT MPIOCVE, 'sexo', CASE SEXO WHEN 0 THEN 'H' ELSE 'M' END,
              SUM(LN)::BIGINT, SUM(SV)::BIGINT, SUM(NS)::BIGINT
              FROM {source} WHERE SEXO IN (0,1)
              GROUP BY MPIOCVE, SEXO'''
    rows = con.execute(sql).fetchall()
    grouped = defaultdict(lambda: {'edad': {}, 'sexo': {}})
    for mun, group_type, label, ln, sv, ns in rows:
        if label is not None:
            if label in grouped[mun][group_type]:
                raise ValueError(f'Duplicación del grupo {mun}/{group_type}/{label}')
            grouped[mun][group_type][label] = {'LN': ln, 'SV': sv, 'NS': ns}
    return grouped


def _normalize_name(value: object) -> str:
    """Compare source labels without confusing accents/casing/whitespace with changes.

    The *display* name is always read from source; this function only validates
    naming consistency. Genuine territorial name changes need reviewed mapping.
    """
    text = ' '.join(str(value or '').strip().split())
    return ''.join(char for char in unicodedata.normalize('NFKD', text)
                   if not unicodedata.combining(char)).casefold()


_STATE_NAMES = {9: {'distrito federal': 'Ciudad de México',
                    'ciudad de mexico': 'Ciudad de México'}}


def _canonical_state_name(edo: int, historical_name: str) -> str:
    normalized = _normalize_name(historical_name)
    aliases = _STATE_NAMES.get(edo, {})
    return aliases.get(normalized, historical_name)


def _one_name(values, label: str) -> str:
    clean = sorted({' '.join(str(x).split()) for x in values if x and str(x).strip()})
    if not clean or len({_normalize_name(x) for x in clean}) != 1:
        raise ValueError(f'Nombre fuente ausente o inconsistente en {label}: {clean[:6]}')
    # Prefer the source's most complete accented form, without hardcoded lookup.
    return max(clean, key=lambda x: (sum(ord(c) > 127 for c in x), len(x), x))


def _state_names(con, cfg: Settings, edo: int, year: int):
    fact = _canonical(cfg, edo, year)
    if not fact.is_file():
        raise FileNotFoundError(fact)
    rows = con.execute(f'''SELECT DISTINCT EDOCVE, EDONOM, MPIOCVE, MPIONOM
        FROM read_parquet('{sql_path(fact)}')''').fetchall()
    if not rows:
        raise ValueError(f'Sin nombres de origen INE en {edo:02}/{year}')
    municipality_names = defaultdict(list)
    for ent, ent_name, mun, mun_name in rows:
        if ent != edo or mun is None or not isinstance(mun, int):
            raise ValueError(f'Hechos con código territorial incompatible {edo:02}/{year}')
        if not mun_name or not str(mun_name).strip():
            raise ValueError(f'Municipio {edo:02}-{mun:03} sin nombre fuente')
        municipality_names[int(mun)].append(mun_name)
    state_name = _one_name([r[1] for r in rows], f'entidad {edo:02}/{year}')
    return state_name, {mun: _one_name(labels, f'municipio {edo:02}-{mun:03}/{year}')
                        for mun, labels in municipality_names.items()}


def _write(stage: Path, relative: str, content, kind: str,
           *, extensions: bool = False) -> None:
    validate_payload(content, kind, allow_extensions=extensions)
    out = stage / relative
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(content, ensure_ascii=False, allow_nan=False,
                              separators=(',', ':')), encoding='utf-8')


def _named_geojson(payload: dict, edo: int, nivel: str, state_name: str,
                   mun_names: dict[int, str], cfg: Settings) -> dict:
    """Validate published topology and attach real INE names, never fabricated labels."""
    from shapely.geometry import shape
    if not isinstance(payload, dict) or payload.get('type') != 'FeatureCollection':
        raise ValueError(f'GeoJSON {edo:02}/{nivel} no es FeatureCollection')
    features = payload.get('features')
    if not isinstance(features, list) or not features:
        raise ValueError(f'GeoJSON {edo:02}/{nivel} carece de features')
    seen = set()
    enriched = []
    for feature in features:
        if not isinstance(feature, dict) or feature.get('type') != 'Feature':
            raise ValueError('GeoJSON con feature inválida')
        props = feature.get('properties')
        if not isinstance(props, dict):
            raise ValueError('GeoJSON sin properties')
        code = props.get('cvegeo')
        width = 2 if nivel == 'entidades' else 5
        if not isinstance(code, str) or len(code) != width or not code.isascii() or not code.isdigit():
            raise ValueError(f'Código territorial GeoJSON inválido: {code!r}')
        if code[:2] != f'{edo:02}' or code in seen:
            raise ValueError(f'Código duplicado o fuera del estado {edo:02}: {code!r}')
        seen.add(code)
        name = state_name if nivel == 'entidades' else mun_names.get(int(code[2:]))
        if not name:
            raise ValueError(f'No hay nombre INE validado para geometría {code}')
        geom = shape(feature.get('geometry'))
        if geom.is_empty or not geom.is_valid or geom.geom_type not in ('Polygon','MultiPolygon'):
            raise ValueError(f'Geometría GeoJSON inválida de {code}')
        if not all(-180 <= v <= 180 for v in (geom.bounds[0],geom.bounds[2])) or not all(
                -90 <= v <= 90 for v in (geom.bounds[1],geom.bounds[3])):
            raise ValueError(f'Coordenadas fuera de EPSG:4326: {code}')
        enriched.append({'type':'Feature','properties':{'cvegeo':code,'nombre':name},
                         'geometry':feature['geometry']})
    if nivel == 'entidades' and len(enriched) != 1:
        raise ValueError(f'Se esperaba 1 geometría estatal, se recibieron {len(enriched)}')
    return {'type':'FeatureCollection','features':enriched,
            'metadata':{'fuente_geometria':'INEGI · Marco Geoestadístico',
                        'fuente_nombres':'INE · Conteos Censales de Participación Ciudadana',
                        'nivel':'entidad' if nivel=='entidades' else 'municipio',
                        'entidad':f'{edo:02}',
                        'anio_marco_inegi':int(cfg.geo.get('inegi_marco_anio',0)) or None,
                        'uso':'ubicacion_cartografica; no equivale a limites historicos electorales'}}


def _geojson_within_budget(payload: dict, limit_bytes: int, initial_tolerance: float = 0.002) -> bytes:
    """Fit a FeatureCollection within the existing per-state geometry budget.

    Simplify shared boundaries together. Refuse to silently change keys, names,
    geometry counts or invalid polygons. Raw and staging geometries stay intact.
    """
    from shapely import coverage_simplify
    from shapely.geometry import mapping, shape

    features = payload.get('features', [])
    if not features:
        raise ValueError('GeoJSON L4 sin geometrías para optimizar')
    if not 0 <= initial_tolerance <= 0.05:
        raise ValueError('Tolerancia cartográfica fuera de intervalo permitido')

    def serialize(value):
        return json.dumps(value, ensure_ascii=False, allow_nan=False,
                          separators=(',', ':')).encode('utf-8')

    raw = serialize(payload)
    if len(raw) <= limit_bytes:
        return raw

    original = [shape(item['geometry']) for item in features]
    if any(g.is_empty or not g.is_valid or g.geom_type not in ('Polygon', 'MultiPolygon')
           for g in original):
        raise ValueError('GeoJSON de origen contiene geometrías inválidas')

    tolerances = sorted({initial_tolerance, .003, .005, .008, .012, .02, .035, .05})
    for tolerance in tolerances:
        if tolerance < initial_tolerance or tolerance == 0:
            continue
        shapes = list(coverage_simplify(original, tolerance=tolerance,
                                        simplify_boundary=True))
        if len(shapes) != len(original) or any(
            g.is_empty or not g.is_valid or g.geom_type not in ('Polygon', 'MultiPolygon')
            for g in shapes
        ):
            continue
        simplified = dict(payload)
        simplified['features'] = [
            {**feature, 'geometry': mapping(geometry)}
            for feature, geometry in zip(features, shapes)
        ]
        # La clave territorial y el nombre se copian sin alteración.
        content = serialize(simplified)
        if len(content) <= limit_bytes:
            return content
    raise ValueError(
        f'RNF-04 geometría: {len(raw)} bytes > {limit_bytes}; '
        'la simplificación conjunta permitida no alcanza el presupuesto. '
        'Revisar TopoJSON o el contrato del mapa, no aumentar el umbral a ciegas.'
    )


def _budget(stage: Path, cfg: Settings) -> None:
    path = cfg.root / 'budget.json'
    if not path.is_file():
        raise FileNotFoundError(f'Falta presupuesto RNF-04: {path}')
    budget = json.loads(path.read_text(encoding='utf-8'))
    for resource in stage.rglob('*'):
        if not resource.is_file() or resource.suffix not in ('.json', '.geojson'):
            continue
        parts = resource.relative_to(stage).parts
        if resource.suffix == '.geojson':
            limit = budget['entidad_kb']  # explicit per-state geometry limit
        else:
            limit = budget['entidad_kb'] if 'entidad' in parts else (
                budget['municipio_kb'] if 'municipio' in parts else None)
        if limit is not None and resource.stat().st_size > 1024 * limit:
            raise ValueError(f'RNF-04 excedido: {resource}: {resource.stat().st_size} bytes')


def _version(cfg: Settings, sources: list[Path]) -> str:
    root = cfg.root.resolve()

    def stable_path(path: Path) -> str:
        resolved = path.resolve()
        if resolved.is_relative_to(root):
            return resolved.relative_to(root).as_posix()
        parts = resolved.parts
        for anchor in ('revoto_pipeline', 'packages'):
            if anchor in parts:
                return Path(*parts[parts.index(anchor):]).as_posix()
        return f'external/{resolved.name}'

    digest = hashlib.sha256()
    keyed = sorted(((stable_path(path), path) for path in set(sources)),
                   key=lambda item: item[0])
    labels = [label for label, _ in keyed]
    if len(labels) != len(set(labels)):
        raise ValueError('Fuentes L4 con rutas lógicas duplicadas; no es seguro versionar')
    for label, path in keyed:
        digest.update(label.encode('utf-8'))
        with path.open('rb') as f:
            for data in iter(lambda: f.read(1024 * 1024), b''):
                digest.update(data)
    return datetime.now(timezone.utc).strftime('%Y%m%d') + '-' + digest.hexdigest()[:7]


def _read_official(cfg: Settings, con, states: tuple[int, ...]) -> float:
    """No official reference available => no publication.

    Required CSV contract: anio_eleccion,cve_entidad,participacion_pct.
    These rows must originate from a documented official INE reference. A
    national-only figure is NOT evidence for all entity/year pairs.
    """
    official_file = cfg.path('oficiales')
    if not official_file.is_file():
        raise FileNotFoundError(f'Sin cifras oficiales verificables: {official_file}')
    with official_file.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        needed = {'anio_eleccion', 'cve_entidad', 'participacion_pct'}
        if not needed.issubset(reader.fieldnames or []):
            raise ValueError(f'Esquema de cifras oficiales incompatible; se requieren: {sorted(needed)}')
        references = {}
        for row in reader:
            key = (int(row['cve_entidad']), int(row['anio_eleccion']))
            if key in references:
                raise ValueError(f'Cifra oficial duplicada: {key}')
            references[key] = float(row['participacion_pct'])
    tolerance = float(getattr(cfg, 'max_diferencia_pp', 1.0))
    if not 0 <= tolerance <= 1:
        raise ValueError('Tolerancia oficial fuera de [0,1] pp')
    maximum = 0.0
    for edo in states:
        for year in cfg.years:
            key = (edo, year)
            if key not in references:
                raise ValueError(f'Sin cifra oficial para entidad/elección: {key}')
            rows = _rows(con, _src(cfg, 'entidad', edo, year))
            if len(rows) != 1:
                raise ValueError(f'Mart entidad no único: {key}')
            actual = rows[0]
            if any(actual.get(k) is None for k in ('LN','SV','NS')) or actual['LN'] <= actual['NS']:
                raise ValueError(f'Invalid LN/NS en {key}')
            observed = 100 * actual['SV'] / (actual['LN'] - actual['NS'])
            diff = abs(observed - references[key])
            maximum = max(maximum, diff)
            if diff > tolerance + 1e-9:
                raise ValueError(f'Diferencia oficial {key}: {diff:.4f} pp > {tolerance:.4f} pp')
    return maximum


def _assert_approved(cfg: Settings, states: tuple[int, ...], dry_run: bool) -> None:
    if cfg.umbral_rn05 is None or cfg.umbral_rn05 < 1:
        raise ValueError('RN-05 sin umbral aprobado')
    if getattr(cfg.publication, 'permitir_contrato_v2', False):
        raise ValueError('Desactiva permitir_contrato_v2 antes de publicar L4')
    if cfg.publication.publicar_secciones or cfg.publication.publicar_distritos:
        raise ValueError('RN-02: L4 solo permite nacional, entidad y municipio')
    if not dry_run:
        if not getattr(cfg.publication, 'contrato_l4_aprobado', False):
            raise ValueError('Falta aprobación explícita del contrato L4')
        if not getattr(cfg.publication, 'umbral_rn05_aprobado', False):
            raise ValueError('Falta aprobación explícita de RN-05')
        if states != tuple(range(1,33)):
            raise ValueError('Publicación L4 exige los 32 estados; use dry_run para piloto')


def export_web(cfg: Settings, estados: int | list[int] | tuple[int, ...],
               integrado: bool = False, *, dry_run: bool = False) -> dict:
    """Produce one complete immutable version; never swap manifest on failed checks.

    All states must be exported together to produce a national dataset. For
    diagnostics, dry_run=True writes to a local temporary directory and never
    alters the public data tree or manifest.
    """
    states = tuple(sorted(set([estados] if isinstance(estados, int) else estados)))
    if not states or any(s not in range(1, 33) for s in states):
        raise ValueError('Estados inválidos')
    _assert_approved(cfg, states, dry_run)
    con = connection(cfg)
    inputs: list[Path] = []
    publish_root = cfg.path('salida')
    temp_root = cfg.root / 'data' / '.l4_publication_tmp'
    temp_root.mkdir(parents=True, exist_ok=True)
    # Never place unfinished build files inside apps/web/public/data.
    try:
        maximum = _read_official(cfg, con, states)
        # An INE-only L4 cannot claim to publish integrated INEGI/CONAPO data.
        if integrado and (cfg.integration.incluir_inegi or cfg.integration.incluir_conapo):
            raise ValueError('El L4 actual carece de DTO públicos de contexto integrado')
        state_series = defaultdict(list)
        municipality_series = defaultdict(list)
        municipality_status = defaultdict(dict)
        municipality_summary = defaultdict(dict)
        trace_rows = [] 
        names = {}
        mapping_path = cfg.path('mapping_municipal_historico')
        inputs.append(mapping_path)
        national_elections = {}
        for year in cfg.years:
            total = {'LN': 0, 'SV': 0, 'NS': 0}
            nat_age = defaultdict(lambda: {'LN': 0, 'SV': 0, 'NS': 0})
            nat_sex = defaultdict(lambda: {'LN': 0, 'SV': 0, 'NS': 0})
            for edo in states:
                path = _src(cfg, 'entidad', edo, year)
                inputs.append(path)
                erows = _rows(con, path)
                if len(erows) != 1 or erows[0]['AELEC'] != year or erows[0]['EDOCVE'] != edo:
                    raise ValueError(f'Entidad duplicada o incorrecta {edo}/{year}')
                erow = erows[0]
                for measure in total:
                    total[measure] += int(erow[measure])
                municipal_path = _src(cfg, 'municipio', edo, year)
                inputs.append(municipal_path)
                mrows = _rows(con, municipal_path)
                _unique(mrows, ('AELEC','EDOCVE','MPIOCVE'), 'municipios')
                for mr in mrows:
                    if mr['AELEC'] != year or mr['EDOCVE'] != edo:
                        raise ValueError('Municipio fuera de partición')
                canonical = _canonical(cfg, edo, year)
                inputs.append(canonical)
                historical_state_name, mnames = _state_names(con, cfg, edo, year)
                state_name = _canonical_state_name(edo, historical_state_name)
                if edo in names and _normalize_name(names[edo][0]) != _normalize_name(state_name):
                    raise ValueError(f'Nombre estatal incompatible entre años para {edo:02}; revisar equivalencia')
                origin = {(year,edo,m):n for m,n in mnames.items()}
                identity = require_identities(mapping_path, origin)
                public_names = {int(i.cvegeo[2:]):i.name for i in identity.values()}
                for i in identity.values():
                    trace_rows.append({
                        'cvegeo_canonico': i.cvegeo,
                        'nombre_canonico': i.name,
                        'anio_eleccion': i.year,
                        'cve_ent_ine': i.state,
                        'cve_mpio_ine': i.historic_code,
                        'nombre_ine_original': i.historic_name,
                        'tipo_equivalencia': i.equivalence,
                        'referencia': i.source,
                    })
                if len(public_names) != len(identity):
                    raise ValueError(f'Dos municipios INE colapsan a un CVEGEO en {edo}/{year}')
                previous = names.get(edo, (state_name, {}))[1]
                for m, n in public_names.items():
                    if m in previous and _normalize_name(previous[m]) != _normalize_name(n):
                        raise ValueError(f'Nombre canónico inconsistente para {edo:02}-{m:03}: '
                                         f'{previous[m]!r} / {n!r}; revisar mapping')
                names[edo] = (state_name, previous | public_names)
                breakdown = _aggregated_demographics(con, cfg, edo, year)
                for mun, groups in breakdown.items():
                    for kind, target in (('edad', nat_age), ('sexo', nat_sex)):
                        for label, metrics in groups[kind].items():
                            # The national aggregation will include all states once each.
                            for field in ('LN','SV','NS'):
                                target[label][field] += int(metrics[field])
                # State demographics are aggregated from the same vetted municipality groups,
                # not from legacy marts whose AGE_SQL admitted EDAD up to 120.
                sex_totals = defaultdict(lambda: {'LN': 0, 'SV': 0, 'NS': 0})
                age_totals = defaultdict(lambda: {'LN': 0, 'SV': 0, 'NS': 0})
                for groups in breakdown.values():
                    for group_type, target in (('sexo', sex_totals), ('edad', age_totals)):
                        for label, metrics in groups[group_type].items():
                            for field in ('LN', 'SV', 'NS'):
                                target[label][field] += int(metrics[field])
                sexes = dict(sex_totals)
                ages = dict(age_totals)
                state_series[edo].append(_election(erow, year, cfg.umbral_rn05, ages, sexes))
                for mr in mrows:
                    mun = int(mr['MPIOCVE'])
                    if mun not in mnames:
                        raise ValueError(f'Mart municipal sin nombre INE: {edo:02}-{mun:03}/{year}')
                    stable = int(identity[(year,edo,mun)].cvegeo[2:])
                    key = (edo, stable)
                    status = _period_status(mr, cfg.umbral_rn05)
                    municipality_status[key][year] = status
                    if status != 'available':
                        continue
                    m_break = breakdown.get(mun, {'edad': {}, 'sexo': {}})
                    municipality_series[key].append(_election(
                        mr, year, cfg.umbral_rn05, m_break['edad'], m_break['sexo']))
                    municipality_summary[key][year] = municipality_series[key][-1]['participacion']
            if states == tuple(range(1, 33)):
                national_elections[year] = _election(total, year, cfg.umbral_rn05, nat_age, nat_sex)
        if states != tuple(range(1, 33)) and not dry_run:
            raise ValueError('La serie nacional exige cobertura completa')
        # In a partial dry-run the national resource is deliberately not created.
        with tempfile.TemporaryDirectory(prefix='l4_', dir=temp_root) as tmp:
            staged = Path(tmp)
            sidecar = {}  # Estados por CVEGEO/año; no se publican LN ni SV suprimidos.
            for edo in states:
                state_name, mun_names = names[edo]
                municipal_overview = []
                for mun in sorted(mun_names):
                    key = (edo, mun)
                    periods = {str(y):municipality_status[key].get(y,'no_data') for y in cfg.years}
                    # Nunca suprimir toda la serie sólo por una elección con tasa indefinida.
                    populated = [v for v in periods.values() if v != 'no_data']
                    suppressed = bool(populated) and all(v == 'suppressed' for v in populated)
                    series = sorted(municipality_series.get(key, []), key=lambda e: e['anio'])
                    sidecar[f'{edo:02}{mun:03}'] = periods
                    municipio = {
                        'territorio': {'nivel':'municipio','cve':mun,
                                      'cveEntidad':edo,'nombre':mun_names[mun]},
                        'fuente':FUENTE,'suprimido':suppressed,'elecciones':series,
                    }
                    _write(staged, f'municipio/{edo}-{mun:03}.json', municipio, 'municipio')
                    municipal_overview.append({
                        'cve':mun,'nombre':mun_names[mun],
                        'suprimido':suppressed,
                        **({} if suppressed else {'participacion': {
                            str(k):v for k,v in sorted(municipality_summary.get(key, {}).items())}}),
                    })
                entity = {
                    'territorio':{'nivel':'entidad','cve':edo,'cveEntidad':edo,'nombre':state_name},
                    'fuente':FUENTE,
                    'elecciones':sorted(state_series[edo], key=lambda e:e['anio']),
                    'municipios':municipal_overview,
                }
                _write(staged, f'entidad/{edo}.json', entity, 'entidad')
            if states == tuple(range(1,33)):
                national = {'territorio':{'nivel':'nacional','nombre':'México'},
                            'fuente':FUENTE,
                            'elecciones':[national_elections[y] for y in sorted(cfg.years)]}
                _write(staged, 'nacional.json', national, 'nacional')
                catalog = [{'cve':s,'nombre':names[s][0]} for s in states]
                _write(staged, 'catalogos/entidades.json', catalog, 'catalogo_entidades')
            trace = staged/'validacion'/'trazabilidad_municipios.csv'
            trace.parent.mkdir(parents=True, exist_ok=True)
            with trace.open('w', encoding='utf-8-sig', newline='') as handle:
                writer = csv.DictWriter(handle, fieldnames=[
                    'cvegeo_canonico','nombre_canonico','anio_eleccion','cve_ent_ine',
                    'cve_mpio_ine','nombre_ine_original','tipo_equivalencia',
                    'referencia'])
                writer.writeheader()
                writer.writerows(sorted(trace_rows, key=lambda r:(r['cvegeo_canonico'],r['anio_eleccion'])))
            status_dest = staged/'catalogos'/'estatus-periodos-municipales.json'
            status_dest.parent.mkdir(parents=True, exist_ok=True)
            status_dest.write_text(json.dumps({
                'version_esquema': 1, 'por_cvegeo': sidecar,
                'estados': ['available','suppressed','rate_undefined','unavailable','no_data'],
            }, ensure_ascii=False, separators=(',',':')), encoding='utf-8')
            # Only publish GeoJSON geometries whose keys match the vetted INE
            # territories. Browser names come from the source-derived L4 index.
            if cfg.integration.incluir_geografia:
                for geo_state in states:
                    source_geo = cfg.path('geo_staging')/'geojson'/f'edo={geo_state:02}'
                    state_label, municipality_labels = names[geo_state]
                    for geo_name, geo_dest in (('entidades','entidad'),('municipios','municipios')):
                        source_file = source_geo/f'{geo_name}.geojson'
                        if not source_file.is_file():
                            continue  # The map is optional; never fabricate geometry.
                        geo_payload = json.loads(source_file.read_text(encoding='utf-8'))
                        enriched = _named_geojson(geo_payload, geo_state, geo_name,
                                                  state_label, municipality_labels, cfg)
                        relative = Path('geometria')/geo_dest/f'{geo_state:02}.geojson'
                        target = staged/relative
                        target.parent.mkdir(parents=True,exist_ok=True)
                        budget_cfg = json.loads((cfg.root/'budget.json').read_text(encoding='utf-8'))
                        limit_bytes = int(budget_cfg['entidad_kb']) * 1024
                        tolerance = float(cfg.geo.get('geojson_simplify_degrees', 0.002))
                        target.write_bytes(_geojson_within_budget(enriched, limit_bytes, tolerance))
                        inputs.append(source_file)  # Geography changes L4 version hash.
            _budget(staged, cfg)
            # Hash source contents and approved config/reference; no mutable aliases.
            cfg_file = cfg.root / 'apps' / 'pipeline' / 'config.toml'
            official_file = cfg.path('oficiales')
            if cfg_file.is_file(): inputs.append(cfg_file)
            inputs.append(official_file)
            # Changes to exporter or public schema also change immutable data version.
            inputs.append(Path(__file__).resolve())
            schema_dir = Path(__file__).resolve().parents[4] / 'packages' / 'contracts' / 'schemas'
            schemas = sorted(schema_dir.glob('*.schema.json'))
            if not schemas:
                raise FileNotFoundError(f'Sin esquemas L4: {schema_dir}')
            inputs.extend(schemas)
            version = _version(cfg, inputs)
            report = {
                'version_datos':version, 'estados':list(states), 'anios':list(cfg.years),
                'fuentes':[FUENTE], 'max_diferencia_pp':round(maximum, 7),
                'umbral_rn05':cfg.umbral_rn05,
                'estado_publicacion':'diagnostico' if dry_run else 'aprobado',
                'recursos':len(list(staged.rglob('*.json'))),
                'recursos_geojson':len(list(staged.rglob('*.geojson'))),
                'nombres': 'INE canonical + equivalencia municipal versionada verificada',
                'estados_periodos': 'catalogos/estatus-periodos-municipales.json',
                'lineage': 'validacion/trazabilidad_municipios.csv',
            }
            validation_file = staged / 'validacion' / 'reporte.json'
            validation_file.parent.mkdir(parents=True, exist_ok=True)
            validation_file.write_text(json.dumps(report, ensure_ascii=False, indent=2),encoding='utf-8')
            if dry_run:
                # Diagnostics remain outside the website public/ tree.
                diagnostic_root = cfg.root / 'data' / 'l4_diagnostics' / version
                if diagnostic_root.exists():
                    shutil.rmtree(diagnostic_root)
                diagnostic_root.parent.mkdir(parents=True, exist_ok=True)
                shutil.copytree(staged, diagnostic_root)
                report['directorio_diagnostico'] = str(diagnostic_root)
                return report
            generated = datetime.now(timezone.utc).isoformat()
            manifest = {
                'version_datos':version, 'generado':generated, 'fuente':FUENTE,
                'validacion':{'max_diferencia_pp':round(maximum,7),
                              'reporte':f'{version}/validacion/reporte.json'},
            }
            validate_payload(manifest, 'manifest')
            publish_root.mkdir(parents=True, exist_ok=True)
            destination = publish_root / version
            if destination.exists():
                # Refuse overwriting an immutable version with potentially different bytes.
                raise FileExistsError(f'Versión inmutable ya existe: {destination}')
            incoming = publish_root / f'.incoming-{version}'
            if incoming.exists():
                raise FileExistsError(f'Publicación temporal pendiente: {incoming}')
            try:
                shutil.copytree(staged, incoming)
                # Validate every copied file before a single directory rename.
                for file in staged.rglob('*'):
                    if file.is_file():
                        target = incoming / file.relative_to(staged)
                        if not target.is_file() or file.read_bytes() != target.read_bytes():
                            raise IOError(f'Promoción incompleta: {target}')
                os.replace(incoming, destination)
            finally:
                if incoming.exists():
                    shutil.rmtree(incoming)
            manifest_tmp = publish_root / '.manifest.pending.json'
            try:
                manifest_tmp.write_text(json.dumps(manifest, ensure_ascii=False,
                                                   separators=(',',':')),encoding='utf-8')
                os.replace(manifest_tmp, publish_root / 'manifest.json')
            finally:
                manifest_tmp.unlink(missing_ok=True)
            return report
    finally:
        con.close()
