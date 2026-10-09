# Reglas de negocio

> Fuente: SRS Hackathon INE §5.4. Si este resumen y el SRS difieren, manda el SRS.

| ID | Regla | Dónde se implementa |
| --- | --- | --- |
| RN-01 | Participación = **SV / (LN − NS)**. Los registros sin dato (NS) se excluyen del denominador; no son abstención. | `pipeline/sql/50_marts.sql` |
| RN-02 | Se publica a nivel nacional, entidad y municipio. La sección electoral solo es unidad de cálculo interna. | Pipeline y contrato L4 |
| RN-03 | Intermedias (2009, 2015, 2021) y presidenciales (2012, 2018, 2024) se distinguen visualmente en toda comparación temporal. | `dim_eleccion`, `rellenoSerie` en UI |
| RN-04 | Grupos de edad publicables: 18–24, 25–34, 35–44, 45–59, 60+. La edad simple no se publica. | `dim_grupo_edad`, `GrupoEdad` |
| RN-05 | Un agregado solo se publica si su lista nominal alcanza el umbral del equipo; si no, se eleva al nivel superior. | `pipeline/sql/60_umbral.sql`, `suprimido` |
| RN-06 | Registros con sexo fuera de catálogo se excluyen del desglose por sexo y se reportan. | `pipeline/sql/40_calidad.sql` |
| RN-07 | Los arquetipos solo usan participación, variación histórica o composición etaria. Prohibido aludir a partidos, candidaturas o juzgar a los habitantes. | Contenido de W-09 |
| RN-08 | Ninguna pieza compartible contiene datos que identifiquen a una persona. | W-12 Crear tarjeta |
| RN-09 | Edades fuera de 18–110 se marcan como anómalas, se excluyen y se reportan. | `pipeline/sql/40_calidad.sql` |
| RN-10 | Toda cifra va con su territorio, periodo y fuente. Ninguna cifra aparece sola. | `CifraConContexto`, `ArchivoBase` |

## Cifras de referencia (SRS §8.2)

Participación ajustada nacional: 2009 · 44.1 % · 2012 · 62.1 % · 2015 · 47.1 % · 2018 · 62.4 % · 2021 · 51.8 % · 2024 · 59.7 %.

Úsalas solo para validar resultados del pipeline, no como datos de la app.
