"""Casos sintéticos (NO constituyen aprobación geográfica de Chiapas)."""
from __future__ import annotations

import csv
from dataclasses import replace
import json
from pathlib import Path

import pytest

from revoto_pipeline.model.identidad_municipal import (
    COLUMNS, code5, load_identities, require_identities)
from revoto_pipeline.validation.municipios import audit_municipalities
from revoto_pipeline.export.frontend import _period_status, _election
from revoto_pipeline.model.marts import aggregation_sql


YEARS = (2009,2012,2015,2018,2021,2024)
SYNTHETIC = [(2018,7,121,'Mezcalapa'),(2018,7,122,'El Parral'),
             (2021,7,121,'El Parral'),(2021,7,123,'Mezcalapa'),
             (2024,7,121,'El Parral'),(2024,7,123,'Mezcalapa')]


def write_mapping(path: Path, rows: list[dict]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    return path


def verified(year, code, original, target, canonical_name, equivalence='recodificacion'):
    return {'anio_eleccion': year, 'cve_ent_ine':7, 'cve_mpio_ine':code,
            'nombre_ine':original, 'cvegeo_canonico':target,
            'nombre_canonico':canonical_name, 'tipo_equivalencia':equivalence,
            'equivalencia_verificada':'si', 'censo_referencia':2020,
            'fuente_referencia':'ITER sintético 2020',
            'evidencia':'dictamen documental de prueba', 'observacion':''}


def sample_rows():
    return [verified(2018,121,'Mezcalapa','07123','Mezcalapa'),
            verified(2018,122,'El Parral','07121','El Parral'),
            verified(2021,121,'El Parral','07121','El Parral','exacta'),
            verified(2021,123,'Mezcalapa','07123','Mezcalapa','exacta'),
            verified(2024,121,'El Parral','07121','El Parral','exacta'),
            verified(2024,123,'Mezcalapa','07123','Mezcalapa','exacta')]


def test_auditoria_distingue_clave_nombre_y_posibles_reutilizaciones():
    report = audit_municipalities(SYNTHETIC, YEARS, (7,))
    flagged = next(r for r in report if r['anio_eleccion']==2018 and
                   r['cve_mpio_ine']=='121')
    assert 'A_clave_distintos_nombres' in flagged['categorias']
    assert 'B_nombre_distintas_claves' in flagged['categorias']
    assert 'E_posible_reutilizacion' in flagged['categorias']
    assert 'F_posible_recodificacion' in flagged['categorias']
    assert any(r['categorias']=='SIN_PARTICION_INE' for r in report)


def test_auditoria_detecta_aparicion_desaparicion_y_ortografia():
    data = [(2018,7,123,'Ciudad Ámbar'),(2021,7,123,'Ciudad Ambar'),
            (2021,7,124,'Villa Nueva'), (2024,7,124,'Villa Nueva')]
    report = audit_municipalities(data, (2018,2021,2024), (7,))
    historic = [r for r in report if r['cve_mpio_ine']=='123']
    assert all('G_variacion_ortografica' in r['categorias'] for r in historic)
    assert any('D_desaparicion_clave' in r['categorias'] for r in historic)
    assert any('C_aparicion_clave' in r['categorias'] for r in report)
    assert not any('A_clave_distintos_nombres' in r['categorias'] for r in historic)


def test_mappings_verificados_forman_series_separadas(tmp_path):
    identities = require_identities(write_mapping(tmp_path/'historico.csv', sample_rows()),
                                    {(y,e,m):n for y,e,m,n in SYNTHETIC})
    grouped = {}
    for year, state, historic, name in SYNTHETIC:
        ident = identities[(year,state,historic)]
        grouped.setdefault(ident.cvegeo, set()).add((year,name))
    assert grouped['07123'] == {(2018,'Mezcalapa'),(2021,'Mezcalapa'),(2024,'Mezcalapa')}
    assert grouped['07121'] == {(2018,'El Parral'),(2021,'El Parral'),(2024,'El Parral')}
    assert len(grouped)==2


def test_equivalencia_ambigua_bloquea_publicacion(tmp_path):
    rows = sample_rows()
    rows[0].update(cvegeo_canonico='',nombre_canonico='',
                   tipo_equivalencia='ambigua_no_verificada',
                   equivalencia_verificada='no',evidencia='')
    path = write_mapping(tmp_path/'historico.csv',rows)
    with pytest.raises(ValueError, match='pendiente/no verificada'):
        require_identities(path, {(2018,7,121):'Mezcalapa'})


def test_no_se_permite_adjudicar_dos_ine_al_mismo_cvegeo(tmp_path):
    rows = sample_rows()
    rows[1].update(cvegeo_canonico='07123',nombre_canonico='Mezcalapa')
    with pytest.raises(ValueError, match='comparten CVEGEO'):
        load_identities(write_mapping(tmp_path/'historico.csv',rows))


def test_no_se_acepta_codigo_sin_evidencia_o_fuera_estado(tmp_path):
    assert code5('071230000') == '07123'
    with pytest.raises(ValueError):code5('071230001')
    rows = sample_rows()
    rows[0]['evidencia'] = ''
    with pytest.raises(ValueError, match='sin evidencia'):
        load_identities(write_mapping(tmp_path/'historico.csv',rows))
    rows = sample_rows()
    rows[0]['cvegeo_canonico'] = '08123'
    with pytest.raises(ValueError, match='otra entidad'):
        load_identities(write_mapping(tmp_path/'historico.csv',rows))


def test_identidad_exacta_sin_recodificacion(tmp_path):
    row = verified(2024,1,'Municipio X','07001','Municipio X','exacta')
    assert len(load_identities(write_mapping(tmp_path/'historico.csv',[row])))==1


def test_status_indefinido_por_periodo_no_cambia_otros_anios():
    statuses = {2009: _period_status({'LN':4026,'SV':0,'NS':4026}, 50),
                2012: _period_status({'LN':4000,'SV':2000,'NS':0},50),
                2015: _period_status({'LN':20,'SV':10,'NS':0},50),
                2018: _period_status(None,50)}
    assert statuses == {2009:'rate_undefined',2012:'available',
                        2015:'suppressed',2018:'no_data'}
    assert _election({'LN':4000,'SV':2000,'NS':0}, 2012, 50, {}, {})['participacion'] == .5
    assert "'rate_undefined'" in aggregation_sql('tabla', ('AELEC','EDOCVE','MPIOCVE'),rn05=50)


def test_mapeo_no_vuelve_a_validar_solo_por_nombre(tmp_path):
    # Igual nombre pero referencia sin evidencia significa pendiente, no acreditación.
    rows = sample_rows()
    rows[0]['equivalencia_verificada'] = 'no'
    rows[0]['cvegeo_canonico'] = ''
    rows[0]['tipo_equivalencia'] = 'ambigua_no_verificada'
    with pytest.raises(ValueError, match='pendiente'):
        require_identities(write_mapping(tmp_path/'historico.csv',rows),
                           {(2018,7,121):'Mezcalapa'})


def test_name_mismatch_denied(tmp_path):
    with pytest.raises(ValueError, match='MPIONOM histórico'):
        require_identities(write_mapping(tmp_path/'historico.csv',sample_rows()),
                           {(2018,7,121):'Otro municipio'})
