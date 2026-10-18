"""Auditoría nacional: señales de cambios de códigos/nombres, NO equivalencias."""
from __future__ import annotations

from collections import defaultdict
from revoto_pipeline.model.identidad_municipal import normalize_name

def audit_municipalities(records: list[tuple[int, int, int, str]],
                         years: tuple[int, ...], states: range | tuple[int, ...] = range(1, 33)) -> list[dict]:
    by_key = defaultdict(list)
    by_name = defaultdict(list)
    same_period_names = defaultdict(set)
    for year, ent, code, name in records:
        by_key[(ent, code)].append((year, name))
        by_name[(ent, normalize_name(name))].append((year, code, name))
        same_period_names[(year, ent, code)].add(normalize_name(name))
    present = {(year, ent, code) for year, ent, code, _ in records}
    covered = {(year, ent) for year, ent, _, _ in records}
    rows = []
    for year, ent, code, name in sorted(set(records)):
        k = (ent, code)
        n = (ent, normalize_name(name))
        key_names = {normalize_name(x) for _, x in by_key[k]}
        name_codes = {c for _, c, _ in by_name[n]}
        spellings = {x for _, x in by_key[k]}
        flags = []
        if len(same_period_names[(year, ent, code)]) > 1:
            flags.append('nombres_distintos_mismo_periodo')
        if len(key_names) > 1:
            flags.append('A_clave_distintos_nombres')
        if len(name_codes) > 1:
            flags.append('B_nombre_distintas_claves')
        index = years.index(year)
        if index and (years[index-1], ent) in covered and (years[index-1], ent, code) not in present:
            flags.append('C_aparicion_clave')
        if index < len(years)-1 and (years[index+1], ent) in covered and (years[index+1], ent, code) not in present:
            flags.append('D_desaparicion_clave')
        if len(key_names) > 1:
            flags.append('E_posible_reutilizacion')
        if len(name_codes) > 1:
            flags.append('F_posible_recodificacion')
        if len(spellings) > 1 and len(key_names) == 1:
            flags.append('G_variacion_ortografica')
        if not flags:
            continue
        rows.append({
            'anio_eleccion': year, 'cve_ent_ine': f'{ent:02}',
            'cve_mpio_ine': f'{code:03}', 'nombre_ine': name,
            'categorias': '|'.join(flags),
            'historial_clave': ' | '.join(f'{y}:{label}' for y, label in sorted(set(by_key[k]))),
            'historial_nombre': ' | '.join(f'{y}:{c:03}:{label}' for y,c,label in sorted(set(by_name[n]))),
            'requiere_revision': 'si' if any(x[0] in 'ABEF' for x in flags) else 'evaluar',
            'dictamen': '', 'fuente_verificacion': '',
        })
    for ent in states:
        for year in years:
            if (year, ent) not in covered:
                rows.append({'anio_eleccion':year,'cve_ent_ine':f'{ent:02}',
                    'cve_mpio_ine':'','nombre_ine':'','categorias':'SIN_PARTICION_INE',
                    'historial_clave':'','historial_nombre':'','requiere_revision':'si',
                    'dictamen':'','fuente_verificacion':''})
    return sorted(rows, key=lambda r:(int(r['cve_ent_ine']),r['anio_eleccion'],r['cve_mpio_ine']))
