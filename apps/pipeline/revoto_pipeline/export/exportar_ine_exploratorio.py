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
    ln,sv,nv,ns=map(int,vals)
    if ln < threshold:
        return {'anio':year,'publication_status':'suppressed','participacion_pct':None}
    if ln <= ns:
        return {'anio':year,'publication_status':'rate_undefined','LN':ln,'SV':sv,'NV':nv,'NS':ns,'participacion_pct':None}
    return {'anio':year,'publication_status':'available','LN':ln,'SV':sv,'NV':nv,'NS':ns,'participacion_pct':round(100*sv/(ln-ns),7)}

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


# !GRANDE: contrato electoral L4 exploratorio. No modifica el L4 estricto.
import hashlib
import shutil
from datetime import datetime, timezone

SOURCE = 'INE · Conteos Censales de Participación Ciudadana'
AGES = ('18-24', '25-34', '35-44', '45-59', '60+')
PRESIDENTIAL = {2012, 2018, 2024}


def rate(values, threshold):
    ln, sv, nv, ns = (int(x) for x in values)
    if any(x < 0 for x in (ln, sv, nv, ns)) or ns > ln or sv > ln - ns:
        raise ValueError(f'Conteos electorales incompatibles: {values}')
    if ln < threshold:
        return 'suppressed', None
    if ln == ns:
        return 'rate_undefined', None
    return 'available', round(sv / (ln - ns), 3)


def election_l4(year, vals, threshold, ages=None, sexes=None):
    status, fraction = rate(vals, threshold)
    result = {'anio': year, 'tipo': 'presidencial' if year in PRESIDENTIAL else 'intermedia'}
    if status == 'suppressed':
        result['suprimido'] = True
        return result
    result['suprimido'] = False
    result['lista_nominal'] = int(vals[0])
    if status != 'available':
        result['estado_tasa'] = status
        return result
    result['participacion'] = fraction
    if ages is not None:
        result['por_edad'] = {k: r for k in AGES if k in ages
                              if (r := rate(ages[k], threshold)[1]) is not None}
    if sexes is not None:
        result['por_sexo'] = {k: r for k in ('H', 'M') if k in sexes
                              if (r := rate(sexes[k], threshold)[1]) is not None}
    return result


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

# !GRANDE: enriquecimiento opcional desde salidas verificadas del pipeline.
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
    parser.add_argument('--umbral', type=int, default=50)
    parser.add_argument('--permitir-particiones-faltantes', action='store_true')
    parser.add_argument('--arquetipos', type=Path, default=None, help='CSV arquetipos_municipales.csv')
    parser.add_argument('--esperados', type=Path, default=None, help='CSV esperado_por_entidad_edad.csv')
    args = parser.parse_args()
    import duckdb
    root = (args.root or Path(__file__).resolve().parents[4]).resolve()
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
    states = {}; traces = []; missing = []
    filenames = {}
    path_collisions = []
    source_files = [mp, Path(__file__).resolve()] + [p for p in (archetypes_file,expected_file) if p]
    def sum_into(dst, values):
        for j, v in enumerate(values):
            dst[j] += int(v)
    try:
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
                verified = all(r.get('equivalencia_verificada', '').lower() == 'si' for r in data['mapping'].values())
                candidate = str(mapping.get('cvegeo_candidato', '')).strip()
                # Numeric CVEGEO only when verified, never from an inferred candidate.
                cvegeo = candidate if verified and len(candidate) == 5 and candidate.isdigit() else None
                if cvegeo:
                    stem = f'{cvegeo}_{slug}'
                elif uid.startswith('candidato_'):
                    stem = f'{uid}_{slug}'
                else:
                    stem = f'ine_{state:02}_{origin:03}_{slug}'
                stem = re.sub(r'[^a-zA-Z0-9_-]+', '_', stem)
                dirname = f'{state:02}_{filename_slug(stable_display_name(state_names[state]))}'
                # !GRANDE: distinguir identidades históricas diferentes aunque
                # compartan código reciente y nombre (sin fusionar sus elecciones).
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
                payload = {'territorio':territory, 'fuente':SOURCE,
                           'suprimido':all(statuses) if statuses else False,
                           'identidad_verificada':verified, 'elecciones':elections}
                if not verified:
                    payload['advertencia'] = 'Identidad inferida o histórica sin equivalencia territorial verificada'
                # CAMBIO: arquetipo sólo con correspondencia CVEGEO verificada y existente en CSV.
                if cvegeo and cvegeo in archetypes:
                    payload['arquetipo'] = archetypes[cvegeo]
                save(staged/path, payload)
                # El contrato numérico municipal sólo es seguro para un identificador
                # que no se reutiliza en años distintos. Se genera después de revisar colisiones.

                # A summary is keyed by the operative identity to avoid mixing recoded INE keys.
                item = {'cve':origin,'nombre':name,'id_operativo':uid,
                        'suprimido':payload['suprimido'],
                        'participacion':{str(e['anio']):e['participacion'] for e in elections if 'participacion' in e},
                        'archivo':path, 'identidad_verificada':verified}
                if cvegeo is not None: item['cvegeo'] = cvegeo
                state_municipal[state].append(item)
                file_refs.append(path)
            # !GRANDE: aliases numéricos del contrato sólo para claves únicas.
            # Si una clave histórica corresponde a dos identidades, no se asigna una ruta ambigua.
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
            for state, years in sorted(state_names.items()):
                name = stable_display_name(years)
                slug = f'{state:02}_{filename_slug(name)}'
                path = f'entidad/{slug}.json'
                states[state] = {'territorio':{'nivel':'entidad','cve':state,'cveEntidad':state,'nombre':name},
                                 'fuente':SOURCE,
                                 'elecciones':sorted(state_elections[state], key=lambda e:e['anio']),
                                 'municipios':sorted(state_municipal[state],key=lambda e:(e['nombre'],e['id_operativo']))}
                if state in expected:
                    states[state]['votos_esperados_por_edad'] = expected[state]
                save(staged/path, states[state])
                save(staged/f'entidad/{state:02}.json', states[state])
                file_refs.append(path)
                save(staged/f'catalogos/municipios/{slug}.json',states[state]['municipios'])
            save(staged/'catalogos/entidades.json',
                 [{'cve':state,'nombre':data['territorio']['nombre'],
                   'archivo':f"entidad/{state:02}_{filename_slug(data['territorio']['nombre'])}.json"}
                  for state,data in sorted(states.items())])
            save(staged/'catalogos/archivos-entidades.json',
                 [{'cveEntidad':state,'nombre':data['territorio']['nombre'],
                   'archivo':f"entidad/{state:02}_{filename_slug(data['territorio']['nombre'])}.json"}
                  for state,data in sorted(states.items())])
            years_exported = [y for y in YEARS if any(y == e['anio'] for v in state_elections.values() for e in v)]
            save(staged/'nacional.json',{'territorio':{'nivel':'nacional','nombre':'México'},'fuente':SOURCE,
                 'elecciones':[election_l4(y, total_national[y], args.umbral,
                               national_age[y], national_sex[y]) for y in years_exported]})
            save(staged/'validacion/claves_ine_ambiguas.json', ambiguous_numeric)
            # CAMBIO: registrar rutas de identidades históricas que comparten slug.
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
            hasher = hashlib.sha256()
            for source in sorted(source_files, key=str):
                hasher.update(source.name.encode('utf-8'))
                with source.open('rb') as stream:
                    for chunk in iter(lambda: stream.read(1<<20), b''):
                        hasher.update(chunk)
            version = datetime.now(timezone.utc).strftime('%Y%m%d') + '-' + hasher.hexdigest()[:7]
            # Explicit capability report: no fake topology, archetypes, neighbors, or expected votes.
            quality = {'modalidad':'exploratoria_ine_primero',
                       'equivalencia_territorial':'verificada o inferida, diferenciada por municipio',
                       'cobertura_entidades':len(states),'particiones_faltantes':missing,
                       'recursos_municipales':len(grouped),
                       'colisiones_nombres_archivo_resueltas':len(path_collisions),
                       'no_generados':['vecinos','arquetipo','votos_esperados_por_edad',
                                        'TopoJSON','contexto_inegi_conapo'],
                       'advertencias':['No corresponde al contrato L4 aprobado',
                          'Suprimido por elección: se omiten cifras, no se exportan tasas indefinidas',
                          'Identificadores históricos sin equivalencia no deben usarse para joins geográficos']}
            save(staged/'calidad.json', quality)
            save(staged/'manifest.json',{'version_datos':version,
                 'estado_publicacion':'exploratorio_no_aprobado',
                 'generado':datetime.now(timezone.utc).isoformat(),
                 'fuente':SOURCE,'entidades':len(states),'anios':years_exported,
                 'umbral_rn05':args.umbral,'max_diferencia_pp':None,
                 'reporte':'calidad.json',
                 'catalogo_entidades':'catalogos/entidades.json',
                 'nacional':'nacional.json',
                 'particiones_faltantes':missing,
                 'limitaciones':quality['no_generados']})
            output = output_base / version
            output.parent.mkdir(parents=True, exist_ok=True)
            if output.exists(): shutil.rmtree(output)
            staged.rename(output)
            print(f'INE EXPLORATORIO: {len(states)} entidades, {len(grouped)} series municipales; '
                  f'versión {version}. Salida: {output}')
    except Exception:
        if staged.exists(): shutil.rmtree(staged)
        raise

if __name__ == '__main__':
    main()
