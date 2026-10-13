"""Reglas del puente v2 → L4 (convertir_v2.py)."""

from revoto_pipeline.convertir_v2 import cruce_ine_inegi, proporcion, tipo, vecinos_de


def test_rn03_tipo_de_eleccion():
    assert [tipo(a) for a in (2009, 2012, 2015, 2018, 2021, 2024)] == [
        "intermedia", "presidencial", "intermedia", "presidencial", "intermedia", "presidencial"]


def test_rn01_proporcion_sin_el_sin_dato():
    assert proporcion(sv=45, ln=100, ns=10) == 0.5
    assert proporcion(sv=0, ln=2707, ns=2707) is None  # elección sin votos registrados


def test_vecinos_por_arcos_compartidos():
    topo = {"objects": {"m": {"geometries": [
        {"arcs": [[0, 1]], "properties": {"cvegeo": "01001"}},
        {"arcs": [[~1, 2]], "properties": {"cvegeo": "01002"}},
        {"arcs": [[[3]]], "properties": {"cvegeo": "01003"}},
    ]}}}
    v = vecinos_de(topo)
    assert v["01001"] == {"01002"} and v["01002"] == {"01001"} and not v["01003"]


def test_cruce_no_supone_claves_iguales():
    inegi = {"01010": {"edo": 1, "nombre": "El Llano"}, "01011": {"edo": 1, "nombre": "San Francisco de los Romo"},
             "02007": {"edo": 2, "nombre": "San Felipe"}}
    arq = {(1, 10): {"cvegeo": "01011"}, (1, 11): {"cvegeo": "01010"}, (2, 7): {"cvegeo": ""}}
    cruce, avisos = cruce_ine_inegi({(1, 10), (1, 11), (2, 7)}, inegi, arq)
    assert cruce == {(1, 10): "01011", (1, 11): "01010", (2, 7): "02007"}
    assert len(avisos) == 1 and "misma clave" in avisos[0]
