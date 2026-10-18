"""Exportación NACIONAL EXPLORATORIA INE-prioritario. NO equivale al L4 aprobado.

Ejecutar desde ReVoto/apps/pipeline:
 python exportar_ine_exploratorio.py
 python exportar_ine_exploratorio.py --permitir-particiones-faltantes
No edita raw, canonical, mappings oficiales ni public/.
"""
import argparse
import csv
import json
import math
import re
from collections import defaultdict
import unicodedata
from pathlib import Path

YEARS=(2009,2012,2015,2018,2021,2024)
FIELDS=('LN','SV','NV','NS')

def save(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,allow_nan=False,separators=(',',':')),encoding='utf-8')

def election(year, vals, threshold):
    from revoto_pipeline.export.metricas import election as shared
    return shared(year, vals, threshold)

def standard_name(value):
    """Comparison only; never replaces historic source names."""
    txt = unicodedata.normalize('NFKD', str(value or '').upper())
    return ' '.join(''.join(c for c in txt if not unicodedata.combining(c)).split())


def filename_slug(value):
    """Derive a filesystem-safe, deterministic label from source data, not a fixed catalog."""
    text = unicodedata.normalize('NFKD', str(value).strip().lower())
    text = ''.join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    if not text:
        raise ValueError(f'Nombre de entidad inválido para archivo: {value!r}')
    return text


def ine_state_name(con, root, state, year):
    """Read the state's actual label from canonical INE, not a code dictionary."""
    src = (root / 'data/processed/canonical/hecho_participacion' /
           f'edo={state:02}' / f'anio={year}' / 'hechos.parquet')
    if not src.is_file():
        raise FileNotFoundError(f'Falta canonical INE para nombre de entidad: {src}')
    rows = con.execute(
        "SELECT DISTINCT TRIM(CAST(EDONOM AS VARCHAR)) FROM read_parquet(?) "
        "WHERE EDONOM IS NOT NULL AND TRIM(CAST(EDONOM AS VARCHAR)) <> ''",
        [str(src)]).fetchall()
    names = sorted({x[0] for x in rows})
    if not names or len({standard_name(x) for x in names}) != 1:
        raise ValueError(f'EDONOM inconsistente o vacío en {src}: {names[:8]}')
    return max(names, key=lambda n: (sum(ord(c) > 127 for c in n), len(n), n))


def stable_display_name(year_to_name):
    """Display latest INE label, retain original label on every period."""
    if not year_to_name:
        raise ValueError('No hay nombres originales INE')
    return year_to_name[max(year_to_name)]


def validate_identity_label(record, year, state, municipality):
    name = str(record.get('nombre_ine') or '').strip()
    if not name:
        raise ValueError(f'MPIONOM faltante en mapping: {(year,state,municipality)}')
    return name


import hashlib
import shutil
from datetime import datetime, timezone

SOURCE = 'INE · CCPC'
AGES = ('18-24', '25-34', '35-44', '45-59', '60+')
PRESIDENTIAL = {2012, 2018, 2024}


## !GRANDE: reutilizar la aritmética única L4 sin derivar tasas desde porcentajes.
from revoto_pipeline.export.metricas import status as _status, fraction as _fraction, election as _election_shared


def rate(values, threshold):
    return _status(values, threshold), _fraction(values, threshold)

def election_l4(year, vals, threshold, ages=None, sexes=None):
    return _election_shared(year, vals, threshold, ages, sexes)


def read_groups(con, root, grain, state, year, threshold):
    file = root / 'data/processed/marts' / grain / f'edo={state:02}' / f'anio={year}' / 'datos.parquet'
    if not file.is_file():
        raise FileNotFoundError(f'Falta mart demográfico requerido: {file}')
    keys = {'sexo': ('SEXO', False), 'grupo_edad': ('grupo_edad', False),
            'municipio_sexo': ('SEXO', True), 'municipio_edad': ('grupo_edad', True)}
    col, has_mun = keys[grain]
    fields = (('MPIOCVE,' if has_mun else '') + f'{col},LN,SV,NV,NS')
    rows = con.execute(f'SELECT {fields} FROM read_parquet(?)', [str(file)]).fetchall()
    groups = defaultdict(dict)
    for row in rows:
        if has_mun:
            municipal, category, *values = row
            origin = int(municipal)
        else:
            category, *values = row
            origin = None
        if col == 'SEXO':
            if int(category) not in (0, 1):
                continue
            label = 'H' if int(category) == 0 else 'M'
        else:
            label = str(category)
            if label not in AGES:
                continue
        if label in groups[origin]:
            raise ValueError(f'Categoría duplicada {grain}: {state}/{year}/{origin}/{label}')
        groups[origin][label] = values
    return groups



def unique_municipal_path(dirname, stem, uid, occupied):
    """Resolve filename collisions without merging or overwriting distinct INE series.

    Path is deterministic for the same operative identity and input ordering.
    A conflicting identity gets a short stable suffix derived from its full UID.
    """
    candidate = f'municipio/{dirname}/{stem}.json'
    if candidate not in occupied:
        return candidate
    if occupied[candidate] == uid:
        raise ValueError(f'Identidad operativa duplicada al exportar: {uid}')
    suffix = hashlib.sha256(uid.encode('utf-8')).hexdigest()[:12]
    candidate = f'municipio/{dirname}/{stem}__id-{suffix}.json'
    if candidate in occupied:
        raise ValueError(f'Colisión de nombre incluso con identificador: {candidate}')
    return candidate

ARCHETYPES = {'Siempre presente':'A1','En ascenso':'A2','Bajando el ritmo':'A3','De elección grande':'A4','Montaña rusa':'A5'}

def find_input(root, explicit, configured):
    if explicit is not None:
        path = Path(explicit).resolve()
        if not path.is_file():
            raise FileNotFoundError(path)
        return path
    path = root / configured
    return path if path.is_file() else None


def csv_entries(path):
    if path is None: return []
    with path.open(encoding='utf-8-sig', newline='') as stream:
        return list(csv.DictReader(stream))


def safe_number(row, field, low=None, high=None):
    raw = row.get(field, '')
    try: value = float(raw)
    except (TypeError, ValueError): raise ValueError(f'Número inválido {field}={raw!r}')
    if not math.isfinite(value) or (low is not None and value < low) or (high is not None and value > high):
        raise ValueError(f'Número fuera de rango {field}={raw!r}')
    return round(value, 3)


def load_archetypes(path, model_file):
    if path is None: return {}
    rows = csv_entries(path)
    name_to_id = dict(ARCHETYPES)
    if model_file.is_file():
        model = json.loads(model_file.read_text(encoding='utf-8'))
        # Catálogo del propio modelo: la posición de un centroide no identifica A1-A5.
        names = model.get('nombres', [])
        if len(names) == 5 and len(set(names)) == 5:
            # Sólo establecer IDs cuando el catálogo declara la equivalencia explícita.
            if isinstance(model.get('ids_por_nombre'), dict):
                name_to_id = dict(model['ids_por_nombre'])
    result = {}
    for r in rows:
        code = str(r.get('cvegeo', '')).strip()
        if len(code) != 5 or not code.isdigit():
            raise ValueError(f'Arquetipo sin CVEGEO municipal verificado: {code!r}')
        name = str(r.get('arquetipo','')).strip()
        ident = r.get('id') or name_to_id.get(name)
        if ident is None:
            raise ValueError(f'Arquetipo desconocido: {name!r}')
        if ident not in {'A1','A2','A3','A4','A5'}:
            raise ValueError(f'ID de arquetipo fuera del dominio {ident}')
        obj = {'nombre': name,
               'nivel':safe_number(r,'nivel'),
               'efecto_presidencial':safe_number(r,'efp'),
               'tendencia':safe_number(r,'tend'),
               'volatilidad':safe_number(r,'vol',0),
               'tipicidad':safe_number(r,'tipicidad',0,1),
               'rasgo':r.get('rasgo','')}
        if ident is not None: obj['id'] = ident
        if not name or obj['rasgo'] not in {'nivel','efp','tend','vol'}:
            raise ValueError(f'Arquetipo inválido para {code}')
        if code in result: raise ValueError(f'Arquetipo repetido para {code}')
        result[code] = obj
    return result


def load_expected(path):
    if path is None: return {}
    output = {}
    for r in csv_entries(path):
        state = int(r['edo'])
        if state in output: raise ValueError(f'Votos esperados duplicados para {state}')
        output[state] = {k:safe_number(r,k,0,3) for k in AGES if r.get(k,'') != ''}
        if len(output[state]) != len(AGES):
            raise ValueError(f'Esperados incompletos para entidad {state}')
    return output


def write_named_alias(staged, path, obj):
    save(staged/path, obj)


def main():
    parser = argparse.ArgumentParser(description='Exportador nacional exploratorio INE-prioritario')
    parser.add_argument('--root', type=Path, default=None)
    
    parser.add_argument('--log-file', type=Path, default=None,
                        help='Archivo de log independiente del staging temporal')
    parser.add_argument('--umbral', type=int, default=50)
    parser.add_argument('--permitir-particiones-faltantes', action='store_true')
    parser.add_argument('--arquetipos', type=Path, default=None, help='CSV arquetipos_municipales.csv')
    parser.add_argument('--esperados', type=Path, default=None, help='CSV esperado_por_entidad_edad.csv')
    parser.add_argument('--topo-quantization',type=int,default=100000)
    parser.add_argument('--topo-max-error-m',type=float,default=6500.0)
    parser.add_argument('--topo-budget-kb',type=int,default=300)
    parser.add_argument('--aceptar-candidatos',  action='store_true', help=(
        'Promueve candidatos CVEGEO inequívocos a identidad territorial '
        'aceptada para esta publicación exploratoria.'))
    args = parser.parse_args()
    import duckdb
    root = (args.root or Path(__file__).resolve().parents[4]).resolve()
    import time
    from datetime import datetime, timezone
    log_path = (args.log_file or (root/'data/logs'/'exportar_ine_exploratorio.log')).resolve()
    log_path.parent.mkdir(parents=True, exist_ok=True)
    run_started = time.monotonic()
    geo_started = None
    def log(stage, message, done=None, total=None):
        elapsed = time.monotonic() - run_started
        estimate = ''
        if done is not None and total and done > 0 and geo_started is not None:
            elapsed_geo = time.monotonic() - geo_started
            # ETA orientativa: los estados son heterogéneos (Oaxaca no cuesta igual que otros).
            remaining = elapsed_geo / done * (total - done)
            estimate = f' | {done}/{total} | ETA orientativa: {remaining/60:.1f} min'
        line = f'[{datetime.now().astimezone().isoformat(timespec="seconds")}] [{stage}] {message} | elapsed={elapsed/60:.1f} min{estimate}'
        print(line, flush=True)
        with log_path.open('a', encoding='utf-8') as handle:
            handle.write(line + '\n')
    log('INICIO', f'Exportador exploratorio; log={log_path}')
    mp = root / 'data/mappings/municipios_operativo_ine_primero.csv'
    if not mp.is_file():
        raise FileNotFoundError(f'Falta el mapping exploratorio: {mp}')
    archetypes_file = find_input(root, args.arquetipos, 'data/analisis_arquetipos/arquetipos_municipales.csv')
    expected_file = find_input(root, args.esperados, 'data/analisis_arquetipos/esperado_por_entidad_edad.csv')
    archetypes = load_archetypes(archetypes_file, root/'apps/pipeline/docs/arquetipos/modelo_arquetipos.json')
    expected = load_expected(expected_file)
    identities = {}
    with mp.open(encoding='utf-8-sig', newline='') as stream:
        for record in csv.DictReader(stream):
            key = tuple(int(record[c]) for c in ('anio_eleccion', 'cve_ent_ine', 'cve_mpio_ine'))
            if key in identities:
                raise ValueError(f'Mapping histórico duplicado: {key}')
            identities[key] = record
    if args.umbral < 1:
        raise ValueError('RN-05 requiere umbral positivo')
    output_base = root / 'data/l4_diagnostics/ine_primero_exploratorio_l4'
    staged = output_base.parent / (output_base.name + '.building')
    if staged.exists():
        shutil.rmtree(staged)
    staged.mkdir(parents=True)
    state_names = defaultdict(dict)
    state_elections = defaultdict(list)
    grouped = defaultdict(lambda: {'names': {}, 'origin_codes': {}, 'rows': {}, 'mapping': {}})
    total_national = defaultdict(lambda: [0, 0, 0, 0])
    national_age = defaultdict(lambda: defaultdict(lambda: [0, 0, 0, 0]))
    national_sex = defaultdict(lambda: defaultdict(lambda: [0, 0, 0, 0]))
    observed_states = defaultdict(set)
    states = {}; traces = []; missing = []
    filenames = {}
    path_collisions = []
    source_files = [mp, Path(__file__).resolve()] + [p for p in (archetypes_file,expected_file) if p]
    def sum_into(dst, values):
        for j, v in enumerate(values):
            dst[j] += int(v)
    try:
        log('INE', 'Procesando las 192 particiones municipales del INE')
        with duckdb.connect(':memory:') as con:
            for state in range(1, 33):
                for year in YEARS:
                    base = root/'data/processed/marts/municipio'/f'edo={state:02}'/f'anio={year}'/'datos.parquet'
                    if not base.is_file():
                        missing.append((state, year))
                        continue
                    source_files.append(base)
                    source_files.append(root/'data/processed/canonical/hecho_participacion'/f'edo={state:02}'/f'anio={year}'/'hechos.parquet')
                    for grain in ('municipio_edad', 'municipio_sexo', 'grupo_edad', 'sexo'):
                        source_files.append(root/'data/processed/marts'/grain/f'edo={state:02}'/f'anio={year}'/'datos.parquet')
                    label = ine_state_name(con, root, state, year)
                    state_names[state][year] = label
                    age_m = read_groups(con, root, 'municipio_edad', state, year, args.umbral)
                    sex_m = read_groups(con, root, 'municipio_sexo', state, year, args.umbral)
                    age_s = read_groups(con, root, 'grupo_edad', state, year, args.umbral)
                    sex_s = read_groups(con, root, 'sexo', state, year, args.umbral)
                    state_total = [0, 0, 0, 0]
                    rows = con.execute('SELECT AELEC,EDOCVE,MPIOCVE,LN,SV,NV,NS FROM read_parquet(?)', [str(base)]).fetchall()
                    seen_codes = set()
                    for actual_year, actual_state, mun, *counts in rows:
                        mun = int(mun)
                        if (int(actual_year), int(actual_state)) != (year, state) or mun in seen_codes:
                            raise ValueError(f'Mart municipal incorrecto o duplicado: {state}/{year}/{mun}')
                        seen_codes.add(mun)
                        identity = identities.get((year, state, mun))
                        if identity is None:
                            raise ValueError(f'Sin mapping electoral INE {(year, state, mun)}')
                        uid = identity['identificador_operativo']
                        name = validate_identity_label(identity, year, state, mun)
                        entry = grouped[(state, uid)]
                        if year in entry['rows']:
                            raise ValueError(f'Identidad operativa fusiona municipios de la misma elección: {state}/{uid}/{year}')
                        entry['names'][year] = name
                        entry['origin_codes'][year] = mun
                        entry['mapping'][year] = identity
                        entry['rows'][year] = election_l4(year, counts, args.umbral, age_m.get(mun, {}), sex_m.get(mun, {}))
                        sum_into(state_total, counts)
                        traces.append({'anio':year, 'estado':state, 'MPIOCVE_original':mun,
                            'MPIONOM_original':name, 'identificador_operativo':uid,
                            'cvegeo_candidato':identity.get('cvegeo_candidato', ''),
                            'confianza':identity.get('confianza', '')})
                    observed_states[year].add(state)
                    state_elections[state].append(election_l4(year, state_total, args.umbral,
                                                             age_s.get(None, {}), sex_s.get(None, {})))
                    sum_into(total_national[year], state_total)
                    for kind, data, dest in (('grupo_edad', age_s, national_age), ('sexo', sex_s, national_sex)):
                        for category, values in data.get(None, {}).items():
                            sum_into(dest[year][category], values)
            if missing and not args.permitir_particiones_faltantes:
                raise ValueError(f'Faltan {len(missing)} particiones: {missing[:8]}')
            if not state_names:
                raise ValueError('No hay marts disponibles')
            state_municipal = defaultdict(list)
            file_refs = []
            for (state, uid), data in sorted(grouped.items()):
                name = stable_display_name(data['names'])
                slug = filename_slug(name)
                origin = data['origin_codes'][max(data['origin_codes'])]
                mapping = data['mapping'][max(data['mapping'])]
                verified = all(r.get('equivalencia_verificada', '').strip().lower() == 'si'
                               for r in data['mapping'].values())
                resolution_states = {str(r.get('estado_resolucion', '')).strip() for r in data['mapping'].values()} - {''}
                if len(resolution_states) == 1:
                    resolution = next(iter(resolution_states))
                elif 'ambiguo' in resolution_states:
                    resolution = 'ambiguo'
                elif 'sin_resolver' in resolution_states:
                    resolution = 'sin_resolver'
                else:
                    resolution = 'candidato_inequivoco'
                proposed_codes = {str(r.get('cvegeo_candidato', '')).strip()
                                  for r in data['mapping'].values() if str(r.get('cvegeo_candidato', '')).strip()}
                if len(proposed_codes) > 1:
                    raise ValueError(f'Identidad operativa con candidatos CVEGEO inconsistentes: {state}/{uid}: {sorted(proposed_codes)}')
                candidate_cvegeo = next(iter(proposed_codes), None)
                if candidate_cvegeo and (len(candidate_cvegeo) != 5 or not candidate_cvegeo.isascii()
                        or not candidate_cvegeo.isdigit() or int(candidate_cvegeo[:2]) != state):
                    raise ValueError(f'CVEGEO candidato inválido: {state}/{uid}/{candidate_cvegeo}')
                candidate_accepted = (
                    args.aceptar_candidatos
                    and resolution == 'candidato_inequivoco'
                    and candidate_cvegeo is not None
                )
                publication_verified = verified or candidate_accepted
                cvegeo = candidate_cvegeo if publication_verified else None
                if cvegeo:
                    stem = f'{cvegeo}_{slug}'
                elif resolution == 'candidato_inequivoco' and candidate_cvegeo:
                    stem = f'candidato_{candidate_cvegeo}_{slug}'
                elif uid.startswith('candidato_'):
                    stem = f'{uid}_{slug}'
                else:
                    stem = f'ine_{state:02}_{origin:03}_{slug}'
                stem = re.sub(r'[^a-zA-Z0-9_-]+', '_', stem)
                dirname = filename_slug(stable_display_name(state_names[state]))
                original_path = f'municipio/{dirname}/{stem}.json'
                path = unique_municipal_path(dirname, stem, uid, filenames)
                if path != original_path:
                    path_collisions.append({'archivo_original': original_path,
                                            'archivo_final': path,
                                            'id_operativo': uid,
                                            'id_preexistente': filenames[original_path]})
                filenames[path] = uid
                elections = [data['rows'][y] for y in sorted(data['rows'])]
                statuses = [e.get('suprimido') for e in elections]
                territory = {'nivel':'municipio','cve':origin,'cveEntidad':state,'nombre':name,
                             'id_operativo':uid}
                if cvegeo is not None:
                    territory['cvegeo'] = cvegeo
                elif resolution == 'candidato_inequivoco' and candidate_cvegeo:
                    territory['cvegeo_candidato'] = candidate_cvegeo
                aliases = sorted({str(r.get('nombre_ine') or '').strip() for r in data['mapping'].values() if str(r.get('nombre_ine') or '').strip()})
                payload = {'territorio':territory, 'fuente':SOURCE,
                           'suprimido':all(statuses) if statuses else False,
                           'identidad_verificada': publication_verified,
                           'estado_resolucion':resolution,
                           'aliases_ine':aliases,
                           'elecciones':elections}
                if not publication_verified:
                    payload['advertencia'] = ('Identidad operativa exploratoria; la equivalencia territorial '
                                              'no está verificada documentalmente')
                archetype_code = cvegeo or (candidate_cvegeo if resolution == 'candidato_inequivoco' else None)
                if archetype_code and archetype_code in archetypes:
                    payload['arquetipo'] = archetypes[archetype_code]
                save(staged/path, payload)
                item = {'cve':origin,'nombre':name,'id_operativo':uid,
                        'suprimido':payload['suprimido'],
                        'participacion':{str(e['anio']):e['participacion'] for e in elections if 'participacion' in e},
                        'archivo':path, 'identidad_verificada':publication_verified,
                        'estado_resolucion':resolution}
                if cvegeo is not None: item['cvegeo'] = cvegeo
                elif resolution == 'candidato_inequivoco' and candidate_cvegeo:
                    item['cvegeo_candidato'] = candidate_cvegeo
                state_municipal[state].append(item)
                file_refs.append(path)
            by_numeric = defaultdict(list)
            for state, municipal_rows in state_municipal.items():
                for item in municipal_rows:
                    by_numeric[(state,item['cve'])].append(item)
            ambiguous_numeric = []
            for (state,mun), items in sorted(by_numeric.items()):
                if len(items) == 1:
                    item=items[0]
                    payload=json.loads((staged/item['archivo']).read_text(encoding='utf-8'))
                    alias=f'municipio/{state:02}-{mun:03}.json'
                    save(staged/alias,payload)
                else:
                    ambiguous_numeric.append({'estado':state,'municipio':mun,
                                              'ids':[i['id_operativo'] for i in items]})
            friendly_aliases = set()
            for state, years in sorted(state_names.items()):
                name = stable_display_name(years)

                slug = f'{state:02}_{filename_slug(name)}'
                clean_slug = filename_slug(name)
                if clean_slug in friendly_aliases:
                    raise ValueError(f'Colisión de alias estatal: {clean_slug}')
                friendly_aliases.add(clean_slug)
                path = f'entidad/{clean_slug}.json'
                states[state] = {
                    'territorio': {'nivel': 'entidad', 'cve': state,
                                'cveEntidad': state, 'nombre': name},
                    'fuente': SOURCE,
                    'elecciones': sorted(state_elections[state], key=lambda e: e['anio']),
                    'municipios': sorted(state_municipal[state],
                                        key=lambda e: (e['nombre'], e['id_operativo']))}

                if state in expected:
                    states[state]['votos_esperados_por_edad'] = expected[state]
                save(staged/path, states[state])
                file_refs.append(path)
                save(staged/f'catalogos/municipios/{clean_slug}.json',
                     states[state]['municipios'])
            save(staged/'catalogos/entidades.json',
                 [{'cve':state,'nombre':data['territorio']['nombre'],
                   'archivo':f"entidad/{filename_slug(data['territorio']['nombre'])}.json"}
                   for state,data in sorted(states.items())])
            save(staged/'catalogos/archivos-entidades.json',
                 [{'cveEntidad':state,'nombre':data['territorio']['nombre'],
                   'archivo':f"entidad/{filename_slug(data['territorio']['nombre'])}.json"}
                   for state,data in sorted(states.items())])
            years_exported = [y for y in YEARS if observed_states[y] == set(range(1,33))]
            if years_exported:
                save(staged/'nacional.json',{'territorio':{'nivel':'nacional','nombre':'Nacional'},
                     'fuente':SOURCE, 'elecciones':[election_l4(y, total_national[y], args.umbral,
                                   national_age[y], national_sex[y]) for y in years_exported]})
            save(staged/'validacion/claves_ine_ambiguas.json', ambiguous_numeric)
            collision_file = staged/'validacion/colisiones_nombres_archivo.csv'
            collision_file.parent.mkdir(parents=True, exist_ok=True)
            with collision_file.open('w', encoding='utf-8-sig', newline='') as stream:
                writer = csv.DictWriter(stream, fieldnames=['archivo_original',
                    'archivo_final', 'id_operativo', 'id_preexistente'])
                writer.writeheader()
                writer.writerows(path_collisions)
            tracepath = staged/'validacion/trazabilidad_ine.csv'
            tracepath.parent.mkdir(parents=True, exist_ok=True)
            with tracepath.open('w', encoding='utf-8-sig', newline='') as stream:
                writer = csv.DictWriter(stream, fieldnames=['anio','estado','MPIOCVE_original','MPIONOM_original',
                              'identificador_operativo','cvegeo_candidato','confianza'])
                writer.writeheader(); writer.writerows(traces)
            from revoto_pipeline.export.enriquecer import enriquecer_staged
            geo_started = time.monotonic()
            log('GEO', 'Inicio de enriquecimiento territorial: 32 entidades')
            enrichment = enriquecer_staged(staged, root, years=tuple(YEARS),
                        quantization=args.topo_quantization, max_error_m=args.topo_max_error_m,
                        geometry_budget_bytes=args.topo_budget_kb * 1024, progress=log)
            log('GEO', 'Enriquecimiento concluido')
            source_files.extend(enrichment['fuentes'])
            quality = {'modalidad':'exploratoria_ine_primero',
                'particiones_faltantes':missing, 'recursos_municipales':len(grouped),
                'colisiones_nombres_archivo_resueltas':len(path_collisions),
                'cobertura_nacional_anual':{str(y):len(observed_states[y]) for y in YEARS},
                **enrichment['calidad'],
                'advertencias':['No corresponde al contrato L4 aprobado',
                    'No se publican tasas con denominador cero ni datos suprimidos']}
            from jsonschema import Draft7Validator
            schema_path = Path(__file__).resolve().parents[4]/'packages/contracts/schemas/calidad.schema.json'
            schema = json.loads(schema_path.read_text(encoding='utf-8'))
            errors = list(Draft7Validator(schema).iter_errors(quality))
            if errors:
                raise ValueError(f'calidad.json inválido: {errors[0].message}')
            save(staged/'calidad.json',quality)
            from revoto_pipeline.export.versionado import fingerprint
            version = datetime.now(timezone.utc).strftime('%Y%m%d') + '-' + fingerprint(staged, root, source_files)
            topo_registry = {str(k):v['archivo'] for k,v in quality.get('topologia',{}).items()
                             if k != 'entidades' and isinstance(v,dict) and 'archivo' in v}
            geo_manifest = {'por_entidad':topo_registry}
            if isinstance(quality.get('topologia',{}).get('entidades'),dict):
                geo_manifest['entidades'] = quality['topologia']['entidades']['archivo']
            manifest = {'version_datos':version,
                 'estado_publicacion':'exploratorio_no_aprobado',
                 'generado':datetime.now(timezone.utc).isoformat(),
                 'fuente':SOURCE,'entidades':len(states),'anios':years_exported,
                 'umbral_rn05':args.umbral,'max_diferencia_pp':quality.get('oficial',{}).get('max_diferencia_pp'),
                 'reporte':'calidad.json',
                 'catalogo_entidades':'catalogos/entidades.json',
                 **({'nacional':'nacional.json'} if years_exported else {}),
                 'particiones_faltantes':missing,
                 'topologia':geo_manifest,
                 'limitaciones':sorted(quality.get('geometria',{}).get('errores',{}))}
            from revoto_pipeline.export.contract import validate_payload
            validate_payload(manifest,'manifest')
            save(staged/'manifest.json',manifest)
            output = output_base / version
            output.parent.mkdir(parents=True, exist_ok=True)
            if output.exists():
                raise FileExistsError(f'Versión inmutable ya existe: {output}')
            staged.rename(output)
            log('FIN', f'Publicación terminada: {output}')
            print(f'INE EXPLORATORIO: {len(states)} entidades, {len(grouped)} series municipales; '
                  f'versión {version}. Salida: {output}')
    except Exception as exc:
        log('ERROR', f'{type(exc).__name__}: {exc}')
        if staged.exists(): shutil.rmtree(staged)
        raise

if __name__ == '__main__':
    main()
