# Producto · ReVoto

> Nombre provisional (AP-01). Fuente: SRS Hackathon INE, `docs/diseno/arquitectura-informacion.md`.

## Problema y propuesta

Los datos de participación electoral del INE son públicos pero difíciles de leer. ReVoto los cuenta en **10 pantallas tipo *stories*** en el celular: cuánto votó México, cuánto votó tu territorio, cómo cambió de 2009 a 2024 y cómo varía por edad y sexo. Cada cifra muestra su territorio, periodo y fuente.

## Usuarios

| Actor | Necesidad |
| --- | --- |
| Ciudadanía (principal) | Entender en menos de 2 minutos cuánto vota su territorio y su generación. |
| Investigador / periodista | Consultar y descargar agregados con fuente y metodología. |
| Equipo de datos | Generar y validar los agregados contra cifras oficiales. |

## Secuencia de pantallas

| # | ID | Pantalla | Prioridad |
| --- | --- | --- | --- |
| 1 | W-01 | Portada (lectura fácil, versión ligera, comenzar) | Must |
| 2 | W-02 | Elige tu territorio (entidad → municipio, o nacional) | Must |
| 3 | W-03 | México votó (participación nacional 2024) | Must |
| 4 | W-04 | Tu territorio vs. nacional | Must |
| 5 | W-05 | Quince años de elecciones (2009–2024) | Must |
| 6 | W-06 | Tu generación (5 grupos de edad) | Must |
| 7 | W-07 | Mujeres y hombres | Should |
| 8 | W-08 | Urbano, rural, mixto | Could |
| 9 | W-09 | El arquetipo de tu zona | Should |
| 10 | W-10 | Tu resumen (cierre) | Must |

Salidas laterales que regresan al origen: W-11 Ficha de fuente, W-12 Crear tarjeta, W-13 Ajustes de lectura, W-16 Datos abiertos. Modos y estados: W-14 lector de pantalla, W-15 versión ligera, W-17 carga / error / umbral.

Si W-07, W-08 o W-09 salen del MVP, la secuencia se acorta y la barra de progreso se recalcula.

## Fuera de alcance (Won't)

Cuentas de usuario y capa personal, lenguas indígenas, voto desde el extranjero.
