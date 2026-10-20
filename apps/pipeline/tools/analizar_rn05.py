
import argparse
import csv
from pathlib import Path

import duckdb

THRESHOLDS = [10, 30, 50, 100, 200]

# Cada nivel se analiza independientemente.
GRAINS = {'municipio': ['AELEC', 'EDOCVE', 'MPIOCVE'],
          'seccion': ['AELEC', 'EDOCVE', 'MPIOCVE', 'SECCION'],
          'seccion_sexo': ['AELEC', 'EDOCVE', 'MPIOCVE', 'SECCION', 'SEXO' ],
          'seccion_sexo_edad': ['AELEC', 'EDOCVE', 'MPIOCVE', 'SECCION', 'SEXO', 'grupo_edad'],}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--db', required=True)
    parser.add_argument('--output', default='rn05_sensibilidad.csv')
    args = parser.parse_args()

    # Solo lectura: no modifica la base del pipeline.
    con = duckdb.connect(args.db, read_only=True)
    results = []

    try:
        # Validar antes de procesar millones de filas.
        con.execute('''SELECT AELEC, EDOCVE, MPIOCVE, SECCION, SEXO, EDAD, LN, SV
        FROM analytics.hecho_participacion LIMIT 0''')

        for name, columns in GRAINS.items():
            print(f'Analizando: {name}', flush=True)

            group_by = ', '.join(columns)
            thresholds_sql = ', '.join(
                f'({x})' for x in THRESHOLDS
            )

            sql = f'''
            WITH origen AS (
                SELECT
                    AELEC,
                    EDOCVE,
                    MPIOCVE,
                    SECCION,
                    SEXO,
                    CASE
                        WHEN TRY_CAST(EDAD AS INTEGER)
                             BETWEEN 18 AND 24 THEN '18-24'
                        WHEN TRY_CAST(EDAD AS INTEGER)
                             BETWEEN 25 AND 34 THEN '25-34'
                        WHEN TRY_CAST(EDAD AS INTEGER)
                             BETWEEN 35 AND 44 THEN '35-44'
                        WHEN TRY_CAST(EDAD AS INTEGER)
                             BETWEEN 45 AND 59 THEN '45-59'
                        WHEN TRY_CAST(EDAD AS INTEGER)
                             >= 60 THEN '60+'
                        ELSE 'no_especificado'
                    END AS grupo_edad,
                    LN,
                    SV
                FROM analytics.hecho_participacion
            ),
            agregados AS (
                SELECT
                    {group_by},
                    SUM(LN) AS ln,
                    SUM(SV) AS sv
                FROM origen
                GROUP BY {group_by}
            )
            SELECT
                '{name}' AS nivel,
                AELEC AS anio,
                EDOCVE AS estado,
                t.umbral,
                COUNT(*) AS agregados_totales,
                COUNT(*) FILTER (
                    WHERE ln < t.umbral
                ) AS agregados_suprimidos,
                COUNT(*) FILTER (
                    WHERE ln IS NULL
                ) AS agregados_sin_ln,
                SUM(ln) AS ln_total,
                COALESCE(SUM(ln) FILTER (
                    WHERE ln < t.umbral
                ), 0) AS ln_suprimida,
                SUM(sv) AS sv_total,
                COALESCE(SUM(sv) FILTER (
                    WHERE ln < t.umbral
                ), 0) AS sv_suprimidos
            FROM agregados
            CROSS JOIN (
                VALUES {thresholds_sql}
            ) AS t(umbral)
            GROUP BY AELEC, EDOCVE, t.umbral
            ORDER BY AELEC, EDOCVE, t.umbral
            '''

            rows = con.execute(sql).fetchall()
            names = [d[0] for d in con.description]

            for row in rows:
                item = dict(zip(names, row))

                n = item['agregados_totales']
                suppressed = item['agregados_suprimidos']
                ln = item['ln_total']
                sv = item['sv_total']
                item['pct_agregados_suprimidos'] = (100 * suppressed / n if n else None)
                item['pct_ln_suprimida'] = (100 * item['ln_suprimida'] / ln if ln else None)
                item['pct_sv_suprimidos'] = (100 * item['sv_suprimidos'] / sv if sv else None)
                results.append(item)

        output = Path(args.output)
        with output.open('w', newline='', encoding='utf-8-sig') as file:
            writer = csv.DictWriter(file, fieldnames=list(results[0]))
            writer.writeheader()
            writer.writerows(results)

        print(f'Auditoría completada: {output}')
        print(f'Filas de resultados: {len(results)}')

    finally:
        con.close()


if __name__ == '__main__':
    main()
