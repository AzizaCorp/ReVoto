"""REVOTO: valida dictámenes documentados y produce un mapping municipal seguro.

Ejemplo:
 python validar_dictamenes.py --base municipios_historicos_seguro.csv --candidatos correspondencias_nacionales_auditoria.csv --dictamen dictamenes_aprobados.csv --salida municipios_historicos_actualizado.csv
No aprueba ningún candidato por nombre. El CSV de dictámenes debe contener decisiones explícitas y evidencia.
"""
import argparse
import csv
from pathlib import Path

KEY = ('anio_eleccion','cve_ent_ine','cve_mpio_ine')

def read(p):
    with Path(p).open('r',newline='',encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

def write(p, rows, cols):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
    with p.open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.DictWriter(f,fieldnames=cols);w.writeheader();w.writerows(rows)

def norm(s):
    import unicodedata,re
    s=''.join(ch for ch in unicodedata.normalize('NFKD',str(s).upper()) if not unicodedata.combining(ch))
    return re.sub(r'\s+',' ',re.sub(r'[^A-Z0-9]+',' ',s)).strip()

def k(row): return tuple(int(row[c]) for c in KEY)

def build(base, candidates, approvals):
    rows=read(base); cand=read(candidates); decisions=read(approvals)
    if len({k(x) for x in rows}) != len(rows): raise ValueError('Duplicados en mapping base')
    catalog={k(x):x for x in cand}; ids={k(x):x for x in rows}
    seen=set()
    for d in decisions:
        key=k(d)
        if key in seen: raise ValueError(f'Dictamen duplicado {key}')
        seen.add(key)
        if key not in ids or key not in catalog: raise ValueError(f'Dictamen sin identidad original {key}')
        original=ids[key];candidate=catalog[key]
        if original['equivalencia_verificada']=='si': raise ValueError(f'Dictamen altera verificado existente {key}')
        if d.get('decision','').strip().lower() != 'aprobar':
            continue
        code=d.get('cvegeo_canonico','').strip().zfill(5)
        if not code.isdigit() or len(code)!=5 or code[:2]!=f'{key[1]:02}': raise ValueError(f'CVEGEO inválido {key}: {code}')
        if code!=candidate.get('cvegeo_candidato',''):
            raise ValueError(f'CVEGEO no coincide con candidato documentado {key}. Crea revisión manual adicional.')
        if d.get('tipo_equivalencia','') not in ('exacta','recodificacion','renombre'):
            raise ValueError(f'Tipo inválido {key}')
        if int(d.get('censo_referencia','0')) != int(original['censo_referencia']):
            raise ValueError(f'Censo incorrecto {key}')
        if not d.get('fuente_referencia','').strip() or not d.get('evidencia','').strip() or not d.get('url_evidencia','').strip():
            raise ValueError(f'Falta fuente, evidencia o URL comprobable {key}')
        if norm(d.get('nombre_ine',''))!=norm(original['nombre_ine']): raise ValueError(f'Nombre INE alterado {key}')
        if norm(d.get('nombre_canonico',''))!=norm(candidate['nombre_inegi']):
            raise ValueError(f'Nombre canónico no coincide con catálogo {key}')
        original.update(cvegeo_canonico=code,nombre_canonico=candidate['nombre_inegi'],
          tipo_equivalencia=d['tipo_equivalencia'],equivalencia_verificada='si',
          fuente_referencia=d['fuente_referencia'],evidencia=d['evidencia']+' | '+d['url_evidencia'],observacion=d.get('observacion',''))
    occupied={}
    for row in rows:
        if row['equivalencia_verificada']!='si':continue
        code=row['cvegeo_canonico'];
        if len(code)!=5 or not code.isdigit():raise ValueError(f'CVEGEO inválido: {k(row)}')
        target=(int(row['anio_eleccion']),code)
        if target in occupied and occupied[target]!=k(row):raise ValueError(f'Colisión por año/CVEGEO: {occupied[target]} vs {k(row)}')
        occupied[target]=k(row)
    return rows

def main():
    p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--candidatos',required=True);p.add_argument('--dictamen',required=True);p.add_argument('--salida',required=True)
    a=p.parse_args(); rows=build(a.base,a.candidatos,a.dictamen)
    write(a.salida,rows,list(rows[0])); pending=sum(r['equivalencia_verificada']!='si' for r in rows)
    print(f'Mapping escrito: {a.salida}. Pendientes: {pending}; verificados: {len(rows)-pending}')
if __name__=='__main__': main()
