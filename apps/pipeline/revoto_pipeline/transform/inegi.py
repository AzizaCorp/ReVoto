"""ITER selector, record-level classifier, official sex-split catalog."""
from __future__ import annotations
from pathlib import Path
from revoto_pipeline.sql_utils import ident, norm, num, read_csv

# Selected names are candidates from the project, not proof of presence in 2010.
IDENTITY = ('ENTIDAD','MUN','LOC','NOM_ENT','NOM_MUN','NOM_LOC',
            'LONGITUD','LATITUD')
INDICATORS = ('POBTOT', 'POBFEM', 'POBMAS', 'P_18YMAS', 'P_18YMAS_F', 'P_18YMAS_M',
              'P_18A24', 'P_18A24_F', 'P_18A24_M', 'P_60YMAS', 'P_60YMAS_F', 'P_60YMAS_M',
              'P3YM_HLI', 'P3YM_HLI_F', 'P3YM_HLI_M', 'PHOG_IND',
              'POB_AFRO', 'POB_AFRO_F', 'POB_AFRO_M', 'PCON_DISC',
              'GRAPROES', 'GRAPROES_F', 'GRAPROES_M', 'P15YM_AN', 'P15YM_AN_F', 'P15YM_AN_M',
              'P18YM_PB', 'P18YM_PB_F', 'P18YM_PB_M', 'PEA', 'PEA_F', 'PEA_M', 
              'POCUPADA', 'POCUPADA_F', 'POCUPADA_M', 'PDESOCUP', 'PDESOCUP_F', 'PDESOCUP_M',
              'VPH_INTER', 'VPH_CEL', 'PSINDER', 'PDER_SS',
              'PRESOE15', 'PRESOE15_F', 'PRESOE15_M', 'P3HLINHE', 'P3HLINHE_F', 'P3HLINHE_M'
              'VPH_S_ELEC', 'VPH_AGUADV', 'VPH_DRENAJ')
# These three count variables are officially published sex-specific measures.
EXPLICIT_SEX_PAIRS = {
    'POBTOT': ('POBFEM','POBMAS'),
}



def find_sex_pairs(columns: list[str]) -> dict[str, tuple[str,str]]:
    """Accept official paired source columns; never estimate from overall ratios."""
    selected = set(INDICATORS)
    available = set(columns)
    pairs = {total: (female, male)
             for total,(female,male) in EXPLICIT_SEX_PAIRS.items()
             if {total,female,male} <= available}
    for total in selected:
        if not (total.endswith('_F') or total.endswith('_M')):
            f, m = total+'_F', total+'_M'
            if {total,f,m} <= available:
                pairs[total] = (f,m)
    return dict(sorted(pairs.items()))


def selected_indicators(columns: list[str]) -> list[str]:
    pairs = find_sex_pairs(columns)
    return list(dict.fromkeys([*INDICATORS,
        *(part for group in pairs.values() for part in group)]))


def record_level_sql() -> str:
    return '''CASE
       WHEN ENTIDAD='00' AND MUN='000' AND LOC IN ('9998','9999')
         THEN 'agrupacion_nacional_especial'
       WHEN LOC IN ('9998','9999') THEN 'agrupacion_especial'
       WHEN ENTIDAD='00' AND MUN='000' AND LOC='0000' THEN 'total_nacional'
       WHEN MUN='000' AND LOC='0000' THEN 'total_estatal'
       WHEN LOC='0000' THEN 'total_municipal'
       ELSE 'localidad_regular' END'''


def inegi_select(path: Path, census: int, columns: list[str]) -> str:
    present = set(columns)
    projected: list[str] = []
    for name in IDENTITY:
        projected.append(f'{norm(name)} AS {ident(name)}' if name in present
                         else f'NULL::VARCHAR AS {ident(name)}')
    for name in selected_indicators(columns):
        expr = num(name, 'DOUBLE' if name.startswith('GRAPROES') else 'BIGINT') if name in present else \
               ('NULL::DOUBLE' if name.startswith('GRAPROES') else 'NULL::BIGINT')
        projected.append(f'{expr} AS {ident(name)}')
        projected.append(f'({norm(name)} = \'*\') AS {ident(name + "__suppressed")}' if name in present
                         else f'FALSE AS {ident(name+"__suppressed")}')
    # Missing variables in 2010 are not fabricated; a report lists them.
    projected.append(f'{census}::INTEGER AS censo_ref')
    projected.append(f"'{path.name.replace(chr(39), chr(39)*2)}' AS source_file")
    inner = 'SELECT ' + ',\n'.join(projected) + f' FROM {read_csv(path)}'
    return f'''SELECT t.*, {record_level_sql()} AS record_level,
       (COALESCE(ENTIDAD,'') || COALESCE(MUN,'') || COALESCE(LOC,'')) AS cvegeo
       FROM ({inner}) t'''


def sex_long_select(parquet: Path, pairs: dict[str, tuple[str,str]]) -> str:
    """Long format only for observed sex-specific data, no imputation."""
    from revoto_pipeline.config import sql_path
    unions = []
    for total, (female, male) in pairs.items():
        for sex, field in [(0,male),(1,female)]:
            unions.append(f'''SELECT censo_ref,cvegeo,{sex}::TINYINT AS sexo,
                '{total.lower()}' AS indicador, {ident(field)} AS valor,
                {ident(field+'__suppressed')} AS suppressed
                FROM read_parquet('{sql_path(parquet)}')
                WHERE record_level='localidad_regular' ''')
    if not unions:
        return "SELECT 0::INTEGER AS censo_ref, ''::VARCHAR AS cvegeo, " \
               "0::TINYINT AS sexo, ''::VARCHAR AS indicador, " \
               "NULL::BIGINT AS valor, FALSE AS suppressed WHERE FALSE"
    return ' UNION ALL '.join(unions)
