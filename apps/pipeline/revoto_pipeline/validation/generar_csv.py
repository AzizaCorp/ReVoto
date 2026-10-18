from pathlib import Path
import csv, sys
base=Path(__file__).resolve().parent
entries=list(csv.DictReader((base/'control_fuentes.csv').open(encoding='utf-8-sig',newline='')))
verified={}
for row in entries:
    k=(int(row['anio_eleccion']),int(row['cve_entidad']))
    if k in verified: sys.exit(f'Duplicado: {k}')
    if row['estatus'] != 'verificado': continue
    if not row['fuente_url'].startswith('https://') or not row['participacion_pct'].strip():
        sys.exit(f'Faltan fuente o porcentaje: {k}')
    val=float(row['participacion_pct'].replace(',','.'))
    if not (0<=val<=100):sys.exit(f'Fuera de rango: {k}')
    verified[k]=val
expected={(year,edo) for year in (2009,2012,2015,2018,2021,2024) for edo in range(1,33)}
missing=expected-set(verified)
if missing:sys.exit(f'PENDIENTE: {len(missing)} referencias por verificar. NO se ha creado el CSV de publicación. Primeras: {sorted(missing)[:10]}')
target=base/'cifras_oficiales.csv'
with target.open('w',encoding='utf-8',newline='') as file:
    writer=csv.writer(file);writer.writerow(['anio_eleccion','cve_entidad','participacion_pct'])
    for (year,edo),pct in sorted(verified.items(),key=lambda x:(x[0][1],x[0][0])):
        writer.writerow([year,edo,f'{pct:.6f}'])
print(f'Creado {target} con {len(verified)} referencias verificadas')
