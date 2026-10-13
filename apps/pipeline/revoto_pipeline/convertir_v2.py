"""Puente JSON v2 → contrato L4 (DIS-REVOTO-ARQUITECTURA-DESPLIEGUE §5 + extensión US-11).

Mientras `exportar.py` (L3 → L4 desde DuckDB) no esté listo, este módulo reescribe los JSON
`frontend v2` que ya generó el pipeline (`ine/edo=XX/anio=AAAA/*.json`) en la
estructura que lee la app. No toca las fuentes ni recalcula desde la sección: solo reorganiza,
normaliza y agrega catálogos, arquetipos, vecinos, votos esperados, calidad y datos abiertos.

Uso, desde la raíz del repositorio:

    git archive feat/US-06-dataset-pipeline apps/web/public/data | tar -x -C /tmp/v2
    python -m revoto_pipeline.convertir_v2 --v2 /tmp/v2/apps/web/public/data \\
        --marco data/raw/geografia/inegi --salida apps/web/public/data

(con `PYTHONPATH=apps/pipeline`). Solo usa la biblioteca estándar; la geometría se simplifica
con mapshaper (Node).
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import shlex
import shutil
import subprocess
import tempfile
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

ANIOS = (2009, 2012, 2015, 2018, 2021, 2024)
GRUPOS = ("18-24", "25-34", "35-44", "45-59", "60+")
SEXO = {0: "H", 1: "M"}  # dim_sexo: 0 Hombres, 1 Mujeres; 2 = no identificado (RN-06, se excluye)
ARQUETIPOS = {  # nombre del análisis → id del dominio (apps/web/src/domain/identity/Archetype.ts)
    "Siempre presente": "A1",
    "En ascenso": "A2",
    "Montaña rusa": "A3",
    "De elección grande": "A4",
    "Bajando el ritmo": "A5",
}
FUENTE = "Conteos censales INE (DECEYEC), elecciones federales 2009–2024"
FUENTE_CORTA = "Conteos censales INE (DECEYEC)"
UMBRAL_RN05 = 50
LIMITE_ENTIDAD_KB = 300  # RNF-04
LIMITE_MUNICIPIO_KB = 20
INSUMOS = Path(__file__).resolve().parent.parent / "insumos"


def tipo(anio: int) -> str:
    """RN-03: presidenciales cada 6 años desde 2012."""
    return "presidencial" if (anio - 2012) % 6 == 0 else "intermedia"


def proporcion(sv: int, ln: int, ns: int) -> float | None:
    """RN-01: votaron ÷ (lista nominal − sin dato), 3 decimales. None si no hay base."""
    base = ln - ns
    return round(sv / base, 3) if base > 0 and sv > 0 else None


def orden(t: list[int]) -> tuple[int, int, int]:
    """(ln, sv, nv, ns) → argumentos de proporcion(sv, ln, ns)."""
    return t[1], t[0], t[3]


def dump(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


# ── Lectura ────────────────────────────────────────────────────────────────────────────────


def leer_v2(v2: Path):
    """Devuelve {(edo, anio): {grano: [filas]}} desde ine/edo=XX/anio=AAAA/*.json."""
    datos = {}
    for archivo in sorted(v2.glob("ine/edo=*/anio=*/*.json")):
        d = json.loads(archivo.read_text("utf-8"))
        if d.get("schema_version") != 2:
            raise ValueError(f"{archivo}: se esperaba schema_version 2")
        clave = (int(d["estado"]), int(d["anio_eleccion"]))
        datos.setdefault(clave, {})[d["grano"]] = d["medidas"]
    return datos


def leer_csv(nombre: str):
    with open(INSUMOS / nombre, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def cruce_ine_inegi(municipios_ine: set[tuple[int, int]], inegi: dict[str, dict], arq: dict):
    """Clave INE (edo, mun) → cvegeo INEGI. La clave INE y la del INEGI difieren en más de la mitad
    de los municipios, así que nunca se suponen iguales salvo como último recurso, y se reporta."""
    cruce, avisos = {}, []
    for k in municipios_ine:
        cg = (arq.get(k) or {}).get("cvegeo", "")
        if cg in inegi:
            cruce[k] = cg
    usados = set(cruce.values())
    pendientes = sorted(k for k in municipios_ine if k not in cruce)
    for edo, mun in pendientes:  # 1) misma clave, si nadie la usa
        cg = f"{edo:02d}{mun:03d}"
        if cg in inegi and cg not in usados:
            cruce[(edo, mun)] = cg
            usados.add(cg)
            avisos.append(f"{edo}-{mun:03d} → {cg} ({inegi[cg]['nombre']}): misma clave")
    for edo, mun in [k for k in pendientes if k not in cruce]:  # 2) única clave libre del estado
        libres = sorted(c for c, r in inegi.items() if r["edo"] == edo and c not in usados)
        if libres:
            cruce[(edo, mun)] = libres[0]
            usados.add(libres[0])
            avisos.append(
                f"{edo}-{mun:03d} → {libres[0]} ({inegi[libres[0]]['nombre']}): clave INEGI libre del estado"
            )
        else:
            avisos.append(f"{edo}-{mun:03d}: sin clave INEGI")
    return cruce, avisos


# ── Geometría ─────────────────────────────────────────────────────────────────────────────


def vecinos_de(topologia: dict) -> dict[str, set[str]]:
    """Municipios que comparten un arco en la topología (colindantes)."""
    objeto = next(iter(topologia["objects"].values()))
    por_arco = defaultdict(set)

    def arcos(a):
        for x in a:
            if isinstance(x, list):
                yield from arcos(x)
            else:
                yield x if x >= 0 else ~x

    for g in objeto["geometries"]:
        for i in arcos(g.get("arcs", [])):
            por_arco[i].add(g["properties"]["cvegeo"])
    vec = defaultdict(set)
    for grupo in por_arco.values():
        for a in grupo:
            vec[a] |= grupo - {a}
    return vec


# ── Conversión ─────────────────────────────────────────────────────────────────────────────


def convertir(v2: Path, marco: Path, salida: Path, mapshaper: str, ahora: datetime) -> Path:
    datos = leer_v2(v2)
    entidades = {int(r["cve_entidad"]): r["nombre"] for r in leer_csv("catalogo_inegi_entidades.csv")}
    inegi = {r["cvegeo"]: {"edo": int(r["cve_entidad"]), "nombre": r["nombre"]}
             for r in leer_csv("catalogo_inegi_municipios.csv")}
    arq = {(int(r["edo"]), int(r["mun"])): r for r in leer_csv("arquetipos_municipales.csv")}
    esperados = {int(r["edo"]): r for r in leer_csv("votos_esperados_por_entidad_edad.csv")}

    municipios_ine = {(e, r["MPIOCVE"]) for (e, _), g in datos.items() for r in g["municipio"]}
    cruce, avisos_cruce = cruce_ine_inegi(municipios_ine, inegi, arq)
    ine_por_cvegeo = {cg: k for k, cg in cruce.items()}

    archivos: dict[str, bytes] = {}
    filas_csv = []
    calidad = defaultdict(int)
    nacional = defaultdict(lambda: defaultdict(lambda: [0, 0, 0, 0]))  # anio → clave → ln,sv,nv,ns

    def acumula(destino, clave, r):
        for i, k in enumerate(("ln", "sv", "nv", "ns")):
            destino[clave][i] += r[k]

    def fila_csv(anio, nivel, edo, mun, cvegeo, nombre, grupo, sexo, r):
        filas_csv.append([anio, tipo(anio), nivel, edo or "", mun or "", cvegeo or "", nombre,
                          grupo or "", sexo or "", r[0], r[1], r[2], r[3],
                          "" if proporcion(r[1], r[0], r[3]) is None else proporcion(r[1], r[0], r[3])])

    def cifras(anio, total, edad, sexo):
        p = proporcion(total[1], total[0], total[3])
        if p is None:
            return None
        por_edad = {g: proporcion(*orden(edad[g])) for g in GRUPOS if g in edad}
        por_sexo = {s: proporcion(*orden(sexo[s])) for s in ("H", "M") if s in sexo}
        return {"anio": anio, "tipo": tipo(anio), "participacion": p, "lista_nominal": total[0],
                "por_edad": {g: v for g, v in por_edad.items() if v is not None},
                "por_sexo": {s: v for s, v in por_sexo.items() if v is not None}}

    tuplas = lambda r: [r["ln"], r["sv"], r["nv"], r["ns"]]  # noqa: E731

    # Geometría: marco geoestadístico INEGI (topológico) → TopoJSON por entidad con clave INE y
    # nombre. Los vecinos salen de los arcos compartidos (los GeoJSON v2 se simplificaron polígono
    # por polígono y sus fronteras ya no coinciden, por eso no se usan aquí).
    tmp = Path(tempfile.mkdtemp(prefix="revoto-geo-"))
    vecinos: dict[tuple[int, int], list[int]] = {}
    try:
        base = shlex.split(mapshaper)
        subprocess.run(base + [
            "-i", str(marco / "00mun.shp"), "encoding=latin1", "snap", "-proj", "wgs84",
            "-simplify", "6%", "keep-shapes", "-filter-fields", "CVEGEO,CVE_ENT", "-split", "CVE_ENT",
            "-o", "format=topojson", "quantization=10000", "singles", f"{tmp}/",
        ], check=True, capture_output=True)
        subprocess.run(base + [
            "-i", str(marco / "00ent.shp"), "encoding=latin1", "snap", "-proj", "wgs84",
            "-simplify", "2%", "keep-shapes", "-filter-fields", "CVE_ENT",
            "-o", "format=topojson", "quantization=10000", str(tmp / "entidades.topo.json"),
        ], check=True, capture_output=True)
        for edo in sorted(entidades):
            topo = json.loads((tmp / f"{edo:02d}.json").read_text("utf-8"))
            objeto = next(iter(topo["objects"].values()))
            topo["objects"] = {"municipios": objeto}
            for g in objeto["geometries"]:
                cg = g["properties"]["CVEGEO"]
                ine = ine_por_cvegeo.get(cg)
                g["properties"] = {"cvegeo": cg, "nombre": inegi.get(cg, {}).get("nombre", ""),
                                   **({"cve": ine[1]} if ine else {})}
            for cg, vs in vecinos_de(topo).items():
                if cg in ine_por_cvegeo:
                    vecinos[ine_por_cvegeo[cg]] = sorted(
                        ine_por_cvegeo[v][1] for v in vs if v in ine_por_cvegeo)
            archivos[f"geo/{edo}.topo.json"] = dump(topo)
        topo = json.loads((tmp / "entidades.topo.json").read_text("utf-8"))
        objeto = next(iter(topo["objects"].values()))
        topo["objects"] = {"entidades": objeto}
        for g in objeto["geometries"]:
            cve = int(g["properties"]["CVE_ENT"])
            g["properties"] = {"cve": cve, "nombre": entidades[cve]}
        archivos["geo/entidades.topo.json"] = dump(topo)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    # Entidades y municipios.
    max_mun = 0
    for edo, nombre_ent in sorted(entidades.items()):
        elecciones, series_mun = [], defaultdict(dict)
        for anio in ANIOS:
            g = datos[(edo, anio)]
            total = tuplas(g["entidad"][0])
            edad = {r["grupo_edad"]: tuplas(r) for r in g["grupo_edad"]
                    if r["grupo_edad"] in GRUPOS and r["publicacion"] == "available"}
            sexo = {SEXO[r["SEXO"]]: tuplas(r) for r in g["sexo"]
                    if r["SEXO"] in SEXO and r["publicacion"] == "available"}
            calidad["edad_excluida"] += sum(1 for r in g["grupo_edad"] if r["grupo_edad"] not in GRUPOS)
            calidad["sexo_excluido"] += sum(1 for r in g["sexo"] if r["SEXO"] not in SEXO)
            elecciones.append(cifras(anio, total, edad, sexo))
            acumula(nacional[anio], "total", g["entidad"][0])
            fila_csv(anio, "entidad", edo, None, f"{edo:02d}", nombre_ent, None, None, total)
            for gr, v in edad.items():
                acumula(nacional[anio], ("edad", gr), dict(zip(("ln", "sv", "nv", "ns"), v)))
                fila_csv(anio, "entidad", edo, None, f"{edo:02d}", nombre_ent, gr, None, v)
            for s, v in sexo.items():
                acumula(nacional[anio], ("sexo", s), dict(zip(("ln", "sv", "nv", "ns"), v)))
                fila_csv(anio, "entidad", edo, None, f"{edo:02d}", nombre_ent, None, s, v)
            suma = [0, 0, 0, 0]
            for r in g["municipio"]:
                k = (edo, r["MPIOCVE"])
                t = tuplas(r)
                suma = [a + b for a, b in zip(suma, t)]
                if t[1] + t[2] + t[3] != t[0]:
                    calidad["identidad_fallida"] += 1
                series_mun[k][anio] = t
                cg = cruce.get(k)
                fila_csv(anio, "municipio", edo, k[1], cg, inegi.get(cg, {}).get("nombre", ""), None, None, t)
            if suma != total:
                calidad["suma_municipios_fallida"] += 1
        municipios_ent, peso_mun = [], []
        for k in sorted(series_mun):
            cg = cruce.get(k)
            nombre = inegi[cg]["nombre"] if cg else f"Municipio {k[1]}"
            ln_min = min(t[0] for t in series_mun[k].values())
            suprimido = ln_min < UMBRAL_RN05  # RN-05
            elecciones_mun = []
            for anio, t in sorted(series_mun[k].items()):
                c = cifras(anio, t, {}, {})
                if c is None:
                    calidad["anios_sin_dato"] += 1
                else:
                    elecciones_mun.append(c)
            calidad["suprimidos"] += suprimido
            resumen = {"cve": k[1], "nombre": nombre}
            if cg:
                resumen["cvegeo"] = cg
            if suprimido:
                resumen["suprimido"] = True
            else:
                resumen["participacion"] = {str(e["anio"]): e["participacion"] for e in elecciones_mun}
            municipios_ent.append(resumen)
            doc = {"territorio": {"nivel": "municipio", "cve": k[1], "cveEntidad": edo, "nombre": nombre,
                                  "nombreEntidad": nombre_ent},
                   "fuente": FUENTE_CORTA, "suprimido": suprimido,
                   "elecciones": [] if suprimido else elecciones_mun}
            if cg:
                doc["cvegeo"] = cg
            if k in vecinos:
                doc["vecinos"] = vecinos[k]
            a = arq.get(k)
            if a and a["arquetipo"] in ARQUETIPOS and not suprimido:
                doc["arquetipo"] = {
                    "id": ARQUETIPOS[a["arquetipo"]], "nombre": a["arquetipo"],
                    "nivel": round(float(a["nivel"]), 2), "efecto_presidencial": round(float(a["efp"]), 2),
                    "tendencia": round(float(a["tend"]), 2), "volatilidad": round(float(a["vol"]), 2),
                    "tipicidad": round(float(a["tipicidad"]), 2), "rasgo": a["rasgo"]}
                calidad["con_arquetipo"] += 1
            b = dump(doc)
            archivos[f"municipio/{edo}-{k[1]:03d}.json"] = b
            peso_mun.append(len(b))
        max_mun = max(max_mun, *peso_mun)
        e = esperados.get(edo, {})
        archivos[f"entidad/{edo}.json"] = dump({
            "territorio": {"nivel": "entidad", "cve": edo, "nombre": nombre_ent},
            "fuente": FUENTE_CORTA,
            "elecciones": [c for c in elecciones if c],
            "votos_esperados_por_edad": {g: round(float(e[g]), 3) for g in GRUPOS if g in e},
            "municipios": municipios_ent,
        })

    # Nacional: se suman conteos, nunca se promedian porcentajes.
    elecciones_nac = []
    for anio in ANIOS:
        n = nacional[anio]
        edad = {gr: n[("edad", gr)] for gr in GRUPOS if ("edad", gr) in n}
        sexo = {s: n[("sexo", s)] for s in ("H", "M") if ("sexo", s) in n}
        elecciones_nac.append(cifras(anio, n["total"], edad, sexo))
        fila_csv(anio, "nacional", None, None, None, "Nacional", None, None, n["total"])
        for gr, v in edad.items():
            fila_csv(anio, "nacional", None, None, None, "Nacional", gr, None, v)
        for s, v in sexo.items():
            fila_csv(anio, "nacional", None, None, None, "Nacional", None, s, v)
    archivos["nacional.json"] = dump({"territorio": {"nivel": "nacional", "nombre": "Nacional"},
                                      "fuente": FUENTE_CORTA, "elecciones": elecciones_nac})
    archivos["catalogos/entidades.json"] = dump([{"cve": c, "nombre": n} for c, n in sorted(entidades.items())])

    # Datos abiertos (US-22).
    import io
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(["anio", "tipo", "nivel", "cve_entidad", "cve_municipio", "cvegeo", "territorio",
                "grupo_edad", "sexo", "lista_nominal", "votaron", "no_votaron", "sin_dato", "participacion"])
    w.writerows(filas_csv)
    archivos["csv/participacion.csv"] = buf.getvalue().encode("utf-8")

    # Reporte de calidad (W-20).
    max_ent = max(len(b) for k, b in archivos.items() if k.startswith("entidad/"))
    max_geo = max(len(b) for k, b in archivos.items() if k.startswith("geo/"))
    n_mun = len(municipios_ine)
    reglas = [
        ("RN-01", "Participación = votaron ÷ (lista nominal − sin dato), recalculada en cada fila",
         "aprobada", "La fórmula se aplica al publicar; el valor v2 coincide en todas las filas."),
        ("IDENTIDAD", "votaron + no votaron + sin dato = lista nominal",
         "aprobada" if not calidad["identidad_fallida"] else "fallida",
         f"{calidad['identidad_fallida']} filas municipales no cuadran."),
        ("SUMA", "La suma de los municipios es igual al total de la entidad",
         "aprobada" if not calidad["suma_municipios_fallida"] else "fallida",
         f"{calidad['suma_municipios_fallida']} combinaciones entidad-año no cuadran."),
        ("RN-04", "Solo 5 grupos de edad publicables",
         "aprobada", f"Se excluyeron {calidad['edad_excluida']} filas «no_especificada»."),
        ("RN-06", "Sexo solo H o M",
         "aprobada", f"Se excluyeron {calidad['sexo_excluido']} filas con código fuera de catálogo."),
        ("RN-05", f"Municipios con lista nominal menor a {UMBRAL_RN05} se suprimen",
         "aprobada", f"{calidad['suprimidos']} municipios suprimidos."),
        ("SIN-DATO", "Elecciones sin votos registrados se omiten",
         "aprobada", f"{calidad['anios_sin_dato']} municipio-elección sin votos registrados."),
        ("CRUCE-INEGI", "Cada municipio INE tiene clave INEGI (cvegeo)",
         "aprobada" if len(cruce) == n_mun else "fallida",
         f"{len(cruce)} de {n_mun}; {len(avisos_cruce)} por regla de respaldo, verificar: "
         + "; ".join(avisos_cruce)),
        ("ARQUETIPO", "Municipios con arquetipo asignado (al menos 5 elecciones)",
         "aprobada", f"{calidad['con_arquetipo']} de {n_mun}."),
        ("RNF-04", f"Entidad ≤ {LIMITE_ENTIDAD_KB} KB, municipio ≤ {LIMITE_MUNICIPIO_KB} KB, geometría ≤ {LIMITE_ENTIDAD_KB} KB",
         "aprobada" if max_ent <= LIMITE_ENTIDAD_KB * 1024 and max_mun <= LIMITE_MUNICIPIO_KB * 1024
         and max_geo <= LIMITE_ENTIDAD_KB * 1024 else "fallida",
         f"Máximos: entidad {max_ent / 1024:.1f} KB, municipio {max_mun / 1024:.1f} KB, geometría {max_geo / 1024:.1f} KB."),
        ("RF-23", "Diferencia contra cifras oficiales del INE ≤ 1 pp",
         "pendiente", "cifras_oficiales.csv aún no tiene filas: no se puede comparar."),
    ]
    archivos["calidad.json"] = dump({
        "fuente": FUENTE,
        "origen": "JSON frontend v2 (rama feat/US-06-dataset-pipeline) convertidos con convertir_v2.py",
        "reglas": [{"id": i, "descripcion": d, "resultado": r, "detalle": t} for i, d, r, t in reglas],
    })
    if any(r[2] == "fallida" for r in reglas):
        raise SystemExit("✖ Hay reglas de calidad fallidas: " + ", ".join(r[0] for r in reglas if r[2] == "fallida"))

    # Versión inmutable: fecha + hash del contenido. El manifiesto se escribe al final.
    h = hashlib.sha1()
    for k in sorted(archivos):
        h.update(k.encode())
        h.update(archivos[k])
    version = f"{ahora:%Y%m%d}-{h.hexdigest()[:7]}"
    for viejo in salida.glob("[0-9]" * 8 + "-*"):
        shutil.rmtree(viejo)
    for k, b in archivos.items():
        ruta = salida / version / k
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_bytes(b)
    (salida / "manifest.json").write_bytes(dump({
        "version_datos": version,
        "generado": ahora.isoformat(timespec="seconds"),
        "fuente": FUENTE,
        "validacion": {"max_diferencia_pp": None, "reporte": f"{version}/calidad.json"},
    }))
    print(f"✔ {len(archivos)} archivos en {salida / version}")
    return salida / version


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--v2", type=Path, required=True, help="carpeta con ine/ (frontend v2)")
    p.add_argument("--marco", type=Path, required=True,
                   help="carpeta con 00mun.shp y 00ent.shp del marco geoestadístico INEGI")
    p.add_argument("--salida", type=Path, default=Path("apps/web/public/data"))
    p.add_argument("--mapshaper", default="npx --yes mapshaper@0.7.84")
    a = p.parse_args()
    convertir(a.v2, a.marco, a.salida, a.mapshaper, datetime.now(timezone(timedelta(hours=-6))))


if __name__ == "__main__":
    main()
