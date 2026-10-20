"""Enriquecimiento conservador del staging exploratorio INE-prioritario.

No reinterpreta identidades ni inventa valores. Se llama ANTES del hash/versionado
para conservar atomicidad y que los insumos geográficos afecten la versión.
"""
from __future__ import annotations

import csv
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

from revoto_pipeline.export.topologia import prepare_coverage, vecinos_operativos, topologia_budget
from revoto_pipeline.model.perfiles_estatales import perfil_estatal


def _read(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def _write(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, sort_keys=True,
                               separators=(',', ':'), allow_nan=False), encoding='utf-8')


def _reference_counts(root: Path, years: list[int]):
    """Cargas verificables desde marts originales, nunca de tasas L4 redondeadas."""
    try:
        import duckdb
    except ImportError as exc:
        raise RuntimeError('Los perfiles requieren DuckDB para leer marts reales') from exc
    state, nation, files = defaultdict(dict), defaultdict(lambda: [0, 0, 0, 0]), []
    with duckdb.connect(':memory:') as con:
        for year in years:
            for edo in range(1, 33):
                path = root/'data/processed/marts/entidad'/f'edo={edo:02}'/f'anio={year}'/'datos.parquet'
                if not path.is_file():
                    return None, None, [], f'Falta mart entidad: {path}'
                rows = con.execute('SELECT AELEC, EDOCVE, LN, SV, NV, NS FROM read_parquet(?)',
                                   [str(path)]).fetchall()
                if len(rows) != 1 or tuple(map(int, rows[0][:2])) != (year, edo):
                    raise ValueError(f'Fila mart entidad no única para {edo}/{year}')
                vals = tuple(int(v) for v in rows[0][2:])
                # Count validation incl. NV antes de derivar indicadores.
                from revoto_pipeline.export.metricas import counts
                counts(vals)
                state[edo][year] = vals
                for idx in range(4):
                    nation[year][idx] += vals[idx]
                files.append(path)
    return state, nation, files, None


def _official_quality(root: Path, state: dict, years: list[int], tolerance_pp: float):
    file = root/'apps/pipeline/revoto_pipeline/validacion/cifras_oficiales.csv'
    if not file.is_file():
        return {'estado': 'no_verificada', 'max_diferencia_pp': None,
                'motivo': 'No existe archivo de cifras oficiales revisadas'}, []
    with file.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        required = {'anio_eleccion', 'cve_entidad', 'participacion_pct'}
        if not required.issubset(reader.fieldnames or []):
            return {'estado': 'invalida', 'max_diferencia_pp': None,
                    'motivo': 'CSV oficial carece de columnas requeridas'}, [file]
        official = {}
        for row in reader:
            key = int(row['cve_entidad']), int(row['anio_eleccion'])
            if key in official:
                return {'estado': 'invalida', 'max_diferencia_pp': None,
                        'motivo': f'Fila oficial duplicada {key}'}, [file]
            value = float(row['participacion_pct'])
            if not math.isfinite(value) or not 0 <= value <= 100:
                return {'estado':'invalida','max_diferencia_pp':None,
                        'motivo':f'Tasa oficial fuera de rango {key}'},[file]
            official[key] = value
    diffs = []
    for edo in range(1, 33):
        for year in years:
            if (edo,year) not in official or edo not in state or year not in state[edo]:
                return {'estado': 'incompleta', 'max_diferencia_pp': None,
                        'motivo': f'Falta correspondencia oficial {edo}/{year}'}, [file]
            ln, sv, _nv, ns = state[edo][year]
            if ln == ns:
                return {'estado': 'invalida', 'max_diferencia_pp': None,
                        'motivo': f'Denominador nulo {edo}/{year}'}, [file]
            diffs.append(abs(100 * sv / (ln-ns) - official[edo,year]))
    maximum = max(diffs)
    return {'estado':'validada' if maximum <= tolerance_pp else 'fallida',
            'max_diferencia_pp':round(maximum, 7), 'umbral_pp':tolerance_pp,
            'pares_comparados':len(diffs)}, [file]


def _validate_documents(staged: Path, catalog: list[dict],
                        documents: dict[str, list[Path]]) -> dict:
    from jsonschema import Draft7Validator, RefResolver

    schemas_root = Path(__file__).resolve().parents[4]/'packages/contracts/schemas'
    schemas = {f.name: _read(f) for f in schemas_root.glob('*.schema.json')}
    required = ('comun', 'entidades', 'nacional', 'entidad', 'municipio')
    if not all(f'{name}.schema.json' in schemas for name in required):
        raise FileNotFoundError(f'Faltan JSON Schemas L4 bajo {schemas_root}')
    def validator(kind):
        schema = schemas[f'{kind}.schema.json']
        return Draft7Validator(schema, resolver=RefResolver(
            base_uri=schemas_root.as_uri()+'/', referrer=schema,
            store={k:v for k,v in schemas.items()}))

    validated = 0
    for kind, paths in documents.items():
        checking = validator(kind)
        for path in paths:
            if not path.is_file():
                raise FileNotFoundError(f'Falta documento L4: {path}')
            violations = list(checking.iter_errors(_read(path)))
            if violations:
                first = sorted(violations,key=lambda x:str(list(x.path)))[0]
                raise ValueError(f'L4 {kind} inválido {path}: {list(first.path)} {first.message}')
            validated += 1
    return {'estado': 'verificada', 'documentos_validados': validated,
            'referencias_json_rotas': 0, 'catalogos_validados': 1}

def _slug(value):
    import re
    import unicodedata

    text = unicodedata.normalize('NFKD', str(value).strip().lower())
    text = ''.join(
        c for c in text
        if not unicodedata.combining(c)
    )
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def enriquecer_staged(staged: Path, root: Path, *, years: tuple[int, ...],
                     quantization: int = 100000, max_error_m: float = 6500,
                     geometry_budget_bytes: int = 300_000, progress=None) -> dict:
    catalog = _read(staged/'catalogos/entidades.json')
    if len(catalog) != 32 or {x['cve'] for x in catalog} != set(range(1,33)):
        return {'calidad': {
            'cobertura': {'entidades': len(catalog), 'periodos': list(years),
                          'estado':'incompleta'},
            'electoral': {'estado':'cobertura_incompleta'},
            'oficial': {'estado':'no_verificada','max_diferencia_pp':None,
                        'motivo':'Menos de 32 entidades'},
            'topologia': {}, 'arquetipos':{},
            'geometria': {'estados_topojson':0, 'errores':{'nacional':'Cobertura incompleta'}},
            'integridad':{'estado':'no_ejecutada'},
            'equivalencias':{},
        }, 'fuentes': []}
    source_files: list[Path] = [Path(__file__).resolve(),
                                Path(__file__).resolve().parent/'topologia.py',
                                Path(__file__).resolve().parents[1]/'model/perfiles_estatales.py',
                                Path(__file__).resolve().parent/'metricas.py']
    source_files.extend(sorted((Path(__file__).resolve().parents[4]/'packages/contracts/schemas').glob('*.schema.json')))
    summary = {'geometria': {}, 'topologia': {}, 'arquetipos': {},
               'cobertura': {}, 'electoral': {}, 'oficial': {}, 'integridad': {}, 'equivalencias': {}}
    all_state_shapes = []
    valid_topologies = 0
    covered_neighbors = 0
    valid_municipal_count = 0
    total_municipal = 0
    archetypal = 0
    unresolved_geo = []
    errors = {}
    size_exceeded = []
    all_periods = set()
    suppressions = 0
    undefined_rates = 0
    verified_identity = 0
    identity_unknown = 0
    seen_operatives = set()
    json_missing = []
    documents = {'entidades': [staged/'catalogos/entidades.json'], 'entidad': [], 'municipio': []}
    if (staged/'nacional.json').exists():
        documents['nacional'] = [staged/'nacional.json']

    mapping_file = root/'data/mappings/municipios_operativo_ine_primero.csv'
    eq = {'verificadas':0, 'inferidas':0, 'sin_resolver':0}
    if mapping_file.is_file():
        seen_mapping = set()
        with mapping_file.open(encoding='utf-8-sig', newline='') as stream:
            for row in csv.DictReader(stream):
                key = tuple(row.get(k) for k in ('anio_eleccion','cve_ent_ine','cve_mpio_ine'))
                if key in seen_mapping:
                    raise ValueError(f'Mapping electoral duplicado {key}')
                seen_mapping.add(key)
                if row.get('equivalencia_verificada','').strip().lower() == 'si':
                    eq['verificadas'] += 1
                elif str(row.get('cvegeo_candidato','')).strip():
                    eq['inferidas'] += 1
                else:
                    eq['sin_resolver'] += 1
        source_files.append(mapping_file)
    summary['equivalencias'] = eq

    for state_index, state_item in enumerate(catalog, 1):
        edo = int(state_item['cve'])
        if progress is not None:
            progress("GEO_ESTADO", f"{state_index}/32 entidad {edo:02}: iniciando", state_index-1, 32)
        import time
        state_started = time.monotonic()
        entity_path = staged/state_item['archivo']
        if not entity_path.is_file():
            raise FileNotFoundError(f'Entidad no encontrada: {entity_path}')
        entity = _read(entity_path)
        documents['entidad'].append(entity_path)
        by_geo = {}
        municipal_docs = {}
        for item in entity['municipios']:
            total_municipal += 1
            uid = item['id_operativo']
            if (edo, uid) in seen_operatives:
                raise ValueError(f'Identidad repetida: {edo}/{uid}')
            seen_operatives.add((edo,uid))
            path = staged/item['archivo']
            if not path.is_file():
                json_missing.append(str(path.relative_to(staged)))
                continue
            doc = _read(path)
            documents['municipio'].append(path)
            municipal_docs[uid] = (path, doc)
            code = doc['territorio'].get('cvegeo')
            candidate_code = doc['territorio'].get('cvegeo_candidato')
            resolution = doc.get('estado_resolucion')
            geometry_code = code
            if geometry_code is None and resolution == 'candidato_inequivoco':

                geometry_code = candidate_code
            if geometry_code:
                if geometry_code in by_geo:
                    raise ValueError(f'CVEGEO/candidato compartido por identidades distintas: {geometry_code}')
                by_geo[geometry_code] = uid
                if doc.get('identidad_verificada') and code:
                    verified_identity += 1
                else:
                    identity_unknown += 1
            else:
                identity_unknown += 1
            archetypal += int('arquetipo' in doc)
            for el in doc['elecciones']:
                all_periods.add(el['anio'])
                suppressions += int(el.get('estado_tasa') == 'suppressed')
                undefined_rates += int(el.get('estado_tasa') == 'rate_undefined')
                p = el.get('participacion')
                if p is not None and not (isinstance(p, (int,float)) and 0 <= p <= 1):
                    raise ValueError(f'Tasa JSON municipal inválida: {path}')
        valid_municipal_count += len(by_geo)
        geo_base = root/'data/staging/geo/geojson'/f'edo={edo:02}'
        if not geo_base.is_dir():
            geo_base = root/'apps/web/public/data/geometria'/f'edo={edo:02}'
        mun_source = geo_base/'municipios.geojson'
        ent_source = geo_base/'entidades.geojson'
        if ent_source.is_file():
            state_shapes = _read(ent_source).get('features', [])
            if len(state_shapes) != 1 or state_shapes[0]['properties'].get('cvegeo') != f'{edo:02}':
                errors[f'entidad-{edo:02}'] = 'Geometría estatal no única o de clave incorrecta'
            else:
                feature = state_shapes[0].copy()
                feature['properties'] = {'cvegeo':f'{edo:02}', 'nombre':entity['territorio']['nombre']}
                all_state_shapes.append(feature)
                source_files.append(ent_source)
        else:
            errors[f'entidad-{edo:02}'] = 'Geometría estatal ausente'
        if not mun_source.is_file():
            errors[f'municipio-{edo:02}'] = 'Geometría municipal ausente'
            unresolved_geo.extend(sorted(by_geo))
            continue
        source_files.append(mun_source)
        try:
            feats = _read(mun_source).get('features', [])
            codes = {f['properties']['cvegeo'] for f in feats}
            if not set(by_geo).issubset(codes):
                missing = sorted(set(by_geo)-codes)
                unresolved_geo.extend(missing)
                errors[f'municipio-{edo:02}'] = f'Faltan geometrías verificadas: {missing[:8]}'
                continue
            if progress is not None:
                progress("GEO_FASE", f"{edo:02}: vecinos ({len(feats)} geometrías)")
            prepared_at = time.monotonic()
            prepared_geo = prepare_coverage(feats)
            if progress is not None:
                progress("GEO_FASE", f"{edo:02}: cobertura preparada en {time.monotonic()-prepared_at:.1f}s; "
                         f"{len(prepared_geo.codes)} polígonos")
            neighbors_at = time.monotonic()
            neighbor_map = vecinos_operativos(feats, by_geo, prepared=prepared_geo)
            if progress is not None:
                progress("GEO_FASE", f"{edo:02}: vecindad validada en {time.monotonic()-neighbors_at:.1f}s")
            for uid, (path, doc) in municipal_docs.items():
                if uid in neighbor_map:
                    doc['vecinos'] = neighbor_map[uid]
                    _write(path, doc)
                    source_mun = doc['territorio']['cve']
                    alias_path = staged/'municipio'/f'{edo:02}-{source_mun:03}.json'
                    if alias_path.is_file():
                        alias_doc = _read(alias_path)
                        if alias_doc['territorio'].get('id_operativo') != uid:
                            raise ValueError(f'Alias municipal apunta a otra identidad: {alias_path}')
                        _write(alias_path, doc)
                    covered_neighbors += 1
            if progress is not None:
                progress("GEO_FASE", f"{edo:02}: TopoJSON municipal; presupuesto {geometry_budget_bytes:,} bytes")
            quality = {}
            blob = topologia_budget(feats, 'municipios', geometry_budget_bytes,
                                    quantization=quantization, max_error_m=max_error_m,
                                    progress=(lambda msg: progress("GEO_INTENTO", f"{edo:02}: {msg}")) if progress else None,
                                    prepared=prepared_geo, report_out=quality)
            entity_slug = _slug(entity['territorio']['nombre'])

            target = staged/'geo'/f'{entity_slug}.topo.json'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(blob)

            valid_topologies += 1

            summary['topologia'][f'{edo:02}'] = {
                **quality,
                'bytes': len(blob),
                'archivo': f'geo/{entity_slug}.topo.json'
            }
        except (ValueError, KeyError, TypeError) as exc:
            if progress is not None:
                progress("GEO_ERROR", f"{edo:02}: {str(exc)[:250]}")
            errors[f'municipio-{edo:02}'] = str(exc)
            if 'bytes' in str(exc):
                size_exceeded.append(edo)

        if progress is not None:
            progress("GEO_ESTADO", f"{state_index}/32 entidad {edo:02}: terminado en {time.monotonic()-state_started:.1f} s", state_index, 32)

    if len(all_state_shapes) == 32:
        try:
            if progress is not None:
                progress("GEO_FASE", "TopoJSON nacional de entidades")
            blob = topologia_budget(all_state_shapes, 'entidades', geometry_budget_bytes,
                                    quantization=quantization, max_error_m=max_error_m,
                                    progress=(lambda msg: progress("GEO_INTENTO", msg)) if progress else None)
            (staged/'geo'/'entidades.topo.json').write_bytes(blob)
            summary['topologia']['entidades'] = {'archivo':'geo/entidades.topo.json',
                                                  'bytes':len(blob)}
        except ValueError as exc:
            errors['entidades'] = str(exc)

    if json_missing:
        raise FileNotFoundError(f'Contratos municipales con referencias rotas: {json_missing[:8]}')
    summary['integridad'] = {'estado':'pendiente_validacion',
                             'identidades_operativas_unicas': len(seen_operatives)}
    if progress is not None:
        progress("CALIDAD", "Conciliando conteos de las 32 entidades y calculando perfiles")
    states, national, mats, blocker = _reference_counts(root,list(years))
    if blocker:
        summary['electoral']['perfil_estatal'] = {'estado':'no_calculado','motivo':blocker}
        summary['oficial'] = {'estado':'no_verificada','max_diferencia_pp':None,
                             'motivo':'Sin marts estatales completos'}
    else:
        source_files.extend(mats)
        profiles = 0
        for state_item in catalog:
            epath = staged/state_item['archivo']
            data = _read(epath)
            for election in data['elecciones']:
                year = election['anio']
                ln, sv, nv, ns = states[state_item['cve']][year]
                from revoto_pipeline.export.metricas import fraction
                if election.get('lista_nominal') != ln or election.get('participacion') != fraction((ln,sv,nv,ns),1):
                    raise ValueError(f'Discrepancia entre L4 y mart entidad: {state_item["cve"]}/{year}')
            profile = perfil_estatal(states[state_item['cve']], national)
            if profile:
                data['perfil_estatal'] = profile
                _write(epath,data)
                alias = staged/'entidad'/f"{state_item['cve']:02}.json"
                if alias.is_file():
                    _write(alias,data)
                profiles += 1
        summary['electoral']['perfil_estatal']={'estado':'calculado', 'entidades':profiles,
                                                'metodo':'indicadores descriptivos sin cluster'}
        official, off_files = _official_quality(root,states,list(years),1.0)
        summary['oficial'] = official
        source_files.extend(off_files)
    summary['cobertura'] = {'entidades':len(catalog), 'municipios':total_municipal,
                            'identidades_verificadas':verified_identity,
                            'identidades_pendientes':identity_unknown,
                            'cobertura_arquetipos':archetypal,
                            'cobertura_vecindad':covered_neighbors,
                            'geometrias_sin_correspondencia':len(unresolved_geo),
                            'periodos':sorted(all_periods),
                            'elecciones_suprimidas_rn05':suppressions,
                            'tasas_indefinidas':undefined_rates}
    summary['geometria'] = {'estados_topojson': valid_topologies,
                             'fuera_presupuesto':size_exceeded,
                             'errores':errors,
                             'sin_correspondencia_cvegeo':sorted(set(unresolved_geo))}
    if progress is not None:
        progress("CALIDAD", "Validando JSON Schemas de todos los documentos")
    summary['integridad'].update(_validate_documents(staged, catalog, documents))
    return {'calidad':summary, 'fuentes':list(dict.fromkeys(source_files))}
