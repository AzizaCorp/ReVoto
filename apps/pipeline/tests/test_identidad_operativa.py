from revoto_pipeline.model.identidad_operativa import name_relation, reconcile_operational_rows


def row(year, ent, mun, name, code='', verified='no'):
    return {
        'anio_eleccion': str(year), 'cve_ent_ine': str(ent), 'cve_mpio_ine': str(mun),
        'nombre_ine': name, 'identificador_operativo': f'old:{year}:{ent}:{mun}',
        'cvegeo_candidato': code, 'nombre_canonico_candidato': '',
        'origen_identidad': 'test', 'confianza': '', 'equivalencia_verificada': verified,
        'censo_referencia': '2020', 'advertencia': ''
    }


def test_typo_transposition_is_candidate_not_verified():
    assert name_relation('Dzitblache', 'Dzitbalché')[0] == 'variacion_ortografica_probable'
    out = reconcile_operational_rows([row(2021,4,12,'Dzitblache'), row(2024,4,12,'Dzitbalché')])
    assert {x['identificador_operativo'] for x in out} == {'ine_serie:04:012'}
    assert {x['estado_resolucion'] for x in out} == {'candidato_inequivoco'}
    assert {x['equivalencia_verificada'] for x in out} == {'no'}


def test_hopelchen_propagates_unique_candidate_without_verifying():
    rows = [row(y,4,6,'Hopelchén','04006') for y in (2009,2012,2015,2018,2021)]
    rows.append(row(2024,4,6,'Hopelche}én'))
    out = reconcile_operational_rows(rows)
    assert {x['identificador_operativo'] for x in out} == {'candidato_inegi:04006'}
    assert {x['cvegeo_candidato'] for x in out} == {'04006'}
    assert all(x['equivalencia_verificada'] == 'no' for x in out)


def test_cuatro_cienegas_space_change_merges():
    out = reconcile_operational_rows([
        row(2021,5,7,'Cuatro Ciénegas','05007'), row(2024,5,7,'Cuatrociénegas')])
    assert len({x['identificador_operativo'] for x in out}) == 1
    assert out[0]['identificador_operativo'] == 'candidato_inegi:05007'


def test_maravilla_typo_merges_with_anchor():
    out = reconcile_operational_rows([
        row(2018,7,114,'Maravilla Tejenapa'), row(2021,7,114,'Maravilla Tenejapa','07115'),
        row(2024,7,114,'Maravilla Tenejapa','07115')])
    assert {x['identificador_operativo'] for x in out} == {'candidato_inegi:07115'}


def test_real_code_reuse_stays_ambiguous():
    out = reconcile_operational_rows([
        row(2018,7,120,'Emiliano Zapata','07123'),
        row(2021,7,120,'Rincón Chamula San Pedro','07121'),
        row(2024,7,120,'Rincón Chamula San Pedro','07121')])
    assert {x['estado_resolucion'] for x in out} == {'ambiguo'}
    assert len({x['identificador_operativo'] for x in out}) == 2


def test_swapped_michoacan_codes_not_merged():
    out = reconcile_operational_rows([
        row(2018,16,65,'Parácuaro','16064'), row(2021,16,65,'Paracho','16065'),
        row(2024,16,65,'Parácuaro','16064')])
    assert {x['estado_resolucion'] for x in out} == {'ambiguo'}
    assert len({x['identificador_operativo'] for x in out}) == 3


def test_verified_rename_has_alias_status():
    rows = [row(2021,1,1,'Nombre viejo','01001','si'), row(2024,1,1,'Nombre nuevo','01001','si')]
    for item in rows:
        item['tipo_equivalencia'] = 'renombre'
    # Los nombres muy distintos fuerzan segmentos; una verificación manual debe llegar
    # ya con una continuidad explícita. Este test usa alias ortográfico compatible.
    rows[0]['nombre_ine'] = 'Nombre Único'
    rows[1]['nombre_ine'] = 'Nombre Unico'
    out = reconcile_operational_rows(rows)
    assert {x['estado_resolucion'] for x in out} == {'alias_historico_verificado'}
    assert {x['identificador_operativo'] for x in out} == {'cvegeo:01001'}
