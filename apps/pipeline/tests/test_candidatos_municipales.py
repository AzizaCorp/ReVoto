"""Tests sintéticos de descubrimiento; jamás validan una recodificación por nombre."""
from revoto_pipeline.generar_mappings import discover_municipal_candidates


def test_candidato_por_nombre_codigo_distinto_no_es_verificado():
    records=[(2018,7,121,'Mezcalapa'),(2018,7,122,'El Parral')]
    catalog={(2020,'07123'):'Mezcalapa',(2020,'07121'):'El Parral'}
    rows=discover_municipal_candidates(records, [], catalog, {2018:2020})
    item=next(r for r in rows if r['cve_mpio_ine']==121 and r['cvegeo_candidato']=='07123')
    assert item['evaluacion']=='candidato_unico_nombre_requiere_evidencia'
    assert item['equivalencia_verificada']=='no'
    assert item['codigo_coincide']=='no'
    assert any(r['evaluacion']=='codigo_no_coincide_con_nombre' for r in rows)


def test_conflicto_historico_impide_inferir_verificacion():
    records=[(2018,7,121,'Mezcalapa')]
    flags=[{'anio_eleccion':2018,'cve_ent_ine':'07','cve_mpio_ine':'121',
            'categorias':'A_clave_distintos_nombres|E_posible_reutilizacion'}]
    rows=discover_municipal_candidates(records,flags,{(2020,'07123'):'Mezcalapa'}, {2018:2020})
    assert all(r['evaluacion']=='revision_territorial_obligatoria' for r in rows)
    assert all(r['equivalencia_verificada']=='no' for r in rows)


def test_nombre_duplicado_no_elige_arbitrariamente():
    rows=discover_municipal_candidates([(2024,1,10,'Villa')],[],
         {(2020,'01012'):'Villa',(2020,'01013'):'Villa'}, {2024:2020})
    assert len(rows)==2
    assert all(r['evaluacion']=='nombre_duplicado_catalogo' for r in rows)


def test_sin_candidato_es_explicito():
    rows=discover_municipal_candidates([(2009,1,11,'Municipio Inventado')],[],
         {(2010,'01001'):'Aguascalientes'},{2009:2010})
    assert len(rows)==1 and rows[0]['evaluacion']=='sin_candidato_catalogo'
    assert rows[0]['cvegeo_candidato']==''


def test_codigo_y_nombre_coincidentes_no_se_publican_desde_candidatos():
    rows=discover_municipal_candidates([(2009,1,1,'Aguascalientes')],[],
         {(2010,'01001'):'Aguascalientes'},{2009:2010})
    assert rows[0]['evaluacion']=='concordancia_codigo_nombre_sujeta_a_reglas_actuales'
    assert rows[0]['equivalencia_verificada']=='no'
